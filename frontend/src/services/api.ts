import axios from 'axios';
import type { DuplicateGroup, DuplicateStats, ScanStatus, DeleteResult, User } from '../types';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
});

// Auth
export const getLoginUrl = async (): Promise<string> => {
  const res = await api.get<{ auth_url: string }>('/auth/login');
  return res.data.auth_url;
};

export const getMe = async (): Promise<User> => {
  const res = await api.get<User>('/auth/me');
  return res.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

// Scan
export const startScan = async (): Promise<void> => {
  await api.post('/api/scan/start');
};

export const getScanStatus = async (): Promise<ScanStatus> => {
  const res = await api.get<ScanStatus>('/api/scan/status');
  return res.data;
};

export const resetScan = async (): Promise<void> => {
  await api.post('/api/scan/reset');
};

// Duplicates
export const getDuplicates = async (params?: {
  min_size?: number;
  extensions?: string;
  folder_path?: string;
}): Promise<DuplicateGroup[]> => {
  const res = await api.get<DuplicateGroup[]>('/api/duplicates', { params });
  return res.data;
};

export const getStats = async (): Promise<DuplicateStats> => {
  const res = await api.get<DuplicateStats>('/api/stats');
  return res.data;
};

// Delete
export const deleteFiles = async (fileIds: string[]): Promise<DeleteResult> => {
  const res = await api.post<DeleteResult>('/api/delete', { file_ids: fileIds });
  return res.data;
};
