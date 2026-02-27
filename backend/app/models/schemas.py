from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FileItem(BaseModel):
    id: str
    name: str
    path: str
    size: int
    last_modified: datetime
    content_hash: Optional[str] = None
    thumbnail_url: Optional[str] = None
    web_url: Optional[str] = None


class DuplicateGroup(BaseModel):
    hash: str
    files: List[FileItem]
    total_size: int
    reclaimable_size: int
    suggested_keep_id: str


class ScanStatus(BaseModel):
    status: str  # "idle", "scanning", "complete", "error"
    files_scanned: int
    total_files: int
    message: str = ""


class DeleteRequest(BaseModel):
    file_ids: List[str]


class DeleteResult(BaseModel):
    deleted: List[str]
    failed: List[dict]


class DuplicateStats(BaseModel):
    total_files: int
    duplicate_groups: int
    total_duplicates: int
    reclaimable_bytes: int


class ScanFilter(BaseModel):
    min_size_bytes: Optional[int] = None
    extensions: Optional[List[str]] = None
    folder_path: Optional[str] = None
