export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  last_modified: string;
  hash: string | null;
  mime_type: string | null;
  thumbnail_url: string | null;
  parent_id: string | null;
}

export interface DuplicateGroup {
  hash: string;
  files: FileInfo[];
  total_size: number;
  reclaimable_size: number;
  suggested_keep_id: string;
}

export type ScanStatusType = 'idle' | 'scanning' | 'complete' | 'error';

export interface ScanStatus {
  status: ScanStatusType;
  files_scanned: number;
  total_files: number | null;
  message: string | null;
}

export interface UserInfo {
  name: string;
  email: string;
  photo_url: string | null;
}

export interface DashboardStats {
  total_files: number;
  duplicate_groups: number;
  total_reclaimable_size: number;
  scan_status: ScanStatus;
}

export interface DeleteResult {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}
