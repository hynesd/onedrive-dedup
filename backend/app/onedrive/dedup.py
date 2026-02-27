from collections import defaultdict
from typing import List, Optional
from app.models.schemas import FileItem, DuplicateGroup, DuplicateStats, ScanFilter


def find_duplicates(
    files: List[FileItem],
    scan_filter: Optional[ScanFilter] = None,
) -> List[DuplicateGroup]:
    # Apply filters
    filtered = files
    if scan_filter:
        if scan_filter.min_size_bytes is not None:
            filtered = [f for f in filtered if f.size >= scan_filter.min_size_bytes]
        if scan_filter.extensions:
            exts = [e.lower().lstrip(".") for e in scan_filter.extensions]
            filtered = [
                f for f in filtered
                if "." in f.name and f.name.rsplit(".", 1)[-1].lower() in exts
            ]
        if scan_filter.folder_path:
            filtered = [f for f in filtered if f.path.startswith(scan_filter.folder_path)]

    # Group by content hash
    groups: dict[str, List[FileItem]] = defaultdict(list)
    for file in filtered:
        if file.content_hash:
            groups[file.content_hash].append(file)

    # Keep only groups with 2+ files (actual duplicates)
    duplicate_groups = []
    for hash_val, group_files in groups.items():
        if len(group_files) < 2:
            continue

        # Sort oldest first — suggest keeping the oldest
        sorted_files = sorted(group_files, key=lambda f: f.last_modified)
        suggested_keep = sorted_files[0]

        total_size = sum(f.size for f in sorted_files)
        # Reclaimable = total - one copy
        reclaimable = total_size - sorted_files[0].size

        duplicate_groups.append(
            DuplicateGroup(
                hash=hash_val,
                files=sorted_files,
                total_size=total_size,
                reclaimable_size=reclaimable,
                suggested_keep_id=suggested_keep.id,
            )
        )

    # Sort groups by reclaimable size descending
    duplicate_groups.sort(key=lambda g: g.reclaimable_size, reverse=True)
    return duplicate_groups


def calculate_stats(files: List[FileItem], duplicate_groups: List[DuplicateGroup]) -> DuplicateStats:
    total_duplicates = sum(len(g.files) - 1 for g in duplicate_groups)
    reclaimable = sum(g.reclaimable_size for g in duplicate_groups)
    return DuplicateStats(
        total_files=len(files),
        duplicate_groups=len(duplicate_groups),
        total_duplicates=total_duplicates,
        reclaimable_bytes=reclaimable,
    )
