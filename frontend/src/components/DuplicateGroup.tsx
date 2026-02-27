import React, { useState } from 'react';
import {
  Paper, Typography, Box, Collapse, IconButton, Divider, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { DuplicateGroup as DuplicateGroupType } from '../types';
import FileCard from './FileCard';

interface DuplicateGroupProps {
  group: DuplicateGroupType;
  keepIds: Set<string>;
  onToggleKeep: (fileId: string, groupHash: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const DuplicateGroupComponent: React.FC<DuplicateGroupProps> = ({ group, keepIds, onToggleKeep }) => {
  const [expanded, setExpanded] = useState(true);

  const toDeleteCount = group.files.filter(f => !keepIds.has(f.id)).length;

  return (
    <Paper elevation={2} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
      <Box
        display="flex"
        alignItems="center"
        px={2}
        py={1.5}
        sx={{ cursor: 'pointer', bgcolor: 'grey.50' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight="medium">
            {group.files.length} copies • Save {formatBytes(group.reclaimable_size)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Hash: {group.hash.substring(0, 16)}...
          </Typography>
        </Box>
        <Chip
          label={`${toDeleteCount} to delete`}
          size="small"
          color={toDeleteCount > 0 ? 'error' : 'default'}
          sx={{ mr: 1 }}
        />
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Divider />
        <Box p={2}>
          {group.files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isKeep={keepIds.has(file.id)}
              isSuggested={file.id === group.suggested_keep_id}
              onToggleDelete={(id) => onToggleKeep(id, group.hash)}
              selectionMode="checkbox"
            />
          ))}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default DuplicateGroupComponent;
