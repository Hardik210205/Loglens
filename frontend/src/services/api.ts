import axios from 'axios';
import { LogEntry } from '../types';

const api = axios.create({
  baseURL: '/api',
});

export interface IncidentDto {
  id: string;
  startTimeUtc: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  template: string;
  serviceName: string;
  errorCount: number;
  warningCount: number;
  firstSeen: string;
  lastSeen: string;
  suggestedCause: string;
  status: string;
}

export const fetchIncidents = async () => {
  try {
    const resp = await api.get<IncidentDto[]>('/incidents');
    return resp.data ?? [];
  } catch {
    return [];
  }
};

export const fetchLogs = async (limit?: number) => {
  try {
    const params = limit != null ? { limit } : {};
    const resp = await api.get<LogEntry[]>('/logs', { params });
    return resp.data ?? [];
  } catch {
    return [];
  }
};

export interface HeatmapItem {
  hour: string;
  errors: number;
  warnings: number;
  info: number;
}

export const fetchHeatmap = async () => {
  try {
    const resp = await api.get<HeatmapItem[]>('/stats/heatmap');
    return resp.data ?? [];
  } catch {
    return [];
  }
};

export interface DashboardStats {
  totalLogs24h: number;
  activeIncidents: number;
  pendingAlerts24h: number;
  systemHealthPercent: number;
}

export const fetchDashboardStats = async () => {
  try {
    const resp = await api.get<DashboardStats>('/dashboard/stats');
    return resp.data ?? {
      totalLogs24h: 0,
      activeIncidents: 0,
      pendingAlerts24h: 0,
      systemHealthPercent: 100
    };
  } catch {
    return {
      totalLogs24h: 0,
      activeIncidents: 0,
      pendingAlerts24h: 0,
      systemHealthPercent: 100
    };
  }
};

export interface AIStatus {
  clusteringAccuracy: number;
  forecastingAccuracy: number;
  incidentsDetected: number;
  forecastsGenerated: number;
  lastUpdate: string;
}

export const fetchAIStatus = async () => {
  try {
    const resp = await api.get<AIStatus>('/stats/ai');
    return resp.data;
  } catch {
    return {
      clusteringAccuracy: 0,
      forecastingAccuracy: 0,
      incidentsDetected: 0,
      forecastsGenerated: 0,
      lastUpdate: new Date().toISOString()
    };
  }
};

export interface SystemRisk {
  score: number;
  reason: string;
  affectedService: string;
  predictedWindow: string;
}

export const fetchSystemRisk = async () => {
  try {
    const resp = await api.get<SystemRisk>('/insights/risk');
    return resp.data ?? {
      score: 0,
      reason: 'No data available',
      affectedService: 'None',
      predictedWindow: 'No immediate risk'
    };
  } catch {
    return {
      score: 0,
      reason: 'Service temporarily unavailable',
      affectedService: 'None',
      predictedWindow: 'No immediate risk'
    };
  }
};

export interface ServiceRiskInsight {
  serviceName: string;
  errorRate: number;
  trend: string;
  incidentCount: number;
}

export const fetchTopFailingServices = async () => {
  try {
    const resp = await api.get<ServiceRiskInsight[]>('/services/top-failing');
    return resp.data ?? [];
  } catch {
    return [];
  }
};

export interface ErrorTrendPoint {
  bucketStartUtc: string;
  label: string;
  currentErrors: number;
  predictedErrors: number;
}

export const fetchErrorTrendPrediction = async () => {
  try {
    const resp = await api.get<ErrorTrendPoint[]>('/insights/prediction');
    return resp.data ?? [];
  } catch {
    return [];
  }
};

export const formatUtcTimestamp = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short'
  }).format(d);
};
