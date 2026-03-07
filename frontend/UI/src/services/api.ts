import axios from 'axios';
import { LogEntry } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const fetchIncidents = async () => {
  const resp = await api.get('/incidents');
  return resp.data;
};

export const fetchLogs = async (limit?: number) => {
  const params = limit != null ? { limit } : {};
  const resp = await api.get<LogEntry[]>('/logs', { params });
  return resp.data;
};

export interface HeatmapItem {
  hour: string;
  errors: number;
  warnings: number;
  info: number;
}

export const fetchHeatmap = async () => {
  const resp = await api.get<HeatmapItem[]>('/stats/heatmap');
  return resp.data;
};

export interface DashboardStats {
  totalLogs24h: number;
  activeIncidents: number;
  pendingAlerts24h: number;
  systemHealthPercent: number;
}

export const fetchDashboardStats = async () => {
  const resp = await api.get<DashboardStats>('/stats/dashboard');
  return resp.data;
};

export interface AIStatus {
  clusteringAccuracy: number;
  forecastingAccuracy: number;
  incidentsDetected: number;
  forecastsGenerated: number;
  lastUpdate: string;
}

export const fetchAIStatus = async () => {
  const resp = await api.get<AIStatus>('/stats/ai');
  return resp.data;
};
