import asyncio
import httpx
from typing import Optional
from datetime import datetime
from app.models.schemas import FileItem, ScanStatus

GRAPH_BASE = "https://graph.microsoft.com/v1.0"

# Global scan state (in production, use Redis or a database)
_scan_state: dict = {
    "status": "idle",
    "files_scanned": 0,
    "total_files": 0,
    "message": "",
    "files": [],
}


def get_scan_status() -> ScanStatus:
    return ScanStatus(
        status=_scan_state["status"],
        files_scanned=_scan_state["files_scanned"],
        total_files=_scan_state["total_files"],
        message=_scan_state["message"],
    )


def get_scanned_files() -> list[FileItem]:
    return _scan_state["files"]


def remove_files(file_ids: set) -> None:
    _scan_state["files"] = [f for f in _scan_state["files"] if f.id not in file_ids]


def reset_scan():
    _scan_state.update({
        "status": "idle",
        "files_scanned": 0,
        "total_files": 0,
        "message": "",
        "files": [],
    })


async def _fetch_with_retry(client: httpx.AsyncClient, url: str, headers: dict, max_retries: int = 3) -> dict:
    last_status = None
    for attempt in range(max_retries):
        response = await client.get(url, headers=headers)
        last_status = response.status_code
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 5))
            await asyncio.sleep(retry_after)
            continue
        if response.status_code >= 500:
            # Retry transient server errors with exponential backoff
            await asyncio.sleep(2 ** attempt)
            continue
        response.raise_for_status()
        return response.json()
    raise Exception(f"Max retries exceeded for {url}, last status: {last_status}")


async def _scan_folder(client: httpx.AsyncClient, headers: dict, folder_id: Optional[str] = None):
    if folder_id:
        url = f"{GRAPH_BASE}/me/drive/items/{folder_id}/children"
    else:
        url = f"{GRAPH_BASE}/me/drive/root/children"

    url += "?$select=id,name,size,lastModifiedDateTime,file,parentReference,webUrl&$top=200"

    while url:
        data = await _fetch_with_retry(client, url, headers)
        items = data.get("value", [])

        for item in items:
            if "file" in item:
                # It's a file
                hashes = item.get("file", {}).get("hashes", {})
                content_hash = (
                    hashes.get("sha256Hash")
                    or hashes.get("quickXorHash")
                    or None
                )

                parent_ref = item.get("parentReference", {})
                parent_path = parent_ref.get("path", "/drive/root:")
                # Clean up the path prefix
                if ":" in parent_path:
                    parent_path = parent_path.split(":", 1)[1]
                full_path = f"{parent_path}/{item['name']}"

                file_item = FileItem(
                    id=item["id"],
                    name=item["name"],
                    path=full_path,
                    size=item.get("size", 0),
                    last_modified=datetime.fromisoformat(
                        item["lastModifiedDateTime"].replace("Z", "+00:00")
                    ),
                    content_hash=content_hash,
                    web_url=item.get("webUrl"),
                )
                _scan_state["files"].append(file_item)
                _scan_state["files_scanned"] += 1

            elif "folder" in item:
                # Recurse into folder
                await _scan_folder(client, headers, item["id"])

        url = data.get("@odata.nextLink")


async def start_scan(access_token: str):
    reset_scan()
    _scan_state["status"] = "scanning"
    _scan_state["message"] = "Starting scan..."

    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            await _scan_folder(client, headers)

        _scan_state["status"] = "complete"
        _scan_state["message"] = f"Scan complete. Found {_scan_state['files_scanned']} files."
    except Exception as e:
        _scan_state["status"] = "error"
        _scan_state["message"] = str(e)
