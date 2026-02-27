import { useMemo } from 'react';
import { Container, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ScanProgress } from './components/ScanProgress';
import { DuplicatesList } from './components/DuplicatesList';
import { useAuth, useStats, useScan, useDuplicates } from './hooks/useApi';
import type { FileInfo } from './types';

const theme = createTheme({
  palette: {
    primary: { main: '#0078d4' },
    background: { default: '#f5f7fa' },
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: '"Segoe UI", system-ui, sans-serif' },
});

function AppContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats();
  const { scanStatus, scanning, startScan } = useScan();
  const { duplicates } = useDuplicates();

  const allFilesMap = useMemo<Map<string, FileInfo>>(() => {
    const map = new Map<string, FileInfo>();
    duplicates.forEach((g) => g.files.forEach((f) => map.set(f.id, f)));
    return map;
  }, [duplicates]);

  if (authLoading) return null;

  if (!user) return <Login />;

  return (
    <>
      <Navbar user={user} onLogout={logout} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Dashboard stats={stats} loading={statsLoading} />
        <ScanProgress
          scanStatus={scanStatus}
          scanning={scanning}
          onStartScan={async () => {
            try { await startScan(); } catch { /* handled in hook */ }
          }}
        />
        <DuplicatesList
          scanStatus={scanStatus}
          allFiles={allFilesMap}
          onDeleteSuccess={refetchStats}
        />
      </Container>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Box bgcolor="background.default" minHeight="100vh">
          <AppContent />
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
