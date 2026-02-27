import React, { useEffect, useState } from 'react';
import {
  Box, Typography, LinearProgress, Button, Paper, Alert
} from '@mui/material';
import type { ScanStatus } from '../types';
import { getScanStatus, startScan, resetScan } from '../services/api';

interface ScanProgressProps {
  onScanComplete: () => void;
}

const ScanProgress: React.FC<ScanProgressProps> = ({ onScanComplete }) => {
  const [status, setStatus] = useState<ScanStatus>({ status: 'idle', files_scanned: 0, total_files: 0, message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Poll scan status
    const interval = setInterval(async () => {
      try {
        const s = await getScanStatus();
        setStatus(s);
        if (s.status === 'complete') {
          clearInterval(interval);
          onScanComplete();
        } else if (s.status === 'error') {
          clearInterval(interval);
        }
      } catch {
        // ignore poll errors
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [onScanComplete]);

  const handleStartScan = async () => {
    setLoading(true);
    try {
      await startScan();
      const s = await getScanStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    await resetScan();
    const s = await getScanStatus();
    setStatus(s);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        OneDrive Scan
      </Typography>

      {status.status === 'idle' && (
        <Box>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Start a scan to find duplicate files in your OneDrive.
          </Typography>
          <Button variant="contained" onClick={handleStartScan} disabled={loading}>
            Start Scan
          </Button>
        </Box>
      )}

      {status.status === 'scanning' && (
        <Box>
          <Typography sx={{ mb: 1 }}>
            Scanning... {status.files_scanned} files found
          </Typography>
          <LinearProgress sx={{ mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {status.message}
          </Typography>
        </Box>
      )}

      {status.status === 'complete' && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Scan complete! Found {status.files_scanned} files.
          </Alert>
          <Button variant="outlined" size="small" onClick={handleReset}>
            Rescan
          </Button>
        </Box>
      )}

      {status.status === 'error' && (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            Scan failed: {status.message}
          </Alert>
          <Button variant="outlined" size="small" onClick={handleReset}>
            Try Again
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ScanProgress;
