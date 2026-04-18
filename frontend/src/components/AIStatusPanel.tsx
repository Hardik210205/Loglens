import React, { useEffect, useState } from 'react';
import { fetchAIStatus, AIStatus } from '../services/api';

const AIStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchAIStatus();
      setStatus(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AI status');
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#22c55e';
    if (accuracy >= 80) return '#3b82f6';
    if (accuracy >= 70) return '#f97316';
    return '#ef4444';
  };

  if (error) return (
    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px' }}>
      {error}
    </div>
  );
  if (!status) return <div>Loading AI status...</div>;

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '2rem'
    }}>
      <h3>💡 AI Analysis Status</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          borderLeft: `4px solid ${getAccuracyColor(status.clusteringAccuracy ?? 0)}`
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Clustering Accuracy</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: getAccuracyColor(status.clusteringAccuracy ?? 0)
          }}>
            {status.clusteringAccuracy}%
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          borderLeft: `4px solid ${getAccuracyColor(status.forecastingAccuracy ?? 0)}`
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Forecasting Accuracy</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: getAccuracyColor(status.forecastingAccuracy ?? 0)
          }}>
            {status.forecastingAccuracy}%
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Incidents Detected</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#8b5cf6'
          }}>
            {status.incidentsDetected}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '4px',
          borderLeft: '4px solid #06b6d4'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Forecasts Generated</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#06b6d4'
          }}>
            {status.forecastsGenerated}
          </div>
        </div>
      </div>
      <div style={{
        marginTop: '1rem',
        fontSize: '0.875rem',
        color: '#999',
        textAlign: 'right'
      }}>
        Last updated: {status.lastUpdate ? new Date(status.lastUpdate).toLocaleTimeString() : '-'}
      </div>
    </div>
  );
};

export default AIStatusPanel;
