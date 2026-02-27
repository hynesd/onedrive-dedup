from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class FileInfo(BaseModel):
    id: str
    name: str
    path: str
    size: int
    last_modified: datetime
    hash: Optional[str] = None
    mime_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    parent_id: Optional[str] = None


class DuplicateGroup(BaseModel):
    hash: str
    files: List[FileInfo]
    total_size: int
    reclaimable_size: int
    suggested_keep_id: str


class ScanStatus(BaseModel):
    status: str  # "idle" | "scanning" | "complete" | "error"
    files_scanned: int = 0
    total_files: Optional[int] = None
    message: Optional[str] = None


class DeleteRequest(BaseModel):
    file_ids: List[str]


class DeleteResult(BaseModel):
    deleted: List[str]
    failed: List[dict]


class UserInfo(BaseModel):
    name: str
    email: str
    photo_url: Optional[str] = None


class DuplicatesFilter(BaseModel):
    min_size: Optional[int] = 0
    extensions: Optional[List[str]] = None
    folder_path: Optional[str] = None


class DashboardStats(BaseModel):
    total_files: int
    duplicate_groups: int
    total_reclaimable_size: int
    scan_status: str
