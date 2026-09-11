import { useMutation } from '@tanstack/react-query';
import { api } from './client';
import { useAuthStore } from '../store/authStore';
import { PERMISSIONS } from '../rbac/permissions';
interface LoginUser { id: string; name: string; role: string; permissions?: string[]; plant?: string; department?: string; machine?: string; }
interface LoginRes { user: LoginUser; accessToken: string; refreshToken?: string; }
export function useAuth() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: async (vars: { employeeId: string; password: string }) => (await api.post('/api/auth/login', vars)).data as LoginRes,
    onSuccess: (data) => {
      const perms = data.user.permissions?.length ? data.user.permissions : PERMISSIONS[data.user.role] || [];
      login({ id: data.user.id, name: data.user.name, role: data.user.role, plant: data.user.plant, department: data.user.department, machine: data.user.machine }, data.accessToken, data.user.role, [...perms]);
      if (data.refreshToken) localStorage.setItem('logiq-refresh', data.refreshToken);
    },
  });
}
