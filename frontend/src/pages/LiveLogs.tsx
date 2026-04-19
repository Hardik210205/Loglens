import React, { useEffect, useState } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import LogTable from '../components/LogTable';
import LogSearchFilters, { LogFilters } from '../components/LogSearchFilters';
import { LogEntry } from '../types';
import { fetchLogs } from '../services/api';
import { createLogHubConnection } from '../services/signalr';

const formatKolkataTimestamp = (timestamp: string) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) {
    return '-';
  }

  return value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const LiveLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    searchText: '',
    logLevel: 'All',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    let mounted = true;
    const loadInitial = async () => {
      try {
        const existing = await fetchLogs(100);
        if (mounted) setLogs(existing as LogEntry[]);
      } catch (e) {
        if (mounted) setError(prev => prev || (e instanceof Error ? e.message : 'Failed to load logs'));
      }
    };
    loadInitial();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const connection = createLogHubConnection();

    const handleReceiveLogs = (newLogs: LogEntry[]) => {
      setLogs((prev) => [...newLogs, ...prev].slice(0, 100));
    };

    connection.off('ReceiveLogs');
    connection.on('ReceiveLogs', handleReceiveLogs);

    if (connection.state === HubConnectionState.Disconnected) {
      connection.start()
        .then(() => setError(null))
        .catch((err) => {
          setError(`SignalR connection error: ${err.message}`);
          console.error('SignalR connection failed:', err);
        });
    }

    return () => {
      connection.off('ReceiveLogs', handleReceiveLogs);
    };
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = logs;

    if (filters.searchText) {
      const term = filters.searchText.toLowerCase();
      filtered = filtered.filter((log) =>
        log.message?.toLowerCase().includes(term) ||
        log.metadata?.toLowerCase().includes(term)
      );
    }

    if (filters.logLevel !== 'All') {
      filtered = filtered.filter((log) => log.level === filters.logLevel);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (!Number.isNaN(startDate.getTime())) {
        filtered = filtered.filter((log) => new Date(log.timestamp) >= startDate);
      }
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      if (!Number.isNaN(endDate.getTime())) {
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((log) => new Date(log.timestamp) <= endDate);
      }
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1rem'
      }}>
        <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.85rem', letterSpacing: '0.02em' }}>Live Logs</h2>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          backgroundColor: 'rgba(2, 132, 199, 0.18)',
          borderRadius: '999px',
          padding: '0.3rem 0.8rem',
          color: '#bae6fd',
          fontWeight: 700,
          fontSize: '0.8rem',
          letterSpacing: '0.08em'
        }}>
          <span className="live-dot" />
          LIVE
        </div>
      </div>
      <LogSearchFilters onFiltersChange={setFilters} />
      {error && (
        <div style={{
          color: 'white',
          padding: '1rem',
          backgroundColor: '#ef4444',
          borderRadius: '10px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      <div style={{
        padding: '0.85rem 1rem',
        background: 'linear-gradient(110deg, rgba(12,74,110,0.42), rgba(21,128,61,0.28))',
        borderRadius: '12px',
        marginBottom: '1rem',
        border: '1px solid rgba(94, 234, 212, 0.22)',
        color: '#ccfbf1'
      }}>
        📊 Displaying {filteredLogs.length} of {logs.length} logs
      </div>
      {filteredLogs.length === 0 && !error && (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
          {logs.length === 0 ? 'No logs yet. Waiting for incoming logs...' : 'No logs match your filters.'}
        </p>
      )}
      {filteredLogs.length > 0 && <LogTable logs={filteredLogs} formatTimestamp={formatKolkataTimestamp} />}
    </div>
  );
};

export default LiveLogs;