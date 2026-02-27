import asyncio
import logging
from typing import AsyncGenerator, AsyncIterator, Optional

import httpx

from app.models.schemas import FileInfo, ScanStatus

logger = logging.getLogger(__name__)
GRAPH_BASE = "https://graph.microsoft.com/v1.0"


class OneDriveScanner:
    def __init__(self, access_token: str) -> None:
        self._token = access_token
        self._headers = {
            "Authorization": f"Bearer {access_token}",
            "ConsistencyLevel": "eventual",
        }
        self._status = ScanStatus(status="idle")
        self._client: Optional[httpx.AsyncClient] = None

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def get_scan_progress(self) -> ScanStatus:
        return self._status

    async def scan_all_files(self) -> AsyncIterator[FileInfo]:
        self._status = ScanStatus(status="scanning", files_scanned=0)
        async with httpx.AsyncClient(timeout=30) as client:
            self._client = client
            try:
                async for file in self._scan_folder("root", "/"):
                    self._status.files_scanned += 1
                    yield file
                self._status.status = "complete"
            except Exception as exc:
                logger.error("Scan failed: %s", exc)
                self._status.status = "error"
                self._status.message = str(exc)
                raise
            finally:
                self._client = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _scan_folder(self, folder_id: str, path: str) -> AsyncIterator[FileInfo]:
        async for item in self._get_children(folder_id):
            if "folder" in item:
                child_path = f"{path.rstrip('/')}/{item['name']}"
                async for file in self._scan_folder(item["id"], child_path):
                    yield file
            elif "file" in item:
                file_info = self._parse_item(item, path)
                if file_info:
                    yield file_info

    async def _get_children(self, folder_id: str) -> AsyncGenerator[dict, None]:
        if folder_id == "root":
            url: Optional[str] = f"{GRAPH_BASE}/me/drive/root/children?$top=200"
        else:
            url = f"{GRAPH_BASE}/me/drive/items/{folder_id}/children?$top=200"

        while url:
            response = await self._request_with_backoff(url)
            data = response.json()
            for item in data.get("value", []):
                yield item
            url = data.get("@odata.nextLink")

    async def _request_with_backoff(self, url: str) -> httpx.Response:
        assert self._client is not None, "Client not initialised"
        delay = 1.0
        for attempt in range(6):
            resp = await self._client.get(url, headers=self._headers)
            if resp.status_code == 429:
                retry_after = float(resp.headers.get("Retry-After", delay))
                logger.warning("Rate limited; retrying after %.1fs", retry_after)
                await asyncio.sleep(retry_after)
                delay = min(delay * 2, 60)
                continue
            resp.raise_for_status()
            return resp
        raise RuntimeError(f"Exceeded retry limit for {url}")

    @staticmethod
    def _parse_item(item: dict, parent_path: str) -> Optional[FileInfo]:
        file_facet = item.get("file", {})
        hashes = file_facet.get("hashes", {})
        # Prefer quickXorHash; fall back to sha256Hash
        file_hash = hashes.get("quickXorHash") or hashes.get("sha256Hash")

        try:
            return FileInfo(
                id=item["id"],
                name=item["name"],
                path=f"{parent_path.rstrip('/')}/{item['name']}",
                size=item.get("size", 0),
                last_modified=item["lastModifiedDateTime"],
                hash=file_hash,
                mime_type=file_facet.get("mimeType"),
                parent_id=item.get("parentReference", {}).get("id"),
            )
        except Exception as exc:
            logger.warning("Could not parse item %s: %s", item.get("id"), exc)
            return None
