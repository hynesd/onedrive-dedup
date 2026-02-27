import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, List, ListItem, ListItemText, Alert
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { FileInfo } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface ConfirmDialogProps {
  open: boolean;
  filesToDelete: FileInfo[];
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, filesToDelete, onConfirm, onCancel, deleting
}) => {
  const totalSize = filesToDelete.reduce((sum, f) => sum + f.size, 0);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Deleted files will be moved to your OneDrive <strong>Recycle Bin</strong> and can be restored at any time.
        </Alert>
        <Typography variant="body1" gutterBottom>
          You are about to delete <strong>{filesToDelete.length}</strong> file(s) totaling{' '}
          <strong>{formatBytes(totalSize)}</strong>:
        </Typography>
        <List dense sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1, px: 1 }}>
          {filesToDelete.map((f) => (
            <ListItem key={f.id} disableGutters>
              <ListItemText
                primary={f.name}
                secondary={f.path}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={deleting} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={deleting}
          sx={{ borderRadius: 2 }}
        >
          {deleting ? 'Deleting...' : `Delete ${filesToDelete.length} File(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
