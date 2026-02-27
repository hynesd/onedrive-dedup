from collections import defaultdict
from typing import Dict, List, Optional

from app.models.schemas import DashboardStats, DuplicateGroup, DuplicatesFilter, FileInfo


class DuplicateDetector:
    @staticmethod
    def find_duplicates(
        files: List[FileInfo],
        filters: Optional[DuplicatesFilter] = None,
    ) -> List[DuplicateGroup]:
        # Group files by hash, ignoring files without a hash
        groups: Dict[str, List[FileInfo]] = defaultdict(list)
        for f in files:
            if f.hash:
                groups[f.hash].append(f)

        result: List[DuplicateGroup] = []
        for file_hash, file_list in groups.items():
            if len(file_list) < 2:
                continue

            # Sort oldest first; keep oldest as suggested copy
            sorted_files = sorted(file_list, key=lambda f: f.last_modified)
            total_size = sum(f.size for f in sorted_files)
            reclaimable = total_size - sorted_files[0].size  # keep one copy

            group = DuplicateGroup(
                hash=file_hash,
                files=sorted_files,
                total_size=total_size,
                reclaimable_size=reclaimable,
                suggested_keep_id=sorted_files[0].id,
            )

            if filters and not DuplicateDetector._passes_filter(group, filters):
                continue

            result.append(group)

        # Sort groups by reclaimable size descending so biggest wins appear first
        result.sort(key=lambda g: g.reclaimable_size, reverse=True)
        return result

    @staticmethod
    def _passes_filter(group: DuplicateGroup, filters: DuplicatesFilter) -> bool:
        min_size = filters.min_size or 0
        if group.total_size < min_size:
            return False

        if filters.extensions:
            exts = {e.lower().lstrip(".") for e in filters.extensions}
            # Keep group only if at least one file matches a requested extension
            if not any(f.name.rsplit(".", 1)[-1].lower() in exts for f in group.files):
                return False

        if filters.folder_path:
            prefix = filters.folder_path.rstrip("/") + "/"
            if not any(f.path.startswith(prefix) for f in group.files):
                return False

        return True

    @staticmethod
    def get_stats(files: List[FileInfo], duplicates: List[DuplicateGroup]) -> DashboardStats:
        total_reclaimable = sum(g.reclaimable_size for g in duplicates)
        return DashboardStats(
            total_files=len(files),
            duplicate_groups=len(duplicates),
            total_reclaimable_size=total_reclaimable,
            scan_status="complete" if files else "idle",
        )
