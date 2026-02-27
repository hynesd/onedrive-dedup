import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  CircularProgress, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import type { DuplicateGroup as DuplicateGroupType, FileItem } from '../types';
import { getDuplicates, deleteFiles } from '../services/api';
import DuplicateGroupComponent from './DuplicateGroup';
import ConfirmDialog from './ConfirmDialog';
import { useSnackbar } from 'notistack';

interface DuplicatesListProps {
  onStatsRefresh: () => void;
}

const DuplicatesList: React.FC<DuplicatesListProps> = ({ onStatsRefresh }) => {
  const [groups, setGroups] = useState<DuplicateGroupType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepIds, setKeepIds] = useState<Record<string, Set<string>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [extensionFilter, setExtensionFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const loadDuplicates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDuplicates({
        extensions: extensionFilter || undefined,
        folder_path: folderFilter || undefined,
      });
      setGroups(data);
      // Initialize keep sets: default = suggested keep
      const initialKeep: Record<string, Set<string>> = {};
      data.forEach(g => {
        initialKeep[g.hash] = new Set([g.suggested_keep_id]);
      });
      setKeepIds(initialKeep);
    } catch {
      setError('Failed to load duplicates');
    } finally {
      setLoading(false);
    }
  }, [extensionFilter, folderFilter]);

  useEffect(() => {
    loadDuplicates();
  }, [loadDuplicates]);

  const handleToggleKeep = (fileId: string, groupHash: string) => {
    setKeepIds(prev => {
      const groupSet = new Set(prev[groupHash] || []);
      const group = groups.find(g => g.hash === groupHash);
      if (!group) return prev;

      if (groupSet.has(fileId)) {
        // Must keep at least one
        if (groupSet.size <= 1) return prev;
        groupSet.delete(fileId);
      } else {
        groupSet.add(fileId);
      }
      return { ...prev, [groupHash]: groupSet };
    });
  };

  const getFilesToDelete = (): FileItem[] => {
    const toDelete: FileItem[] = [];
    groups.forEach(group => {
      const keeps = keepIds[group.hash] || new Set();
      group.files.forEach(f => {
        if (!keeps.has(f.id)) toDelete.push(f);
      });
    });
    return toDelete;
  };

  const filesToDelete = getFilesToDelete();
  const totalDeleteSize = filesToDelete.reduce((sum, f) => sum + f.size, 0);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setConfirmOpen(false);
    try {
      const result = await deleteFiles(filesToDelete.map(f => f.id));
      enqueueSnackbar(`Deleted ${result.deleted.length} files`, { variant: 'success' });
      if (result.failed.length > 0) {
        enqueueSnackbar(`${result.failed.length} files failed to delete`, { variant: 'warning' });
      }
      await loadDuplicates();
      onStatsRefresh();
    } catch {
      enqueueSnackbar('Delete operation failed', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          size="small"
          label="File extensions"
          placeholder="jpg,png,pdf"
          value={extensionFilter}
          onChange={e => setExtensionFilter(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          size="small"
          label="Folder path"
          placeholder="/Documents"
          value={folderFilter}
          onChange={e => setFolderFilter(e.target.value)}
        />
        <Button variant="outlined" onClick={loadDuplicates}>
          Apply Filters
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {groups.length === 0 && !loading && (
        <Alert severity="info">No duplicate files found. Run a scan first.</Alert>
      )}

      {/* Action bar */}
      {groups.length > 0 && (
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="body2" color="text.secondary">
            {groups.length} duplicate groups • {filesToDelete.length} files selected for deletion
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteSweepIcon />}
            disabled={filesToDelete.length === 0 || deleting}
            onClick={() => setConfirmOpen(true)}
          >
            Delete Selected ({filesToDelete.length})
          </Button>
        </Box>
      )}

      {/* Groups */}
      {groups.map(group => (
        <DuplicateGroupComponent
          key={group.hash}
          group={group}
          keepIds={keepIds[group.hash] || new Set()}
          onToggleKeep={handleToggleKeep}
        />
      ))}

      <ConfirmDialog
        open={confirmOpen}
        filesToDelete={filesToDelete}
        totalSize={totalDeleteSize}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
};

export default DuplicatesList;
