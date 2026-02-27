import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import type { DuplicateStats } from '../types';

interface DashboardProps {
  stats: DuplicateStats | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({
  icon, label, value, color
}) => (
  <Paper elevation={2} sx={{ p: 3, borderRadius: 2, borderLeft: `4px solid ${color}` }}>
    <Box display="flex" alignItems="center" gap={2}>
      <Box sx={{ color }}>{icon}</Box>
      <Box>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
    </Box>
  </Paper>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          icon={<FolderIcon fontSize="large" />}
          label="Total Files Scanned"
          value={stats.total_files.toLocaleString()}
          color="#1976d2"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          icon={<FileCopyIcon fontSize="large" />}
          label="Duplicate Groups"
          value={stats.duplicate_groups.toLocaleString()}
          color="#ed6c02"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          icon={<DeleteIcon fontSize="large" />}
          label="Duplicate Files"
          value={stats.total_duplicates.toLocaleString()}
          color="#d32f2f"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          icon={<StorageIcon fontSize="large" />}
          label="Space Reclaimable"
          value={formatBytes(stats.reclaimable_bytes)}
          color="#2e7d32"
        />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
