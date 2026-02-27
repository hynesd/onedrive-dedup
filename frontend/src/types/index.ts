export interface User {
  name: string;
  email: string;
  id: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  last_modified: string;
  content_hash: string | null;
  thumbnail_url: string | null;
  web_url: string | null;
}

export interface DuplicateGroup {
  hash: string;
  files: FileItem[];
  total_size: number;
  reclaimable_size: number;
  suggested_keep_id: string;
}

export interface ScanStatus {
  status: 'idle' | 'scanning' | 'complete' | 'error';
  files_scanned: number;
  total_files: number;
  message: string;
}

export interface DuplicateStats {
  total_files: number;
  duplicate_groups: number;
  total_duplicates: number;
  reclaimable_bytes: number;
}

export interface DeleteResult {
  deleted: string[];
  failed: Array<{ id: string; error: string }>;
}
