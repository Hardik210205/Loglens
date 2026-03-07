import React, { useEffect, useState } from 'react';
import LogTable from '../components/LogTable';
import LogSearchFilters, { LogFilters } from '../components/LogSearchFilters';
import { LogEntry } from '../types';
import { fetchLogs } from '../services/api';

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
        const existing = await fetchLogs(1000);
        if (mounted) setLogs(existing as LogEntry[]);
      } catch (e) {
        if (mounted) setError(prev => prev || (e instanceof Error ? e.message : 'Failed to load logs'));
      }
    };
    loadInitial();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      import('@microsoft/signalr').then(({ HubConnectionBuilder }) => {
        const connection = new HubConnectionBuilder()
          .withUrl('/hubs/logs')
          .withAutomaticReconnect()
          .build();

        connection.on('ReceiveLogs', (newLogs: LogEntry[]) => {
          setLogs((prev) => [...newLogs, ...prev].slice(0, 1000)); // Keep last 1000 logs
        });

        connection.start().catch((err) => {
          setError(`SignalR connection error: ${err.message}`);
          console.error('SignalR connection failed:', err);
        });

        return () => {
          connection.stop();
        };
      }).catch((err) => {
        setError(`Failed to load SignalR: ${err.message}`);
        console.error('SignalR import error:', err);
      });
    } catch (err) {
      setError(`Unexpected error: ${err}`);
      console.error('Error:', err);
    }
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = logs;

    if (filters.searchText) {
      filtered = filtered.filter((log) =>
        log.Message?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        log.Metadata?.toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    if (filters.logLevel !== 'All') {
      filtered = filtered.filter((log) => log.Level === filters.logLevel);
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