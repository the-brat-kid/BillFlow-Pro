import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useSalesReports(period: string = 'month') {
  return useQuery({
    queryKey: ['reports', 'sales', period],
    queryFn: async () => {
      const { data } = await api.get(`/reports/sales?period=${period}`);
      return data;
    },
  });
}

export function useGstReports() {
  return useQuery({
    queryKey: ['reports', 'gst'],
    queryFn: async () => {
      const { data } = await api.get('/reports/gst');
      return data;
    },
  });
}

export function useReceivables() {
  return useQuery({
    queryKey: ['reports', 'receivables'],
    queryFn: async () => {
      const { data } = await api.get('/reports/receivables');
      return data;
    },
  });
}