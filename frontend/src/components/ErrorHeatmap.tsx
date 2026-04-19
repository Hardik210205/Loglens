import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchHeatmap } from '../services/api';

const ErrorHeatmap: React.FC = () => {
  const [data, setData] = useState<{ hour: string; errors: number; warnings: number; info: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const items = await fetchHeatmap();
        if (mounted) {
          setData(items);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load heatmap');
          setData([]);
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

  if (loading) return <div>Loading heatmap...</div>;
  if (error) return (
    <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '8px' }}>
      {error}
    </div>
  );

  return (
    <div style={{
      padding: '1rem',
      background: 'linear-gradient(145deg, rgba(30,41,59,0.85), rgba(15,23,42,0.96))',
      borderRadius: '14px',
      boxShadow: '0 10px 28px rgba(2,6,23,0.38)',
      border: '1px solid rgba(148,163,184,0.2)',
      marginBottom: '2rem'
    }}>
      <h3 style={{ marginTop: 0, color: '#f8fafc' }}>24-Hour Error Density Heatmap</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="hour" tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.24)' }} />
          <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(148,163,184,0.24)' }} />
          <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '10px', color: '#f8fafc' }} />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
          <Bar dataKey="errors" stackId="a" fill="#ef4444" />
          <Bar dataKey="warnings" stackId="a" fill="#f97316" />
          <Bar dataKey="info" stackId="a" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ErrorHeatmap;
