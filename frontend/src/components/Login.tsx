import React from 'react';
import { Box, Button, Card, CardContent, Typography, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import MicrosoftIcon from '@mui/icons-material/Window';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import { authApi } from '../services/api';

export const Login: React.FC = () => {
  const handleLogin = () => {
    window.location.href = authApi.getLoginUrl();
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" px={2}>
      <Card sx={{ maxWidth: 480, width: '100%', borderRadius: 3, boxShadow: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" fontWeight={700} gutterBottom>OneDrive Dedup</Typography>
            <Typography variant="body1" color="text.secondary">
              Find and remove duplicate files from your OneDrive to reclaim storage space.
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <List dense>
            {[
              'Recursively scans all OneDrive files',
              'Detects duplicates by content hash',
              'Interactive review before any deletion',
              'Deleted files go to recycle bin — fully recoverable',
            ].map((text) => (
              <ListItem key={text} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          <Box mt={3} mb={2} p={2} bgcolor="info.light" borderRadius={2} display="flex" alignItems="flex-start" gap={1}>
            <SecurityIcon color="info" fontSize="small" sx={{ mt: 0.3 }} />
            <Typography variant="body2" color="info.contrastText">
              This app requests read and write permissions to your OneDrive. It never accesses file contents — only metadata and hashes provided by Microsoft Graph API.
            </Typography>
          </Box>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<MicrosoftIcon />}
            onClick={handleLogin}
            sx={{ mt: 1, py: 1.5, borderRadius: 2, fontWeight: 600 }}
          >
            Sign in with Microsoft
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};
