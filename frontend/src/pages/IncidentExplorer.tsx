import React, { useEffect, useState } from 'react';
import { fetchIncidents, fetchSystemRisk, IncidentDto } from '../services/api';

interface Incident {
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
  status: 'Active' | 'Resolved';
}

const formatKolkataTimestamp = (timestamp: string) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return '-';
  }

  return value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const IncidentExplorer: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [incidentData, riskData] = await Promise.all([
          fetchIncidents(),
          fetchSystemRisk()
        ]);

        if (mounted) {
          const mapped = incidentData.map((i: IncidentDto) => ({
            id: i.id,
            startTimeUtc: i.startTimeUtc,
            severity: i.severity,
            title: i.title,
            template: i.template,
            serviceName: i.serviceName,
            errorCount: i.errorCount,
            warningCount: i.warningCount,
            firstSeen: i.firstSeen,
            lastSeen: i.lastSeen,
            suggestedCause: i.suggestedCause,
            status: i.status.toLowerCase() === 'resolved' ? 'Resolved' : 'Active',
          }));

          setIncidents(mapped);
          setRiskScore(riskData.score);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load incidents');
          setIncidents([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 5000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const getSeverityColor = (severity: Incident['severity']) => {
    if (severity === 'critical') return '#dc2626';
    if (severity === 'high') return '#f97316';
    if (severity === 'medium') return '#f59e0b';
    return '#38bdf8';
  };

  const getStatusBadge = (status: Incident['status']) => {
    if (status === 'Resolved') {
      return (
        <span style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          backgroundColor: '#d1d5db',
          color: '#374151',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          Resolved
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        Active
      </span>
    );
  };

  if (loading) return <div>Loading incidents...</div>;
  if (error) return (
    <div>
      <h2 style={{ color: '#f8fafc' }}>Incident Explorer</h2>
      <div style={{ color: '#fecaca', padding: '1rem', backgroundColor: 'rgba(127,29,29,0.4)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.35)' }}>
        {error}
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ color: '#f8fafc', fontSize: '1.85rem', letterSpacing: '0.02em', marginTop: 0 }}>Incident Explorer</h2>

      {riskScore != null && riskScore > 70 && incidents.length === 0 && (
        <div style={{
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1rem',
          border: '1px solid rgba(249,115,22,0.35)',
          backgroundColor: 'rgba(124,45,18,0.35)',
          color: '#fed7aa'
        }}>
          Risk is currently {riskScore}% but no incident has been recorded yet. Monitor system behavior closely.
        </div>
      )}

      <div style={{
        padding: '0.9rem 1rem',
        background: 'linear-gradient(135deg, rgba(30,58,138,0.45), rgba(15,118,110,0.35))',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(59,130,246,0.35)',
        color: '#dbeafe'
      }}>
        Found {incidents.length} incidents in the last 24 hours
      </div>

      {incidents.length === 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#86efac',
          backgroundColor: 'rgba(20, 83, 45, 0.45)',
          borderRadius: '12px',
          border: '1px solid rgba(34,197,94,0.35)'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>System Healthy</div>
          <div>No incidents detected in the last 24 hours.</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {incidents.map((incident) => (
          <div
            key={incident.id}
            style={{
              padding: '1.05rem',
              background: 'linear-gradient(130deg, rgba(30,41,59,0.85), rgba(15,23,42,0.97))',
              borderRadius: '16px',
              boxShadow: '0 10px 28px rgba(15, 23, 42, 0.4)',
              border: `1px solid ${getSeverityColor(incident.severity)}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.15rem' }}>🚨</span>
                  <h3 style={{ margin: 0, color: '#f8fafc' }}>{incident.title}</h3>
                  {getStatusBadge(incident.status)}
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#f1f5f9',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: `1px solid ${getSeverityColor(incident.severity)}`
                  }}>
                    {incident.severity}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.4rem',
                  marginBottom: '0.7rem'
                }}>
                  <div style={{ color: '#93c5fd', fontSize: '0.86rem' }}>Service: <strong style={{ color: '#e2e8f0' }}>{incident.serviceName}</strong></div>
                  <div style={{ color: '#93c5fd', fontSize: '0.86rem' }}>Started: <strong style={{ color: '#e2e8f0' }}>{formatKolkataTimestamp(incident.startTimeUtc)}</strong></div>
                  <div style={{ color: '#93c5fd', fontSize: '0.86rem' }}>First Seen: <strong style={{ color: '#e2e8f0' }}>{formatKolkataTimestamp(incident.firstSeen)}</strong></div>
                  <div style={{ color: '#93c5fd', fontSize: '0.86rem' }}>Last Seen: <strong style={{ color: '#e2e8f0' }}>{formatKolkataTimestamp(incident.lastSeen)}</strong></div>
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Suggested Cause: {incident.suggestedCause || 'No cause suggestion available.'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                  Template: {incident.template}
                </div>
              </div>
              <div
                style={{
                  padding: '0.65rem 0.8rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.72)',
                  borderRadius: '10px',
                  textAlign: 'center',
                  minWidth: '112px',
                  border: '1px solid rgba(148, 163, 184, 0.24)'
                }}
              >
                <div style={{ fontSize: '0.79rem', color: '#94a3b8' }}>Errors</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#b91c1c' }}>{incident.errorCount}</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.35rem' }}>Warnings</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#c2410c' }}>{incident.warningCount}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentExplorer;
