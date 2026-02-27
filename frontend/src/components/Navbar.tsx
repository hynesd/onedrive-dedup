import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, Chip } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import type { User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <CloudIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          OneDrive Dedup
        </Typography>
        {user && (
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              avatar={<Avatar>{user.name?.charAt(0)?.toUpperCase()}</Avatar>}
              label={user.name || user.email}
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            <Button color="inherit" onClick={onLogout}>
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
