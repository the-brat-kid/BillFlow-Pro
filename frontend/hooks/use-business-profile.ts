import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BusinessProfile } from '@/types';

export function useBusinessProfile() {
  return useQuery<BusinessProfile>({
    queryKey: ['business-profile'],
    queryFn: async () => {
      const { data } = await api.get('/business-profile');
      return data;
    },
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Partial<BusinessProfile>) => {
      const { data } = await api.put('/business-profile', profile);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-profile'] }),
  });
}