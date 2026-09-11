import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
export function useSubmissions() {
  return useQuery({ queryKey: ['submissions'], queryFn: async () => (await api.get('/api/submissions')).data });
}
export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => (await api.post('/api/submissions', body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}
export function useUpdateSubmission(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) => (await api.patch(`/api/submissions/${id}`, body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}
export function useSignSubmission(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post(`/api/submissions/${id}/sign`, {})).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}
export function useRequestCorrection(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => (await api.post(`/api/submissions/${id}/request-correction`, { reason })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}
export function useApproveCorrection(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (approve: boolean) => (await api.post(`/api/submissions/${id}/approve-correction`, { approve })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['submissions'] }),
  });
}
export function useAuditTrail(id?: string) {
  return useQuery({
    queryKey: ['audit', id], enabled: !!id,
    queryFn: async () => (await api.get(`/api/submissions/${id}/audit`)).data,
  });
}
