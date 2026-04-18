import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchErrorTrendPrediction, formatUtcTimestamp } from '../services/api';

interface TrendPoint {
  t: string;
  rawTimestamp: string;
  current: number;
  predicted: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: TrendPoint;
}

interface PredictionTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const PredictionTooltip: React.FC<PredictionTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const ts = payload[0]?.payload?.rawTimestamp;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '0.65rem 0.75rem',
      boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{ts ? formatUtcTimestamp(ts) : label}</div>
      {payload.map((item) => (
        <div key={item.name} style={{ color: item.name === 'predicted' ? '#64748b' : '#1e3a8a', fontSize: '0.9rem' }}>
          {item.name === 'predicted'
            ? `Predicted: ${item.value} (Prediction based on recent trend)`
            : `Current: ${item.value}`}
        </div>
      ))}
    </div>
  );
};

const PredictionChartPlaceholder: React.FC = () => {
  const [points, setPoints] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const items = await fetchErrorTrendPrediction();
        if (!mounted) {
          return;
        }

        const mapped = items.map((item) => ({
          t: item.label,
          rawTimestamp: item.bucketStartUtc,
          current: item.currentErrors,
          predicted: item.predictedErrors
        }));

        setPoints(mapped);
        setError(null);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load prediction trend');
          setPoints([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
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

  const chartData = useMemo(() => points, [points]);

  if (loading) {
    return <div>Loading prediction chart...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px' }}>
        {error}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '1.25rem',
        color: '#6b7280'
      }}>
        <h3 style={{ marginTop: 0 }}>Error Trend vs Predicted Trend</h3>
        No data available for trend analysis yet.
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '1.25rem'
    }}>
      <h3 style={{ marginTop: 0 }}>Error Trend vs Predicted Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" />
          <YAxis />
          <Tooltip content={<PredictionTooltip />} />
          <Area type="monotone" dataKey="current" stroke="#2563eb" fill="#bfdbfe" fillOpacity={0.55} />
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#94a3b8"
            fill="#e2e8f0"
            fillOpacity={0.35}
            strokeDasharray="7 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionChartPlaceholder;
