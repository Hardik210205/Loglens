import React, { useEffect, useState } from 'react';
import { fetchIncidents } from '../services/api';

interface Incident {
  id: string;
  startTime: string;
  endTime: string | null;
  description: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Low';
  logCount: number;
}

const IncidentExplorer: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchIncidents();
        if (mounted) {
          setIncidents(data.map((i: { id: string; startTime: string; endTime: string | null; description: string; severity: string; logCount: number }) => ({
            id: i.id,
            startTime: i.startTime,
            endTime: i.endTime,
            description: i.description,
            severity: i.severity as Incident['severity'],
            logCount: i.logCount,
          })));
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load incidents');
        setIncidents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return '#ef4444';
      case 'Major':
        return '#f97316';
      case 'Minor':
        return '#eab308';
      case 'Low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getStatusBadge = (endTime: string | null) => {
    if (endTime) {
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
          ✓ Resolved
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
        ⚠ Active
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
      <div style={{
        padding: '1rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        borderLeft: '4px solid #3b82f6'
      }}>
        Found {incidents.length} incidents in the last 24 hours
      </div>

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
                      backgroundColor: getSeverityColor(incident.severity)
                    }}
                  />
                  <h3 style={{ margin: 0 }}>{incident.description}</h3>
                  {getStatusBadge(incident.endTime)}
                </div>
                <div style={{ color: '#666', fontSize: '0.875rem' }}>
                  Started: {new Date(incident.startTime).toLocaleString()}
                  {incident.endTime && (
                    <>
                      {' · '}
                      Ended: {new Date(incident.endTime).toLocaleString()}
                    </>
                  )}
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
                <div style={{ fontSize: '0.875rem', color: '#666' }}>Logs</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{incident.logCount}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {incidents.length === 0 && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#999'
        }}>
          No incidents detected in the last 24 hours. System is healthy! ✨
        </div>
      )}
    </div>
  );
};

export default IncidentExplorer;
