import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats, Transaction } from '@/types';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
  });
}

export function useRecentTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/recent-transactions');
      return data;
    },
  });
}