import { useState, useEffect, useCallback } from 'react';
import type { UserInfo, DashboardStats, DuplicateGroup, ScanStatus } from '../types';
import { authApi, onedriveApi } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return { user, loading, logout, refetch: fetchUser };
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await onedriveApi.getStats();
      setStats(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}

export function useScan() {
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [scanning, setScanning] = useState(false);

  const startScan = useCallback(async () => {
    setScanning(true);
    try {
      const res = await onedriveApi.startScan();
      setScanStatus(res.data);
    } catch (e) {
      setScanning(false);
      throw e;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    const res = await onedriveApi.getScanStatus();
    setScanStatus(res.data);
    if (res.data.status === 'complete' || res.data.status === 'error') {
      setScanning(false);
    }
    return res.data;
  }, []);

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(async () => {
      const status = await pollStatus();
      if (status.status === 'complete' || status.status === 'error') {
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [scanning, pollStatus]);

  return { scanStatus, scanning, startScan, pollStatus };
}

export function useDuplicates() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDuplicates = useCallback(async (params?: { min_size?: number; extensions?: string; folder_path?: string }) => {
    setLoading(true);
    try {
      const res = await onedriveApi.getDuplicates(params);
      setDuplicates(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { duplicates, loading, fetchDuplicates };
}
