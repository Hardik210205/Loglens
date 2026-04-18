import { useQuery } from '@tanstack/react-query';
import { fetchLogs } from '../services/api';

export const useLogs = () => {
  return useQuery(['logs'], fetchLogs, {
    refetchInterval: 5000,
    staleTime: 10000,
  });
};