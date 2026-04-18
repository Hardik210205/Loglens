import React, { Suspense, useEffect, useState } from 'react';
import ErrorHeatmap from '../components/ErrorHeatmap';
import SystemRiskPanel from '../components/SystemRiskPanel';
import TopFailingServices from '../components/TopFailingServices';
import PredictionChartPlaceholder from '../components/PredictionChartPlaceholder';
import { fetchDashboardStats } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<{ totalLogs24h: number; activeIncidents: number; pendingAlerts24h: number; systemHealthPercent: number } | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchDashboardStats();
        if (mounted) {
          setStats(data);
          setStatsError(null);
        }
      } catch (e) {
        if (mounted) setStatsError(e instanceof Error ? e.message : 'Failed to load stats');
      }
    };
    load();
    const timer = setInterval(load, 5000);
    return () => { clearInterval(timer); mounted = false; };
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <Suspense fallback={<div>Loading system risk...</div>}>
        <SystemRiskPanel />
      </Suspense>
      <Suspense fallback={<div>Loading failing services...</div>}>
        <TopFailingServices />
      </Suspense>
      <Suspense fallback={<div>Loading prediction chart...</div>}>
        <PredictionChartPlaceholder />
      </Suspense>
      <Suspense fallback={<div>Loading heatmap...</div>}>
        <ErrorHeatmap />
      </Suspense>
      <div style={{
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h3>Quick Stats</h3>
        {statsError && (
          <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{statsError}</div>
        )}
        {!statsError && stats == null && (
          <div style={{ color: '#6b7280', marginBottom: '1rem' }}>No dashboard data available yet.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Logs (24h)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats?.totalLogs24h ?? '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Active Incidents</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{stats?.activeIncidents ?? '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Pending Alerts</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f97316' }}>{stats?.pendingAlerts24h ?? '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>System Health</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>{stats != null ? `${stats.systemHealthPercent}%` : '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;