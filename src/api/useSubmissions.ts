import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { db } from '../offline/db';
import type { FormSubmission } from '../types/FormSubmission';

export function useSubmissions() {
  return useQuery<FormSubmission[]>({
    queryKey: ['submissions'],
    queryFn: async () => {
      let remote: FormSubmission[] = [];
      try {
        const res = await api.get('/api/submissions');
        if (Array.isArray(res.data)) {
          remote = res.data;
        }
      } catch (err) {
        console.warn('API get /api/submissions fallback to local DB:', err);
      }

      // Read local Dexie submissions
      let local: FormSubmission[] = [];
      try {
        const dexieItems = await db.submissions.toArray();
        local = dexieItems.map((item) => (item.payload || item) as unknown as FormSubmission);
      } catch (e) {
        console.warn('Dexie read fallback:', e);
      }

      // Read localStorage backup
      try {
        const backupStr = localStorage.getItem('logiq_local_submissions');
        if (backupStr) {
          const parsed = JSON.parse(backupStr);
          if (Array.isArray(parsed)) {
            local = [...local, ...parsed];
          }
        }
      } catch {}

      // Merge and deduplicate by submissionId / id
      const mergedMap = new Map<string, FormSubmission>();
      for (const item of remote) {
        const sid = (item as any).submissionId || (item as any).id || (item as any)._id;
        if (sid) mergedMap.set(sid, item);
      }
      for (const item of local) {
        const sid = (item as any).submissionId || (item as any).id || (item as any)._id;
        if (sid) {
          const prev = mergedMap.get(sid);
          mergedMap.set(sid, { ...(prev || {}), ...item });
        }
      }

      const list = Array.from(mergedMap.values());
      // Sort newest first
      list.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
      });

      return list;
    },
    staleTime: 5000,
  });
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
