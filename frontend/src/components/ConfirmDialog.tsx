import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Alert, List, ListItem, ListItemText
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import type { FileItem } from '../types';

interface ConfirmDialogProps {
  open: boolean;
  filesToDelete: FileItem[];
  totalSize: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, filesToDelete, totalSize, onConfirm, onCancel
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          Confirm Deletion
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Deleted files will be moved to the OneDrive recycle bin and can be restored.
        </Alert>
        <Typography variant="body1" gutterBottom>
          You are about to delete <strong>{filesToDelete.length} files</strong> ({formatBytes(totalSize)}).
        </Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto', mt: 1 }}>
          <List dense>
            {filesToDelete.map((f) => (
              <ListItem key={f.id}>
                <ListItemText
                  primary={f.name}
                  secondary={f.path}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete {filesToDelete.length} Files
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
