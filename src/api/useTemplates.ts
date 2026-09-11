import { useQuery } from '@tanstack/react-query';
import { api } from './client';
export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: async () => (await api.get('/api/templates')).data });
}
