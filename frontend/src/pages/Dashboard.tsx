import React, { Suspense, useEffect, useState } from 'react';
import ErrorHeatmap from '../components/ErrorHeatmap';
import SystemRiskPanel from '../components/SystemRiskPanel';
import TopFailingServices from '../components/TopFailingServices';
import PredictionChartPlaceholder from '../components/PredictionChartPlaceholder';
import { fetchDashboardStats } from '../services/api';

const formatKolkataTimestamp = (timestamp: string) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return '-';
  }

  return value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<{ totalLogs24h: number; activeIncidents: number; pendingAlerts24h: number; systemHealthPercent: number } | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toISOString());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchDashboardStats();
        if (mounted) {
          setStats(data);
          setStatsError(null);
          setLastRefreshedAt(new Date().toISOString());
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
      <div style={{ marginBottom: '1.2rem' }}>
        <h2 style={{ marginBottom: '0.35rem', color: '#f8fafc', fontSize: '1.9rem' }}>Dashboard</h2>
        <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>
          Last refreshed: {formatKolkataTimestamp(lastRefreshedAt)}
        </div>
      </div>
      <Suspense fallback={<div>Loading system risk...</div>}>
        <SystemRiskPanel />
      </Suspense>
      <Suspense fallback={<div>Loading failing services...</div>}>
        <TopFailingServices />
      </Suspense>
      <Suspense fallback={<div>Loading prediction chart...</div>}>
        <PredictionChartPlaceholder formatTimestamp={formatKolkataTimestamp} />
      </Suspense>
      <Suspense fallback={<div>Loading heatmap...</div>}>
        <ErrorHeatmap />
      </Suspense>
      <div style={{
        padding: '1.15rem',
        background: 'linear-gradient(140deg, rgba(30,41,59,0.86), rgba(15,23,42,0.97))',
        borderRadius: '18px',
        boxShadow: '0 12px 34px rgba(2,6,23,0.42)',
        border: '1px solid rgba(148,163,184,0.2)'
      }}>
        <h3 style={{ marginTop: 0, color: '#f8fafc', letterSpacing: '0.01em' }}>Quick Stats</h3>
        {statsError && (
          <div style={{ color: '#fecaca', marginBottom: '1rem' }}>{statsError}</div>
        )}
        {!statsError && stats == null && (
          <div style={{ color: '#94a3b8', marginBottom: '1rem' }}>No dashboard data available yet.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{
            padding: '0.85rem 0.95rem',
            borderRadius: '14px',
            background: 'linear-gradient(140deg, rgba(14,116,144,0.45), rgba(37,99,235,0.3))',
            boxShadow: '0 8px 24px rgba(14,116,144,0.2)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Logs (24h)</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#eff6ff' }}>{stats?.totalLogs24h ?? '-'}</div>
          </div>
          <div style={{
            padding: '0.85rem 0.95rem',
            borderRadius: '14px',
            background: 'linear-gradient(140deg, rgba(127,29,29,0.58), rgba(220,38,38,0.28))',
            boxShadow: '0 8px 24px rgba(127,29,29,0.26)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#fecaca', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Incidents</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#fee2e2' }}>{stats?.activeIncidents ?? '-'}</div>
          </div>
          <div style={{
            padding: '0.85rem 0.95rem',
            borderRadius: '14px',
            background: 'linear-gradient(140deg, rgba(120,53,15,0.52), rgba(217,119,6,0.26))',
            boxShadow: '0 8px 24px rgba(146,64,14,0.22)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pending Alerts</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#ffedd5' }}>{stats?.pendingAlerts24h ?? '-'}</div>
          </div>
          <div style={{
            padding: '0.85rem 0.95rem',
            borderRadius: '14px',
            background: 'linear-gradient(140deg, rgba(22,101,52,0.52), rgba(34,197,94,0.26))',
            boxShadow: '0 8px 24px rgba(20,83,45,0.22)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#bbf7d0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System Health</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#dcfce7' }}>{stats != null ? `${stats.systemHealthPercent}%` : '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;