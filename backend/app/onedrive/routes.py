import logging
from typing import Dict, List, Optional, Set

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request

from app.auth.routes import require_session
from app.models.schemas import (
    DashboardStats,
    DeleteRequest,
    DeleteResult,
    DuplicateGroup,
    DuplicatesFilter,
    FileInfo,
    ScanStatus,
)
from app.onedrive.dedup import DuplicateDetector
from app.onedrive.deleter import OneDriveDeleter
from app.onedrive.scanner import OneDriveScanner

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store keyed by session cookie value (or "default" for simplicity)
scan_store: Dict[str, dict] = {}


def _store_key(request: Request) -> str:
    """Derive a stable store key from the session cookie."""
    return request.cookies.get("session", "default")[:64]


async def _run_scan(access_token: str, store_key: str) -> None:
    scanner = OneDriveScanner(access_token)
    files: List[FileInfo] = []
    scan_store[store_key] = {"status": ScanStatus(status="scanning"), "files": files}
    try:
        async for file in scanner.scan_all_files():
            files.append(file)
            scan_store[store_key]["status"] = scanner.get_scan_progress()
        scan_store[store_key]["status"] = ScanStatus(
            status="complete",
            files_scanned=len(files),
        )
    except Exception as exc:
        logger.error("Background scan error: %s", exc)
        scan_store[store_key]["status"] = ScanStatus(
            status="error",
            files_scanned=len(files),
            message=str(exc),
        )


@router.post("/scan", response_model=ScanStatus)
async def start_scan(request: Request, background_tasks: BackgroundTasks) -> ScanStatus:
    session = require_session(request)
    store_key = _store_key(request)

    current = scan_store.get(store_key, {})
    if current.get("status") and current["status"].status == "scanning":
        return current["status"]

    initial_status = ScanStatus(status="scanning", files_scanned=0)
    scan_store[store_key] = {"status": initial_status, "files": []}
    background_tasks.add_task(_run_scan, session["access_token"], store_key)
    return initial_status


@router.get("/scan/status", response_model=ScanStatus)
async def scan_status(request: Request) -> ScanStatus:
    require_session(request)
    store_key = _store_key(request)
    entry = scan_store.get(store_key)
    if not entry:
        return ScanStatus(status="idle")
    return entry["status"]


@router.get("/duplicates", response_model=List[DuplicateGroup])
async def get_duplicates(
    request: Request,
    min_size: Optional[int] = Query(default=0),
    extensions: Optional[str] = Query(default=None, description="Comma-separated list, e.g. jpg,png"),
    folder_path: Optional[str] = Query(default=None),
) -> List[DuplicateGroup]:
    require_session(request)
    store_key = _store_key(request)
    entry = scan_store.get(store_key)
    if not entry or not entry.get("files"):
        return []

    ext_list: Optional[List[str]] = [e.strip() for e in extensions.split(",")] if extensions else None
    filters = DuplicatesFilter(min_size=min_size, extensions=ext_list, folder_path=folder_path)
    return DuplicateDetector.find_duplicates(entry["files"], filters)


@router.get("/stats", response_model=DashboardStats)
async def get_stats(request: Request) -> DashboardStats:
    require_session(request)
    store_key = _store_key(request)
    entry = scan_store.get(store_key)
    files: List[FileInfo] = entry["files"] if entry else []
    duplicates = DuplicateDetector.find_duplicates(files, None)
    stats = DuplicateDetector.get_stats(files, duplicates)
    if entry:
        stats.scan_status = entry["status"]
    return stats


@router.post("/delete", response_model=DeleteResult)
async def delete_files(request: Request, body: DeleteRequest) -> DeleteResult:
    session = require_session(request)
    store_key = _store_key(request)
    entry = scan_store.get(store_key)
    files: List[FileInfo] = entry["files"] if entry else []

    # Determine which IDs are the last surviving copy of their hash
    duplicates = DuplicateDetector.find_duplicates(files, None)
    all_duplicate_ids = {f.id for g in duplicates for f in g.files}
    suggested_keep_ids = {g.suggested_keep_id for g in duplicates}

    # Build set of IDs we must protect: any file NOT in a duplicate group is unique,
    # or is the last copy (suggested_keep) unless the user explicitly included it
    protected: Set[str] = set()
    for group in duplicates:
        non_deleted = [f for f in group.files if f.id not in body.file_ids]
        if len(non_deleted) == 0:
            # User wants to delete ALL copies – protect the suggested one
            protected.add(group.suggested_keep_id)

    deleter = OneDriveDeleter(session["access_token"])
    result = await deleter.delete_files(body.file_ids, safe_ids=protected)

    # Refresh in-memory store
    if entry:
        deleted_set = set(result.deleted)
        entry["files"] = [f for f in files if f.id not in deleted_set]

    return result
