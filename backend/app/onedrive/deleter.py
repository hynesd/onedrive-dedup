import asyncio
import logging
from typing import List, Optional, Set

import httpx

from app.models.schemas import DeleteResult

logger = logging.getLogger(__name__)
GRAPH_BASE = "https://graph.microsoft.com/v1.0"
MAX_RETRY_ATTEMPTS = 6


class OneDriveDeleter:
    def __init__(self, access_token: str) -> None:
        self._headers = {
            "Authorization": f"Bearer {access_token}",
            "ConsistencyLevel": "eventual",
        }

    async def delete_file(self, file_id: str) -> bool:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await self._delete_with_backoff(client, file_id)
            return resp

    async def delete_files(
        self,
        file_ids: List[str],
        safe_ids: Optional[Set[str]] = None,
    ) -> DeleteResult:
        deleted: List[str] = []
        failed: List[dict] = []

        async with httpx.AsyncClient(timeout=20) as client:
            for file_id in file_ids:
                if safe_ids and file_id in safe_ids:
                    failed.append({"id": file_id, "error": "Cannot delete last remaining copy"})
                    continue
                try:
                    success = await self._delete_with_backoff(client, file_id)
                    if success:
                        deleted.append(file_id)
                    else:
                        failed.append({"id": file_id, "error": "Delete returned unexpected status"})
                except Exception as exc:
                    logger.error("Failed to delete %s: %s", file_id, exc)
                    failed.append({"id": file_id, "error": str(exc)})

        return DeleteResult(deleted=deleted, failed=failed)

    async def _delete_with_backoff(self, client: httpx.AsyncClient, file_id: str) -> bool:
        url = f"{GRAPH_BASE}/me/drive/items/{file_id}"
        delay = 1.0
        for attempt in range(MAX_RETRY_ATTEMPTS):
            resp = await client.delete(url, headers=self._headers)
            if resp.status_code == 429:
                retry_after = float(resp.headers.get("Retry-After", delay))
                logger.warning("Rate limited on delete; retrying after %.1fs", retry_after)
                await asyncio.sleep(retry_after)
                delay = min(delay * 2, 60)
                continue
            if resp.status_code in (204, 200):
                return True
            if resp.status_code == 404:
                logger.warning("File %s not found; treating as already deleted", file_id)
                return True
            resp.raise_for_status()
        raise RuntimeError(f"Exceeded retry limit deleting {file_id}")

