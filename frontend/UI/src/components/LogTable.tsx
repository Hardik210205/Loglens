import React from 'react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
}

const LogTable: React.FC<Props> = ({ logs }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.9rem',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Time</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Level</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Message</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={log.id || idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
              <td style={{
                padding: '0.75rem',
                fontWeight: 'bold',
                color: log.level === 'Error' ? '#d32f2f' : log.level === 'Warning' ? '#f57c00' : '#1976d2',
              }}>
                {log.level}
              </td>
              <td style={{ padding: '0.75rem' }}>{log.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogTable;