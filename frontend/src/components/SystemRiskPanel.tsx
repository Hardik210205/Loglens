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
      background: 'linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.96))',
      borderRadius: '14px',
      boxShadow: '0 10px 28px rgba(2,6,23,0.38)',
      marginBottom: '1.25rem',
      borderLeft: `6px solid ${scoreColor}`,
      border: '1px solid rgba(148,163,184,0.2)'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#f8fafc' }}>System Risk</h3>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {!error && risk == null && (
        <div style={{ color: '#94a3b8' }}>No risk intelligence available yet.</div>
      )}
      {!error && risk != null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ color: '#93c5fd', fontSize: '0.85rem' }}>Risk Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: scoreColor }}>{score}%</div>
          </div>
          <div>
            <div style={{ color: '#93c5fd', fontSize: '0.85rem' }}>Affected Service</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>{risk?.affectedService ?? '-'}</div>
          </div>
          <div>
            <div style={{ color: '#93c5fd', fontSize: '0.85rem' }}>Predicted Window</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0' }}>{risk?.predictedWindow ?? '-'}</div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ color: '#93c5fd', fontSize: '0.85rem' }}>Reason</div>
            <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>{risk?.reason ?? 'No active risk detected.'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemRiskPanel;
