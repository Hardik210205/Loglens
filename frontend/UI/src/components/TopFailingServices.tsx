import React, { useEffect, useState } from 'react';
import { fetchTopFailingServices, ServiceRiskInsight } from '../services/api';

const TopFailingServices: React.FC = () => {
  const [items, setItems] = useState<ServiceRiskInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await fetchTopFailingServices();
        if (mounted) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load failing services');
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

  const parseTrend = (value: string) => {
    const parsed = Number.parseFloat(value.replace('%', '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '1.25rem'
    }}>
      <h3 style={{ marginTop: 0 }}>Top Failing Services</h3>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      {!error && items.length === 0 && <div style={{ color: '#6b7280' }}>No service degradation data available right now.</div>}
      {!error && items.length > 0 && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '0.75rem',
            fontSize: '0.8rem',
            color: '#6b7280',
            fontWeight: 600,
            padding: '0 0.75rem'
          }}>
            <div>Service</div>
            <div>Error Count</div>
            <div>Change</div>
            <div>Incidents</div>
          </div>
          {items.map((item, index) => {
            const trend = parseTrend(item.trend);
            const trendUp = trend > 0;
            const trendLabel = trendUp ? '↑ spike' : trend < 0 ? '↓ drop' : '→ stable';
            return (
              <div
                key={`${item.serviceName}-${index}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '0.75rem',
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb'
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.serviceName}</div>
                <div>{item.errorRate}</div>
                <div style={{ color: trendUp ? '#dc2626' : trend < 0 ? '#16a34a' : '#6b7280', fontWeight: 600 }}>
                  {`${trend > 0 ? '+' : ''}${trend.toFixed(2)}%`} {trendLabel}
                </div>
                <div>{item.incidentCount}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopFailingServices;
