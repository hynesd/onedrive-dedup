import React from 'react';
import { Box, Checkbox, Typography, Chip, Tooltip, IconButton } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StarIcon from '@mui/icons-material/Star';
import type { FileItem } from '../types';

interface FileCardProps {
  file: FileItem;
  isKeep: boolean;
  isSuggested: boolean;
  onToggleDelete: (id: string) => void;
  selectionMode: 'checkbox' | 'radio';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const FileCard: React.FC<FileCardProps> = ({ file, isKeep, isSuggested, onToggleDelete }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        p: 1.5,
        borderRadius: 1,
        bgcolor: isKeep ? 'success.50' : 'background.paper',
        border: '1px solid',
        borderColor: isKeep ? 'success.main' : 'divider',
        mb: 1,
      }}
    >
      <Checkbox
        checked={isKeep}
        onChange={() => onToggleDelete(file.id)}
        color="success"
        sx={{ mt: -0.5 }}
      />
      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography variant="subtitle2" noWrap title={file.name}>
            {file.name}
          </Typography>
          {isSuggested && (
            <Tooltip title="Suggested to keep (oldest)">
              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            </Tooltip>
          )}
          {isKeep && <Chip label="KEEP" size="small" color="success" />}
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" noWrap title={file.path}>
          📁 {file.path}
        </Typography>
        <Box display="flex" gap={2} mt={0.5}>
          <Typography variant="caption" color="text.secondary">
            {formatBytes(file.size)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Modified: {formatDate(file.last_modified)}
          </Typography>
        </Box>
      </Box>
      {file.web_url && (
        <IconButton size="small" href={file.web_url} target="_blank" rel="noopener noreferrer">
          <OpenInNewIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default FileCard;
