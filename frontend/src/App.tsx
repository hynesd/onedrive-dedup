import { useState, useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, CircularProgress, Tabs, Tab } from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ScanProgress from './components/ScanProgress';
import DuplicatesList from './components/DuplicatesList';
import { getMe, logout, getStats } from './services/api';
import type { User, DuplicateStats } from './types';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0078d4' },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 1 } },
  },
});

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for auth errors in URL
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      enqueueSnackbar(`Authentication error: ${error}`, { variant: 'error' });
      navigate('/', { replace: true });
    }
  }, [location.search, enqueueSnackbar, navigate]);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const refreshStats = async () => {
    try {
      const s = await getStats();
      setStats(s);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setStats(null);
    navigate('/');
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Box minHeight="100vh" bgcolor="grey.100">
      <Navbar user={user} onLogout={handleLogout} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Dashboard stats={stats} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Scan" />
            <Tab label="Duplicates" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <ScanProgress onScanComplete={() => { refreshStats(); setActiveTab(1); }} />
        )}
        {activeTab === 1 && (
          <DuplicatesList onStatsRefresh={refreshStats} />
        )}
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
