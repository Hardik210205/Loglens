import React, { useEffect, useState } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import LogTable from '../components/LogTable';
import LogSearchFilters, { LogFilters } from '../components/LogSearchFilters';
import { LogEntry } from '../types';
import { fetchLogs } from '../services/api';
import { createLogHubConnection } from '../services/signalr';

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

    setFilteredLogs(filtered);
  }, [logs, filters]);

  return (
    <div>
      <h2>Live Logs</h2>
      <LogSearchFilters onFiltersChange={setFilters} />
      {error && (
        <div style={{
          color: 'white',
          padding: '1rem',
          backgroundColor: '#ef4444',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      <div style={{
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '4px',
        marginBottom: '1rem',
        borderLeft: '4px solid #22c55e'
      }}>
        📊 Displaying {filteredLogs.length} of {logs.length} logs
      </div>
      {filteredLogs.length === 0 && !error && (
        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
          {logs.length === 0 ? 'No logs yet. Waiting for incoming logs...' : 'No logs match your filters.'}
        </p>
      )}
      {filteredLogs.length > 0 && <LogTable logs={filteredLogs} />}
    </div>
  );
};

export default LiveLogs;