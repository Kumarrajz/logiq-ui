import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { hasScreenAccess, getDefaultLandingRoute } from './accessControl';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export function RequirePermission({ perm, children }: { perm: string | string[]; children: JSX.Element }) {
  const { permissions, role } = useAuthStore();
  const needs = Array.isArray(perm) ? perm : [perm];
  if (role === 'role_admin' || permissions.includes('admin:full_access')) return children;
  if (needs.some((p) => permissions.includes(p))) return children;
  const fallback = getDefaultLandingRoute(role);
  return <Navigate to={fallback} replace />;
}

export function RequireScreen({ screen, children }: { screen: string; children: JSX.Element }) {
  const { role, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (hasScreenAccess(role, screen)) {
    return children;
  }
  // Redirect to user's authorized default landing screen (e.g. /entry for operator)
  const fallback = getDefaultLandingRoute(role);
  return <Navigate to={fallback} replace />;
}
