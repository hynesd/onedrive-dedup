import asyncio
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from typing import Optional

from app.onedrive import scanner, dedup, deleter
from app.models.schemas import (
    ScanStatus, DuplicateGroup, DuplicateStats, DeleteRequest, DeleteResult, ScanFilter
)

router = APIRouter()


def _require_auth(request: Request) -> str:
    token = request.session.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token


@router.post("/scan/start")
async def start_scan(request: Request, background_tasks: BackgroundTasks):
    token = _require_auth(request)
    if scanner.get_scan_status().status == "scanning":
        raise HTTPException(status_code=409, detail="Scan already in progress")
    background_tasks.add_task(scanner.start_scan, token)
    return {"message": "Scan started"}


@router.get("/scan/status", response_model=ScanStatus)
async def get_scan_status(request: Request):
    _require_auth(request)
    return scanner.get_scan_status()


@router.post("/scan/reset")
async def reset_scan(request: Request):
    _require_auth(request)
    scanner.reset_scan()
    return {"message": "Scan reset"}


@router.get("/duplicates", response_model=list[DuplicateGroup])
async def get_duplicates(
    request: Request,
    min_size: Optional[int] = None,
    extensions: Optional[str] = None,
    folder_path: Optional[str] = None,
):
    _require_auth(request)
    files = scanner.get_scanned_files()
    if not files:
        return []

    scan_filter = ScanFilter(
        min_size_bytes=min_size,
        extensions=extensions.split(",") if extensions else None,
        folder_path=folder_path,
    )
    return dedup.find_duplicates(files, scan_filter)


@router.get("/stats", response_model=DuplicateStats)
async def get_stats(
    request: Request,
    min_size: Optional[int] = None,
    extensions: Optional[str] = None,
    folder_path: Optional[str] = None,
):
    _require_auth(request)
    files = scanner.get_scanned_files()
    scan_filter = ScanFilter(
        min_size_bytes=min_size,
        extensions=extensions.split(",") if extensions else None,
        folder_path=folder_path,
    )
    groups = dedup.find_duplicates(files, scan_filter)
    return dedup.calculate_stats(files, groups)


@router.post("/delete", response_model=DeleteResult)
async def delete_files(request: Request, body: DeleteRequest):
    token = _require_auth(request)

    # Safety: ensure we're not deleting ALL copies of any group
    files = scanner.get_scanned_files()
    groups = dedup.find_duplicates(files)

    file_ids_to_delete = set(body.file_ids)
    for group in groups:
        group_ids = {f.id for f in group.files}
        overlap = file_ids_to_delete & group_ids
        if overlap == group_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete all copies of a duplicate group (hash: {group.hash[:8]}...)",
            )

    result = await deleter.delete_files(body.file_ids, token)

    # Remove deleted files from scan state
    scanner.remove_files(set(result.deleted))

    return result
