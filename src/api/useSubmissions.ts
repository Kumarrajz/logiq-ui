import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { db } from '../offline/db';
import type { FormSubmission } from '../types/FormSubmission';

function toStringValue(val: any, fallback = ''): string {
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return val.name || val.code || val.id || val.type || val.label || val.title || fallback;
  }
  return fallback;
}

export function sanitizeSubmission(sub: any): FormSubmission {
  if (!sub || typeof sub !== 'object') return sub;
  const clone = { ...sub };

  if (clone.machine != null) {
    clone.machine = toStringValue(clone.machine, '—');
  }
  if (clone.machineNo != null) {
    clone.machineNo = toStringValue(clone.machineNo, '—');
  }
  if (clone.department != null) {
    clone.department = toStringValue(clone.department, 'Production');
  }
  if (clone.plant != null) {
    clone.plant = toStringValue(clone.plant, 'Plant-V');
  }
  if (clone.operator != null) {
    clone.operator = toStringValue(clone.operator, 'Operator');
  }
  if (clone.operatorName != null) {
    clone.operatorName = toStringValue(clone.operatorName, 'Operator');
  }
  if (clone.shift != null) {
    clone.shift = toStringValue(clone.shift, 'General Shift');
  }

  if (Array.isArray(clone.rows)) {
    clone.rows = clone.rows.map((row: any) => {
      if (!row || typeof row !== 'object') return row;
      const r = { ...row };
      if (r.machine != null) r.machine = toStringValue(r.machine, '—');
      if (r.machineNo != null) r.machineNo = toStringValue(r.machineNo, '—');
      if (r.operator != null) r.operator = toStringValue(r.operator, 'Operator');
      if (r.operatorName != null) r.operatorName = toStringValue(r.operatorName, 'Operator');
      if (r.partName != null) r.partName = toStringValue(r.partName, '');
      if (r.partNo != null) r.partNo = toStringValue(r.partNo, '');
      if (r.tool != null) r.tool = toStringValue(r.tool, '');
      if (r.grade != null) r.grade = toStringValue(r.grade, '');
      if (r.model != null) r.model = toStringValue(r.model, '');
      if (r.modelNo != null) r.modelNo = toStringValue(r.modelNo, '');
      return r;
    });
  }

  return clone;
}

export function useSubmissions() {
  return useQuery<FormSubmission[]>({
    queryKey: ['submissions'],
    queryFn: async () => {
      let remote: FormSubmission[] = [];
      try {
        const res = await api.get('/api/submissions');
        if (Array.isArray(res.data)) {
          remote = res.data.map(sanitizeSubmission);
        }
      } catch (err) {
        console.warn('API get /api/submissions fallback to local DB:', err);
      }

      // Read local Dexie submissions
      let local: FormSubmission[] = [];
      try {
        const dexieItems = await db.submissions.toArray();
        local = dexieItems.map((item) => sanitizeSubmission((item.payload || item) as unknown as FormSubmission));
      } catch (e) {
        console.warn('Dexie read fallback:', e);
      }

      // Read localStorage backup
      try {
        const backupStr = localStorage.getItem('logiq_local_submissions');
        if (backupStr) {
          const parsed = JSON.parse(backupStr);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map(sanitizeSubmission);
            local = [...local, ...sanitized];
            try {
              localStorage.setItem('logiq_local_submissions', JSON.stringify(sanitized));
            } catch {}
          }
        }
      } catch {}

      // Merge and deduplicate by submissionId / id
      const mergedMap = new Map<string, FormSubmission>();
      for (const item of remote) {
        const sid = (item as any).submissionId || (item as any).id || (item as any)._id;
        if (sid) mergedMap.set(sid, sanitizeSubmission(item));
      }
      for (const item of local) {
        const sid = (item as any).submissionId || (item as any).id || (item as any)._id;
        if (sid) {
          const prev = mergedMap.get(sid);
          mergedMap.set(sid, sanitizeSubmission({ ...(prev || {}), ...item }));
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
