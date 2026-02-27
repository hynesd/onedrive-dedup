import asyncio
import httpx
from typing import List
from app.models.schemas import DeleteResult

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


async def _delete_file(client: httpx.AsyncClient, file_id: str, headers: dict) -> tuple[bool, str]:
    last_status = None
    for attempt in range(3):
        response = await client.delete(
            f"{GRAPH_BASE}/me/drive/items/{file_id}",
            headers=headers,
        )
        last_status = response.status_code
        if response.status_code == 429:
            retry_after = int(response.headers.get("Retry-After", 5))
            await asyncio.sleep(retry_after)
            continue
        if response.status_code >= 500:
            # Retry transient server errors with exponential backoff
            await asyncio.sleep(2 ** attempt)
            continue
        if response.status_code == 204:
            return True, ""
        return False, f"Delete failed with status {response.status_code}"
    return False, f"Max retries exceeded, last status: {last_status}"


async def delete_files(file_ids: List[str], access_token: str) -> DeleteResult:
    headers = {"Authorization": f"Bearer {access_token}"}
    deleted = []
    failed = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for file_id in file_ids:
            success, error_msg = await _delete_file(client, file_id, headers)
            if success:
                deleted.append(file_id)
            else:
                failed.append({"id": file_id, "error": error_msg})

    return DeleteResult(deleted=deleted, failed=failed)

