import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { RequireAuth, RequirePermission, RequireScreen } from './rbac/RequirePermission';
import { hasScreenAccess, getDefaultLandingRoute, subscribeToPolicyChange } from './rbac/accessControl';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { FormListScreen } from './screens/FormListScreen';
import { FormEntryScreen } from './screens/FormEntryScreen';
import { ApprovalsScreen } from './screens/ApprovalsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { MasterDataAdmin } from './screens/admin/MasterDataAdmin';
import { UsersAdmin } from './screens/admin/UsersAdmin';
import { TemplatesAdmin } from './screens/admin/TemplatesAdmin';
import { ProfileScreen } from './screens/ProfileScreen';
import { T } from './theme/tokens';

function useViewport() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    width,
    isDesktop: width > 1024,
    isTablet: width > 768 && width <= 1024,
    isMobile: width <= 768,
    isDrawer: width <= 1024,
  };
}

function Shell() {
  const { isDesktop, isTablet, isMobile, isDrawer } = useViewport();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const pathname = loc.pathname;
  const role = useAuthStore((s) => s.role);
  const [, setPolicyVer] = useState(0);

  useEffect(() => {
    return subscribeToPolicyChange(() => {
      setPolicyVer((v) => v + 1);
    });
  }, []);

  const MOBILE_NAV = [
    {
      id: 'dashboard',
      label: 'Home',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      ),
    },
    {
      id: 'entry',
      label: 'Entry',
      path: '/entry',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
      ),
    },
    {
      id: 'approvals',
      label: 'Approvals',
      path: '/approvals',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      path: '/reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      ),
    },
    {
      id: 'menu',
      label: 'Menu',
      path: 'drawer',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      ),
    },
  ].filter((item) => item.id === 'menu' || hasScreenAccess(role, item.id));

  const defaultRoute = getDefaultLandingRoute(role);

  return (
    <div className="shell-container">
      {/* Sidebar: Persistent on Desktop, Slide-over Drawer on Tablet & Mobile */}
      <Sidebar
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isMobile={isDrawer}
        device={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
      />

      {/* Main Content Area */}
      <div className="shell-body">
        <TopBar
          onToggleSidebar={() => setIsDrawerOpen(!isDrawerOpen)}
          isMobile={isDrawer}
        />
        <main className="shell-content">
          <Routes>
            <Route path="/" element={<Navigate to={defaultRoute} replace />} />
            <Route path="/dashboard" element={<RequireScreen screen="dashboard"><DashboardScreen /></RequireScreen>} />
            <Route path="/entry" element={<RequireScreen screen="entry"><FormEntryScreen /></RequireScreen>} />
            <Route path="/entry/:templateId" element={<RequireScreen screen="entry"><FormEntryScreen /></RequireScreen>} />
            <Route path="/submissions" element={<RequireScreen screen="entry"><FormListScreen /></RequireScreen>} />
            <Route path="/approvals" element={<RequireScreen screen="approvals"><ApprovalsScreen /></RequireScreen>} />
            <Route path="/reports" element={<RequireScreen screen="reports"><ReportsScreen /></RequireScreen>} />
            <Route path="/admin/master" element={<RequireScreen screen="master"><MasterDataAdmin /></RequireScreen>} />
            <Route path="/admin/users" element={<RequireScreen screen="users"><UsersAdmin /></RequireScreen>} />
            <Route path="/admin/templates" element={<RequireScreen screen="templates"><TemplatesAdmin /></RequireScreen>} />
            <Route path="/settings" element={<ProfileScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Tablet & Mobile Bottom Navigation Bar (Viewport <= 1024px) with Red Accent */}
      {(isMobile || isTablet) && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'linear-gradient(180deg, rgba(11, 25, 44, 0.98) 0%, #06101D 100%)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 80,
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.35)',
          }}
        >
          {MOBILE_NAV.map((m) => {
            const isActive =
              (m.path === '/dashboard' && pathname === '/dashboard') ||
              (m.path === '/entry' && (pathname.startsWith('/entry') || pathname.startsWith('/submissions'))) ||
              (m.path === '/approvals' && pathname.startsWith('/approvals')) ||
              (m.path === '/reports' && pathname.startsWith('/reports'));

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (m.path === 'drawer') {
                    setIsDrawerOpen(true);
                  } else {
                    nav(m.path);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#EF4444' : 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  flex: 1,
                  minHeight: 48,
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      width: 16,
                      height: 3,
                      borderRadius: 999,
                      background: '#EF4444',
                      boxShadow: '0 0 8px #EF4444',
                    }}
                  />
                )}
                <span style={{ color: isActive ? '#EF4444' : 'rgba(255,255,255,0.7)', transition: 'color 0.2s ease' }}>
                  {m.icon}
                </span>
                <span style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)', transition: 'color 0.2s ease' }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
    </Routes>
  );
}
