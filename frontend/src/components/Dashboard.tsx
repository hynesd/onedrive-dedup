import React from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import StorageIcon from '@mui/icons-material/Storage';
import type { DashboardStats } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
    <CardContent>
      <Box display="flex" alignItems="center" gap={2}>
        <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, loading }) => {
  if (loading) {
    return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;
  }

  if (!stats) return null;

  return (
    <Box mb={4}>
      <Typography variant="h5" fontWeight={700} mb={2}>Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<FolderIcon fontSize="inherit" />}
            label="Total Files"
            value={stats.total_files.toLocaleString()}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<ContentCopyIcon fontSize="inherit" />}
            label="Duplicate Groups"
            value={stats.duplicate_groups.toLocaleString()}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            icon={<StorageIcon fontSize="inherit" />}
            label="Space Reclaimable"
            value={formatBytes(stats.total_reclaimable_size)}
            color="#2e7d32"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
