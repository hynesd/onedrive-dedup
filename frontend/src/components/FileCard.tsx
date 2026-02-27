import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Radio, FormControlLabel } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import type { FileInfo } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface FileCardProps {
  file: FileInfo;
  isSelected: boolean;
  isKeep: boolean;
  onSelect: (id: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, isSelected, isKeep, onSelect }) => {
  const isImage = file.mime_type?.startsWith('image/') ?? false;

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 1,
        border: isSelected ? '2px solid #d32f2f' : isKeep ? '2px solid #2e7d32' : '2px solid transparent',
        opacity: isKeep ? 0.85 : 1,
        transition: 'border-color 0.2s',
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        <Box display="flex" alignItems="flex-start" gap={1.5}>
          <Box sx={{ mt: 0.5, color: isImage ? '#1976d2' : 'text.secondary' }}>
            {isImage ? <ImageIcon /> : <InsertDriveFileIcon />}
          </Box>
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Typography variant="body1" fontWeight={600} noWrap title={file.name}>
                {file.name}
              </Typography>
              <Box display="flex" gap={0.5}>
                {isKeep && <Chip label="Keep" color="success" size="small" />}
                {isSelected && <Chip label="Delete" color="error" size="small" />}
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap title={file.path} sx={{ mb: 0.5 }}>
              {file.path}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">{formatBytes(file.size)}</Typography>
              <Typography variant="caption" color="text.secondary">Modified: {formatDate(file.last_modified)}</Typography>
            </Box>
            {file.thumbnail_url && (
              <Box mt={1}>
                <img src={file.thumbnail_url} alt={file.name} style={{ maxHeight: 80, borderRadius: 4, objectFit: 'cover' }} />
              </Box>
            )}
          </Box>
          <FormControlLabel
            control={
              <Radio
                checked={isSelected}
                onChange={() => onSelect(file.id)}
                color="error"
                size="small"
                disabled={isKeep}
              />
            }
            label="Delete"
            labelPlacement="top"
            sx={{ m: 0, alignItems: 'center' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
