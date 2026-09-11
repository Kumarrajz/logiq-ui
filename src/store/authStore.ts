import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PERMISSIONS } from '../rbac/permissions';

export interface AuthUser {
  id: string;
  name: string;
  role?: string;
  plant?: string;
  department?: string;
  machine?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: string;
  permissions: string[];
  login: (u: AuthUser, token: string, role: string, permissions: string[]) => void;
  setUser: (u: AuthUser, role?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: 'role_operator',
      permissions: [],
      login: (user, token, role, permissions) => set({ user, token, role, permissions }),
      setUser: (user, role) => {
        const newRole = role || user.role || 'role_operator';
        const perms = PERMISSIONS[newRole] || [
          'form:create_own',
          'form:edit_own_draft',
          'form:submit_own',
          'dashboard:view_own_machine',
        ];
        set({
          user: { ...user, role: newRole },
          role: newRole,
          token: 'demo-token-' + user.id,
          permissions: perms,
        });
      },
      logout: () => set({ user: null, token: null, permissions: [] }),
    }),
    { name: 'logiq-auth' }
  )
);
