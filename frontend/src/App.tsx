import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { createLogHubConnection } from './services/signalr';
import { HubConnectionState } from '@microsoft/signalr';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const LiveLogs = React.lazy(() => import('./pages/LiveLogs'));
const IncidentExplorer = React.lazy(() => import('./pages/IncidentExplorer'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ServicesPage = React.lazy(() => import('./pages/admin/ServicesPage'));
const UsersPage = React.lazy(() => import('./pages/admin/UsersPage'));

interface RiskToast {
  id: string;
  message: string;
  service: string;
}

const AppShell: React.FC = () => {
  const auth = useAuth();
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
    <>
      {toastContainer}
      <nav className="navbar">
        <div style={{ fontSize: '1.2rem', fontWeight: 700, marginRight: '2rem', letterSpacing: '0.06em' }}>LogLens</div>
        {auth.isAuthenticated ? (
          <>
            <Link to="/">Live Logs</Link>
            <Link to="/incidents">Incidents</Link>
            <Link to="/dashboard">Dashboard</Link>
            {auth.isAdmin() && <Link to="/admin/services">Services</Link>}
            {auth.isAdmin() && <Link to="/admin/users">Users</Link>}
          </>
        ) : (
          <Link to="/login">Sign In</Link>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {auth.user && (
            <div style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              {auth.user.email}
            </div>
          )}
          {auth.isAuthenticated && (
            <button
              type="button"
              onClick={auth.logout}
              style={{
                border: '1px solid rgba(148,163,184,0.25)',
                background: 'rgba(30,41,59,0.96)',
                color: '#e2e8f0',
                borderRadius: '999px',
                padding: '0.45rem 0.9rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Logout
            </button>
          )}
        </div>
      </nav>
      <div className="container">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<LiveLogs />} />
              <Route path="/incidents" element={<IncidentExplorer />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path="/admin/services" element={<ServicesPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to={auth.isAuthenticated ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
};

export default App;
