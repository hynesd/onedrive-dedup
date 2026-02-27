import axios from 'axios';
import type { ScanStatus, DuplicateGroup, DashboardStats, DeleteResult, UserInfo } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const authApi = {
  getLoginUrl: () => `${API_BASE}/auth/login`,
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get<UserInfo>('/auth/me'),
};

export const onedriveApi = {
  startScan: () => api.post<ScanStatus>('/onedrive/scan'),
  getScanStatus: () => api.get<ScanStatus>('/onedrive/scan/status'),
  getDuplicates: (params?: { min_size?: number; extensions?: string; folder_path?: string }) =>
    api.get<DuplicateGroup[]>('/onedrive/duplicates', { params }),
  getStats: () => api.get<DashboardStats>('/onedrive/stats'),
  deleteFiles: (fileIds: string[]) =>
    api.post<DeleteResult>('/onedrive/delete', { file_ids: fileIds }),
};
