import React from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Box, Chip } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import type { UserInfo } from '../types';

interface NavbarProps {
  user: UserInfo | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <CloudIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          OneDrive Dedup
        </Typography>
        {user && (
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              avatar={user.photo_url ? <Avatar src={user.photo_url} /> : <Avatar>{user.name[0]}</Avatar>}
              label={user.name}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            />
            <Button color="inherit" onClick={onLogout} variant="outlined" size="small"
              sx={{ borderColor: 'rgba(255,255,255,0.5)' }}>
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
