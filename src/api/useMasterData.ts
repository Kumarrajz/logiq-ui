import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useMasterData(kind: string) {
  return useQuery({
    queryKey: ['master', kind],
    queryFn: async () => {
      const res = await api.get(`/api/master/${kind}`);
      return Array.isArray(res.data) ? res.data : (res.data as { data?: unknown[] })?.data || [];
    },
    staleTime: 30000,
  });
}

export function useCreateMasterItem(kind: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await api.post(`/api/master/${kind}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master', kind] });
      qc.invalidateQueries({ queryKey: ['master'] });
    },
  });
}

export function useUpdateMasterItem(kind: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; [key: string]: unknown }) => {
      const res = await api.put(`/api/master/${kind}/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master', kind] });
      qc.invalidateQueries({ queryKey: ['master'] });
    },
  });
}

export function useDeleteMasterItem(kind: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/master/${kind}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master', kind] });
      qc.invalidateQueries({ queryKey: ['master'] });
    },
  });
}
