import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Divider, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FileCard } from './FileCard';
import type { DuplicateGroup as DuplicateGroupType } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface DuplicateGroupProps {
  group: DuplicateGroupType;
  selectedToDelete: Set<string>;
  onToggleDelete: (id: string) => void;
  onSelectAllDuplicates: (ids: string[]) => void;
}

export const DuplicateGroupCard: React.FC<DuplicateGroupProps> = ({
  group,
  selectedToDelete,
  onToggleDelete,
  onSelectAllDuplicates,
}) => {
  const [expanded, setExpanded] = useState(true);

  const duplicateIds = group.files
    .filter((f) => f.id !== group.suggested_keep_id)
    .map((f) => f.id);

  const allDuplicatesSelected = duplicateIds.every((id) => selectedToDelete.has(id));

  return (
    <Paper sx={{ p: 2.5, mb: 2, borderRadius: 3, boxShadow: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <ContentCopyIcon color="warning" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            {group.files.length} copies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            · {formatBytes(group.reclaimable_size)} reclaimable
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title={allDuplicatesSelected ? 'Deselect all duplicates in this group' : 'Select all duplicates for deletion (keep oldest)'}>
            <Button
              size="small"
              variant={allDuplicatesSelected ? 'outlined' : 'contained'}
              color="warning"
              onClick={() => onSelectAllDuplicates(duplicateIds)}
              sx={{ borderRadius: 2 }}
            >
              {allDuplicatesSelected ? 'Deselect All' : 'Select Duplicates'}
            </Button>
          </Tooltip>
          <Button size="small" variant="text" onClick={() => setExpanded(!expanded)} sx={{ borderRadius: 2 }}>
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 1.5 }} />
      {expanded && (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {group.files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isSelected={selectedToDelete.has(file.id)}
              isKeep={file.id === group.suggested_keep_id}
              onSelect={onToggleDelete}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
};
