import React, { useState } from 'react';
import { LogLevel } from '../types';

interface LogFiltersProps {
  onFiltersChange: (filters: LogFilters) => void;
}

export interface LogFilters {
  searchText: string;
  logLevel: LogLevel | 'All';
  startDate: string;
  endDate: string;
}

const LogSearchFilters: React.FC<LogFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<LogFilters>({
    searchText: '',
    logLevel: 'All',
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const handleChange = (key: keyof LogFilters, value: any) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '1.5rem'
    }}>
      <h3>Search & Filters</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Search Message
          </label>
          <input
            type="text"
            placeholder="Search logs..."
            value={filters.searchText}
            onChange={(e) => handleChange('searchText', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Log Level
          </label>
          <select
            value={filters.logLevel}
            onChange={(e) => handleChange('logLevel', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <option>All</option>
            <option>Trace</option>
            <option>Debug</option>
            <option>Information</option>
            <option>Warning</option>
            <option>Error</option>
            <option>Critical</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LogSearchFilters;
