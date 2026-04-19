import React from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  formatTimestamp: (timestamp: string) => string;
}

const resolveLevelLabel = (level: string | number | null | undefined) => {
  if (typeof level === 'number') {
    // Matches backend LogLevel enum numeric values.
    const labels: Record<number, string> = {
      0: 'Trace',
      1: 'Debug',
      2: 'Information',
      3: 'Warning',
      4: 'Error',
      5: 'Critical'
    };

    return labels[level] ?? `Level-${level}`;
  }

  if (typeof level === 'string' && level.trim().length > 0) {
    return level;
  }

  return 'Unknown';
};

const getSeverityColor = (level: string | number | null | undefined) => {
  const normalized = resolveLevelLabel(level).toLowerCase();

  if (normalized === 'error' || normalized === 'critical') {
    return {
      text: '#fecaca',
      chipBg: 'rgba(127, 29, 29, 0.55)',
      border: 'rgba(239, 68, 68, 0.45)',
      cardGlow: '0 10px 30px rgba(220, 38, 38, 0.18)'
    };
  }

  if (normalized === 'warning') {
    return {
      text: '#fde68a',
      chipBg: 'rgba(120, 53, 15, 0.52)',
      border: 'rgba(245, 158, 11, 0.45)',
      cardGlow: '0 10px 30px rgba(217, 119, 6, 0.16)'
    };
  }

  return {
    text: '#93c5fd',
    chipBg: 'rgba(30, 64, 175, 0.4)',
    border: 'rgba(59, 130, 246, 0.4)',
    cardGlow: '0 10px 30px rgba(37, 99, 235, 0.14)'
  };
};

const LogTable: React.FC<Props> = ({ logs, formatTimestamp }) => {
  return (
    <div style={{
      display: 'grid',
      gap: '0.85rem',
    }}>
      {logs.map((log, idx) => {
        const tone = getSeverityColor(log.level);
        const levelLabel = resolveLevelLabel(log.level);

        return (
          <article
            key={log.id || idx}
            style={{
              background: 'linear-gradient(140deg, rgba(30,41,59,0.86), rgba(15,23,42,0.96))',
              border: `1px solid ${tone.border}`,
              borderRadius: '16px',
              padding: '1rem 1.05rem',
              boxShadow: tone.cardGlow
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', marginBottom: '0.7rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.22rem 0.62rem',
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: tone.text,
                backgroundColor: tone.chipBg,
                border: `1px solid ${tone.border}`,
                textTransform: 'uppercase'
              }}>
                {levelLabel}
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '0.45rem' }}>
              {log.message || '-'}
            </div>
            {log.metadata && (
              <div style={{
                color: '#94a3b8',
                fontSize: '0.82rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                padding: '0.45rem 0.55rem',
                borderRadius: '10px',
                overflowX: 'auto'
              }}>
                {log.metadata}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default LogTable;