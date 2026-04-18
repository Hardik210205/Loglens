import React, { useEffect, useState } from 'react';
import { fetchSystemRisk, SystemRisk } from '../services/api';

const SystemRiskPanel: React.FC = () => {
  const [risk, setRisk] = useState<SystemRisk | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchSystemRisk();
        if (mounted) {
          setRisk(data);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load risk insight');
        }
      }
    };

    load();
    const timer = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const score = risk?.score ?? 0;
  const scoreColor =
    score <= 40
      ? '#22c55e'
      : score <= 70
        ? '#facc15'
        : score <= 90
          ? '#f97316'
          : '#ef4444';

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '1.25rem',
      borderLeft: `6px solid ${scoreColor}`
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>System Risk</h3>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {!error && risk == null && (
        <div style={{ color: '#6b7280' }}>No risk intelligence available yet.</div>
      )}
      {!error && risk != null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Risk Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: scoreColor }}>{score}%</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Affected Service</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{risk?.affectedService ?? '-'}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Predicted Window</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{risk?.predictedWindow ?? '-'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Reason</div>
            <div style={{ fontSize: '0.95rem' }}>{risk?.reason ?? 'No active risk detected.'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemRiskPanel;
