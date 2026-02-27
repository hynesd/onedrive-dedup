import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment, Paper,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSnackbar } from 'notistack';
import { DuplicateGroupCard } from './DuplicateGroup';
import { ConfirmDialog } from './ConfirmDialog';
import { useDuplicates } from '../hooks/useApi';
import { onedriveApi } from '../services/api';
import type { FileInfo, ScanStatus } from '../types';

interface DuplicatesListProps {
  scanStatus: ScanStatus | null;
  allFiles: Map<string, FileInfo>;
  onDeleteSuccess: () => void;
}

export const DuplicatesList: React.FC<DuplicatesListProps> = ({ scanStatus, allFiles, onDeleteSuccess }) => {
  const { duplicates, loading, fetchDuplicates } = useDuplicates();
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [folderFilter, setFolderFilter] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (scanStatus?.status === 'complete') {
      fetchDuplicates();
    }
  }, [scanStatus?.status, fetchDuplicates]);

  const handleToggleDelete = useCallback((id: string) => {
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAllDuplicates = useCallback((ids: string[]) => {
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    const allDuplicateIds = duplicates.flatMap((g) =>
      g.files.filter((f) => f.id !== g.suggested_keep_id).map((f) => f.id)
    );
    setSelectedToDelete(new Set(allDuplicateIds));
  };

  const handleClearAll = () => setSelectedToDelete(new Set());

  const filesToDelete: FileInfo[] = Array.from(selectedToDelete)
    .map((id) => allFiles.get(id))
    .filter((f): f is FileInfo => !!f);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await onedriveApi.deleteFiles(Array.from(selectedToDelete));
      if (result.data.deleted.length > 0) {
        enqueueSnackbar(`Successfully deleted ${result.data.deleted.length} file(s)`, { variant: 'success' });
      }
      if (result.data.failed.length > 0) {
        enqueueSnackbar(`Failed to delete ${result.data.failed.length} file(s)`, { variant: 'error' });
      }
      setSelectedToDelete(new Set());
      setConfirmOpen(false);
      await fetchDuplicates(folderFilter ? { folder_path: folderFilter } : undefined);
      onDeleteSuccess();
    } catch {
      enqueueSnackbar('Deletion failed. Please try again.', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredDuplicates = folderFilter
    ? duplicates.filter((g) => g.files.some((f) => f.path.toLowerCase().includes(folderFilter.toLowerCase())))
    : duplicates;

  if (scanStatus?.status !== 'complete') {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {scanStatus?.status === 'scanning'
            ? 'Scan in progress — duplicates will appear here when complete.'
            : 'Run a scan to find duplicate files.'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Duplicate Files {!loading && `(${filteredDuplicates.length} groups)`}
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button size="small" variant="outlined" onClick={handleSelectAll} sx={{ borderRadius: 2 }}>
            Select All Duplicates
          </Button>
          <Button size="small" variant="text" onClick={handleClearAll} sx={{ borderRadius: 2 }}>
            Clear Selection
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={selectedToDelete.size === 0}
            onClick={() => setConfirmOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Delete Selected ({selectedToDelete.size})
          </Button>
        </Box>
      </Box>

      <Accordion sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }} elevation={1}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" fontWeight={500}>Filter Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            size="small"
            label="Filter by folder path"
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 280 }}
          />
        </AccordionDetails>
      </Accordion>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : filteredDuplicates.length === 0 ? (
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          No duplicate files found. Your OneDrive is clean!
        </Alert>
      ) : (
        filteredDuplicates.map((group) => (
          <DuplicateGroupCard
            key={group.hash}
            group={group}
            selectedToDelete={selectedToDelete}
            onToggleDelete={handleToggleDelete}
            onSelectAllDuplicates={handleSelectAllDuplicates}
          />
        ))
      )}

      <ConfirmDialog
        open={confirmOpen}
        filesToDelete={filesToDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
        deleting={deleting}
      />
    </Box>
  );
};
