import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchErrorTrendPrediction } from '../services/api';

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
  formatTimestamp: (timestamp: string) => string;
}

const defaultFormatTimestamp = (timestamp: string) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return '-';
  }

  return value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const PredictionTooltip: React.FC<PredictionTooltipProps> = ({ active, payload, label, formatTimestamp }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const ts = payload[0]?.payload?.rawTimestamp;

  return (
    <div style={{
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      borderRadius: '10px',
      padding: '0.75rem 0.8rem',
      boxShadow: '0 14px 28px rgba(2, 6, 23, 0.45)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: '#e2e8f0' }}>{ts ? formatTimestamp(ts) : label}</div>
      {payload.map((item) => (
        <div key={item.name} style={{ color: item.name === 'predicted' ? '#94a3b8' : '#93c5fd', fontSize: '0.88rem' }}>
          {item.name === 'predicted'
            ? `Predicted: ${item.value} (Prediction based on recent trend)`
            : `Current: ${item.value}`}
        </div>
      ))}
    </div>
  );
};

interface PredictionChartPlaceholderProps {
  formatTimestamp?: (timestamp: string) => string;
}

const PredictionChartPlaceholder: React.FC<PredictionChartPlaceholderProps> = ({ formatTimestamp = defaultFormatTimestamp }) => {
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

  const chartData = useMemo(() => points.map((point) => ({
    ...point,
    t: formatTimestamp(point.rawTimestamp)
  })), [points, formatTimestamp]);

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
        background: 'linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.96))',
        borderRadius: '14px',
        boxShadow: '0 10px 28px rgba(2,6,23,0.38)',
        marginBottom: '1.25rem',
        border: '1px solid rgba(148,163,184,0.2)',
        color: '#94a3b8'
      }}>
        <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Error Trend vs Predicted Trend</h3>
        No data available for trend analysis yet.
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      background: 'linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.96))',
      borderRadius: '14px',
      boxShadow: '0 10px 28px rgba(2,6,23,0.38)',
      marginBottom: '1.25rem'
    }}>
      <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Error Trend vs Predicted Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 8, right: 14, left: 2, bottom: 6 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.24)" />
          <XAxis dataKey="t" tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }} />
          <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }} />
          <Tooltip content={<PredictionTooltip formatTimestamp={formatTimestamp} />} />
          <Area type="natural" dataKey="current" stroke="#38bdf8" fill="#0ea5e9" fillOpacity={0.28} strokeWidth={2.2} activeDot={{ r: 4 }} />
          <Area
            type="natural"
            dataKey="predicted"
            stroke="#c084fc"
            fill="#7c3aed"
            fillOpacity={0.22}
            strokeDasharray="8 4"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictionChartPlaceholder;
