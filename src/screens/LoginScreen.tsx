import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { T } from '../theme/tokens';
import { GlassPanel } from '../components/GlassPanel';
import { inputStyle } from '../components/buttons';
import { useAuth } from '../api/useAuth';
import { useAuthStore } from '../store/authStore';
import { getDefaultLandingRoute } from '../rbac/accessControl';
import { showInfo } from '../utils/alerts';

export function LoginScreen() {
  const nav = useNavigate();
  const token = useAuthStore((s) => s.token);
  const userRole = useAuthStore((s) => s.role);
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState('u009');
  const [password, setPassword] = useState('u009');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { mutateAsync, isPending, error } = useAuth();

  if (token) return <Navigate to={getDefaultLandingRoute(userRole)} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    try {
      const res = await mutateAsync({ employeeId: username.trim(), password });
      const targetRole = res?.user?.role || 'role_operator';
      nav(getDefaultLandingRoute(targetRole));
    } catch {
      // Demo fallback
      let assignedRole = 'role_admin';
      if (username === 'u007' || username.toLowerCase() === 'ramesh') {
        assignedRole = 'role_operator';
        setUser({ id: 'u007', name: 'Ramesh', plant: 'Plant-V', department: 'Press Shop & Notching' }, assignedRole);
      } else if (username === 'u003' || username.toLowerCase() === 'suresh') {
        assignedRole = 'role_supervisor';
        setUser({ id: 'u003', name: 'Suresh Kumar', plant: 'Plant-V', department: 'Press Shop & Notching' }, assignedRole);
      } else if (username === 'u008' || username.toLowerCase() === 'anita') {
        assignedRole = 'role_manager';
        setUser({ id: 'u008', name: 'Anita Mehta', plant: 'Plant-V', department: 'Operations Management' }, assignedRole);
      } else {
        assignedRole = 'role_admin';
        setUser({ id: 'admin', name: 'Pitti Super Admin', plant: 'Corporate / Central', department: 'Executive IT & Governance' }, assignedRole);
      }
      nav(getDefaultLandingRoute(assignedRole));
    }
  }

  function quickLogin(id: string, name: string, role: string, dept = '') {
    setUser({ id, name, plant: 'Plant-V', department: dept }, role);
    nav(getDefaultLandingRoute(role));
  }

  const msg = error && typeof error === 'object' && 'response' in error
    ? String((error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Sign-in failed')
    : error ? 'Cannot reach API at :4000 — demo mode active below' : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(1200px 600px at 15% 10%, #1E3A34 0%, transparent 60%), radial-gradient(1000px 500px at 90% 90%, #3A2E12 0%, transparent 55%), ${T.graphite}`,
        fontFamily: 'Inter, sans-serif',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <GlassPanel style={{ width: 400, padding: 36, position: 'relative' }}>
        {/* Pitti Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFFFFF',
              padding: '10px 22px',
              borderRadius: 14,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              marginBottom: 16,
            }}
          >
            <img
              src="/pitti-logo.png"
              alt="Pitti Engineering Solutions"
              style={{
                height: 42,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
          <h1
            style={{
              color: '#FFFFFF',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              margin: '0 0 4px',
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
            Login to Digital Production Logbook
          </p>
        </div>

        <form onSubmit={submit}>
          {/* Employee ID / Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              Username / Employee ID
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. u009 or ramesh"
              autoComplete="username"
              style={inputStyle(true)}
            />
          </div>

          {/* Password / PIN */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600 }}>
                Password / PIN
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={inputStyle(true)}
            />
          </div>

          {/* Remember Me */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Remember me
            </label>
            <span
              onClick={() => showInfo('Password Reset Assistance', 'Please contact the <strong>Plant IT Administrator</strong> (Ext. 5446 or email <strong>it.support@pitti.in</strong>) to reset your PIN or account credentials.')}
              style={{ color: '#60A5FA', cursor: 'pointer', fontWeight: 500 }}
            >
              Forgot Password?
            </span>
          </div>

          {msg && (
            <div style={{ color: '#FF9D9D', fontSize: 12, marginBottom: 12, background: 'rgba(220,76,76,0.15)', padding: '6px 10px', borderRadius: 6 }}>
              {msg}
            </div>
          )}

          {/* Blue Brand Action Button */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 8,
              border: 'none',
              background: T.blue,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 14,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(30,96,213,0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            {isPending ? 'Signing in…' : 'Login →'}
          </button>
        </form>

        {/* Quick Demo Personas */}
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Quick Demo Login
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => quickLogin('admin', 'Pitti Super Admin', 'role_admin', 'Corporate / Central')}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid rgba(251, 191, 36, 0.4)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#FBBF24',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => quickLogin('u003', 'Suresh Kumar', 'role_supervisor', 'Press Shop & Notching')}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Supervisor (SK)
            </button>
            <button
              type="button"
              onClick={() => quickLogin('u007', 'Ramesh', 'role_operator', 'Press Shop & Notching')}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Operator (RO)
            </button>
            <button
              type="button"
              onClick={() => quickLogin('u008', 'Anita Mehta', 'role_manager', 'Plant-V')}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Manager (AM)
            </button>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '16px 0 0', textAlign: 'center' }}>
          Digitizing Manufacturing For A Stronger Tomorrow
        </p>
      </GlassPanel>
    </div>
  );
}
