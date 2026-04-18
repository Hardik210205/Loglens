import React, { useEffect, useState } from 'react';
import { fetchIncidents, fetchSystemRisk, formatUtcTimestamp, IncidentDto } from '../services/api';

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
    return '#22c55e';
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
      <h2>Incident Explorer</h2>
      <div style={{ color: '#ef4444', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
        {error}
      </div>
    </div>
  );

  return (
    <div>
      <h2>Incident Explorer</h2>

      {riskScore != null && riskScore > 70 && incidents.length === 0 && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          borderLeft: '4px solid #f97316',
          backgroundColor: '#fff7ed',
          color: '#9a3412'
        }}>
          Risk is currently {riskScore}% but no incident has been recorded yet. Monitor system behavior closely.
        </div>
      )}

      <div style={{
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        borderLeft: '4px solid #3b82f6'
      }}>
        Found {incidents.length} incidents in the last 24 hours
      </div>

      {incidents.length === 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#166534',
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
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
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${getSeverityColor(incident.severity)}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: incident.status === 'Active' ? '#ef4444' : '#6b7280'
                    }}
                  />
                  <h3 style={{ margin: 0 }}>{incident.title}</h3>
                  {getStatusBadge(incident.status)}
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {incident.severity}
                  </span>
                </div>
                <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Service: {incident.serviceName}
                </div>
                <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Start Time: {formatUtcTimestamp(incident.startTimeUtc)}
                </div>
                <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  First Seen: {formatUtcTimestamp(incident.firstSeen)} · Last Seen: {formatUtcTimestamp(incident.lastSeen)}
                </div>
                <div style={{ color: '#111827', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                  Suggested Cause: {incident.suggestedCause || 'No cause suggestion available.'}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                  Template: {incident.template}
                </div>
              </div>
              <div
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                  textAlign: 'center',
                  minWidth: '80px'
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Errors</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#b91c1c' }}>{incident.errorCount}</div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.35rem' }}>Warnings</div>
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
