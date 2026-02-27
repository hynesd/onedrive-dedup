import React from 'react';
import { Box, Button, LinearProgress, Typography, Paper, CircularProgress } from '@mui/material';
import ScannerIcon from '@mui/icons-material/Scanner';
import type { ScanStatus } from '../types';

interface ScanProgressProps {
  scanStatus: ScanStatus | null;
  scanning: boolean;
  onStartScan: () => void;
}

export const ScanProgress: React.FC<ScanProgressProps> = ({ scanStatus, scanning, onStartScan }) => {
  const isIdle = !scanStatus || scanStatus.status === 'idle';
  const isComplete = scanStatus?.status === 'complete';
  const isError = scanStatus?.status === 'error';

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <ScannerIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>OneDrive Scan</Typography>
      </Box>

      {isIdle && !scanning && (
        <Box>
          <Typography color="text.secondary" mb={2}>
            Start a scan to find duplicate files in your OneDrive.
          </Typography>
          <Button variant="contained" onClick={onStartScan} startIcon={<ScannerIcon />} sx={{ borderRadius: 2 }}>
            Start Scan
          </Button>
        </Box>
      )}

      {scanning && (
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CircularProgress size={20} />
            <Typography>
              Scanning... {scanStatus?.files_scanned ?? 0} files found
            </Typography>
          </Box>
          <LinearProgress sx={{ borderRadius: 1 }} />
        </Box>
      )}

      {isComplete && (
        <Box>
          <Typography color="success.main" fontWeight={600} mb={1}>
            ✓ Scan complete — {scanStatus.files_scanned} files scanned
          </Typography>
          <Button variant="outlined" onClick={onStartScan} size="small" sx={{ borderRadius: 2 }}>
            Re-scan
          </Button>
        </Box>
      )}

      {isError && (
        <Box>
          <Typography color="error.main" mb={1}>
            Scan failed: {scanStatus?.message ?? 'Unknown error'}
          </Typography>
          <Button variant="outlined" color="error" onClick={onStartScan} size="small" sx={{ borderRadius: 2 }}>
            Retry
          </Button>
        </Box>
      )}
    </Paper>
  );
};
