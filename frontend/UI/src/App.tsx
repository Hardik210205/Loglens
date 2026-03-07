import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
const LiveLogs = React.lazy(() => import('./pages/LiveLogs'));
const IncidentExplorer = React.lazy(() => import('./pages/IncidentExplorer'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

const App: React.FC = () => {
  return (
    <Router>
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
