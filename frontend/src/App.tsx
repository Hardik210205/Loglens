import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { createLogHubConnection } from './services/signalr';
import { HubConnectionState } from '@microsoft/signalr';
const LiveLogs = React.lazy(() => import('./pages/LiveLogs'));
const IncidentExplorer = React.lazy(() => import('./pages/IncidentExplorer'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

interface RiskToast {
  id: string;
  message: string;
  service: string;
}

const App: React.FC = () => {
  const [toasts, setToasts] = useState<RiskToast[]>([]);

  useEffect(() => {
    const connection = createLogHubConnection();

    const onAlert = (alert: { type?: string; message?: string; service?: string }) => {
      if (!alert || alert.type !== 'SYSTEM_RISK') {
        return;
      }

      const item: RiskToast = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message: alert.message ?? 'System risk has increased.',
        service: alert.service ?? 'UnknownService'
      };

      setToasts((prev) => [item, ...prev].slice(0, 3));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 6000);
    };

    connection.off('ReceiveAlerts');
    connection.on('ReceiveAlerts', onAlert);

    if (connection.state === HubConnectionState.Disconnected) {
      connection.start().catch(() => {
        // Non-blocking: pages still function with polling.
      });
    }

    return () => {
      connection.off('ReceiveAlerts', onAlert);
    };
  }, []);

  const toastContainer = useMemo(() => (
    <div style={{
      position: 'fixed',
      right: '1rem',
      top: '1rem',
      zIndex: 9999,
      display: 'grid',
      gap: '0.75rem',
      width: 'min(360px, calc(100vw - 2rem))'
    }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{
          backgroundColor: '#7f1d1d',
          color: 'white',
          borderRadius: '8px',
          padding: '0.85rem 1rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.22)'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>SYSTEM RISK</div>
          <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{toast.message}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Service: {toast.service}</div>
        </div>
      ))}
    </div>
  ), [toasts]);

  return (
    <Router>
      {toastContainer}
      <nav className="navbar">
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginRight: '2rem' }}>LogLens</div>
        <Link to="/">Live Logs</Link>
        <Link to="/incidents">Incidents</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <div className="container">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<LiveLogs />} />
            <Route path="/incidents" element={<IncidentExplorer />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
