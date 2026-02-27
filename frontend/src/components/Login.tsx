import React, { useState } from 'react';
import {
  Box, Button, Typography, Paper, CircularProgress, Container
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import { getLoginUrl } from '../services/api';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const url = await getLoginUrl();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 3, width: '100%' }}>
          <CloudIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            OneDrive Dedup
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Find and remove duplicate files from your OneDrive storage.
            Sign in with your Microsoft account to get started.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudIcon />}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            {loading ? 'Redirecting...' : 'Sign in with Microsoft'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
