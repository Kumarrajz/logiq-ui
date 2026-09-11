import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { hasScreenAccess, subscribeToPolicyChange } from '../rbac/accessControl';
import { showHelpModal } from '../utils/alerts';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  device?: 'mobile' | 'tablet' | 'desktop';
}

export function Sidebar({ isOpen, onClose, isMobile, device = 'desktop' }: SidebarProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const pathname = loc.pathname;
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const [, setPolicyVer] = useState(0);

  useEffect(() => {
    return subscribeToPolicyChange(() => {
      setPolicyVer((v) => v + 1);
    });
  }, []);

  // Figma Exact Navigation Items
  const navItems = [
    {
      screenId: 'dashboard',
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      screenId: 'entry',
      id: 'production',
      label: 'Production',
      path: '/entry',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      screenId: 'approvals',
      id: 'approvals',
      label: 'Approvals',
      path: '/approvals',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      screenId: 'reports',
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      screenId: 'master',
      id: 'masters',
      label: 'Masters',
      path: '/admin/master',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      screenId: 'templates',
      id: 'templates',
      label: 'Form Templates',
      path: '/admin/templates',
      keyAccess: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
    },
    {
      screenId: 'users',
      id: 'users',
      label: 'Access Control',
      path: '/admin/users',
      keyAccess: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      screenId: null,
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  function handleNavigate(path: string) {
    nav(path);
    if (onClose) onClose();
  }

  function doLogout() {
    localStorage.removeItem('logiq-refresh');
    logout();
    nav('/login');
    if (onClose) onClose();
  }

  // Responsive calculations
  const isDrawerMode = Boolean(isMobile);
  const sidebarWidth = device === 'mobile' ? '82%' : device === 'tablet' ? 280 : 255;
  const maxDrawerWidth = device === 'mobile' ? 310 : 320;

  return (
    <>
      {/* Responsive Backdrop for Mobile & Tablet Drawer View */}
      {isDrawerMode && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(6, 14, 26, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 95,
            transition: 'opacity 0.25s ease',
          }}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className="sidebar-animated-bg"
        style={{
          width: isDrawerMode ? sidebarWidth : 255,
          maxWidth: isDrawerMode ? maxDrawerWidth : 'none',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: device === 'mobile' ? '16px 14px 20px' : '20px 16px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          position: isDrawerMode ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          zIndex: isDrawerMode ? 100 : 30,
          transform: isDrawerMode ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: isDrawerMode ? 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease' : 'none',
          boxShadow: isDrawerMode && isOpen ? '0 0 40px rgba(0,0,0,0.7), 4px 0 24px rgba(0,0,0,0.5)' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Calm Ambient Glow Layers */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
            filter: 'blur(35px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 170,
            height: 170,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            filter: 'blur(35px)',
            pointerEvents: 'none',
          }}
        />
        <div className="sidebar-grid-overlay" />

        {/* 1. Header: Pitti Brand Logo Card & Responsive Close Button */}
        <div
          style={{
            marginBottom: 18,
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '11px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Pitti Corporate Red Accent Bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3.5,
                background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
              }}
            />

            {/* Official Logo */}
            <img
              src="/pitti-logo.png"
              alt="Pitti Engineering Solutions"
              style={{
                height: 42,
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))',
              }}
            />

            {/* Facility Status Chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 6,
                paddingTop: 4,
                borderTop: '1px solid #F1F5F9',
                width: '100%',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>{user?.plant || 'Plant-V'} · Live Logbook</span>
            </div>
          </div>

          {/* Close Button on Mobile / Tablet Drawer */}
          {isDrawerMode && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation drawer"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#FFFFFF',
                borderRadius: 10,
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.borderColor = '#EF4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. Navigation Items (Figma Hierarchy with RED Selected State) */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            zIndex: 2,
            paddingRight: 2,
          }}
        >
          {navItems.map((item) => {
            if (item.screenId && !hasScreenAccess(role, item.screenId)) {
              return null;
            }
            const isActive =
              (item.path === '/dashboard' && pathname === '/dashboard') ||
              (item.path === '/entry' && (pathname.startsWith('/entry') || pathname.startsWith('/submissions'))) ||
              (item.path === '/approvals' && pathname.startsWith('/approvals')) ||
              (item.path === '/reports' && pathname.startsWith('/reports')) ||
              (item.path === '/admin/master' && pathname.startsWith('/admin/master')) ||
              (item.path === '/admin/templates' && pathname.startsWith('/admin/templates')) ||
              (item.path === '/admin/users' && pathname.startsWith('/admin/users')) ||
              (item.path === '/settings' && pathname.startsWith('/settings'));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: device === 'mobile' ? '11px 14px' : '10px 14px',
                  borderRadius: 10,
                  border: isActive
                    ? '1px solid #103A8A'
                    : '1px solid transparent',
                  borderTop: isActive ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  background: isActive
                    ? 'linear-gradient(180deg, #2B73EE 0%, #1750B8 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  boxShadow: isActive
                    ? '0 4px 0 #0E347A, 0 6px 16px rgba(30, 96, 213, 0.4)'
                    : 'none',
                  transition: 'all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  minHeight: device === 'mobile' ? 44 : 42,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                  }
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 3. Bottom Pinned Section: Help & Docs + Logout */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 12,
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Help & Technical Support Button (Triggers Rich SweetAlert2 Modal) */}
          <button
            type="button"
            onClick={showHelpModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid transparent',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              minHeight: 40,
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Help & Docs</span>
          </button>

          {/* Secure Logout Action */}
          <button
            type="button"
            onClick={doLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(239, 68, 68, 0.28)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#FCA5A5',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              minHeight: 40,
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.transform = 'translateX(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.color = '#FCA5A5';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
