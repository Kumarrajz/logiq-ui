import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { T } from '../theme/tokens';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDefaultLandingRoute } from '../rbac/accessControl';
import { useDynamicPlants, getUserAccessiblePlants } from '../utils/masterDataUtils';

interface TopBarProps {
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export function TopBar({ onToggleSidebar, isMobile }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const setUser = useAuthStore((s) => s.setUser);
  const nav = useNavigate();
  const dynamicPlants = useDynamicPlants();
  const [plant, setPlant] = useState(user?.plant || 'Plant-V');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user?.plant && user.plant !== plant) {
      setPlant(user.plant);
    }
  }, [user?.plant]);

  const accessiblePlants = getUserAccessiblePlants(user?.plant, role, dynamicPlants);
  const canSwitchMultiPlant = role === 'role_admin' || user?.plant === 'Corporate / Central' || accessiblePlants.length > 1;

  // Role labels / display mapping matching the design photos
  let initials = 'SA';
  let displayName = user?.name || 'Pitti Super Admin';
  let displayRole = 'Super Admin';

  if (user?.id === 'admin' || user?.name?.includes('Super Admin')) {
    initials = 'SA';
    displayName = 'Pitti Super Admin';
    displayRole = 'Super Admin (Key Access)';
  } else if (role === 'role_operator' || user?.id === 'u007' || user?.id === 'u001') {
    initials = 'RO';
    displayName = user?.name || 'Ramesh';
    displayRole = 'Operator (Press Shop)';
  } else if (role === 'role_supervisor' || user?.id === 'u003' || user?.id === 'u004') {
    initials = 'SK';
    displayName = user?.name || 'Suresh Kumar';
    displayRole = 'Supervisor';
  } else if (role === 'role_manager' || user?.id === 'u008') {
    initials = 'AM';
    displayName = user?.name || 'Anita Mehta';
    displayRole = 'Plant Manager';
  } else {
    initials = 'SA';
    displayName = user?.name || 'Pitti Super Admin';
    displayRole = 'Super Admin';
  }

  const DEMO_PERSONAS = [
    { id: 'admin', name: 'Pitti Super Admin', role: 'role_admin', plant: 'Corporate / Central', dept: 'Executive Governance', initials: 'SA', label: 'Pitti Super Admin (Key Access)' },
    { id: 'u009', name: 'Admin User', role: 'role_admin', plant: 'Plant-V', dept: '', initials: 'AS', label: 'Admin User (System Admin)' },
    { id: 'u007', name: 'Ramesh', role: 'role_operator', plant: 'Plant-V', dept: 'Press Shop & Notching', initials: 'RO', label: 'Ramesh (Operator)' },
    { id: 'u003', name: 'Suresh Kumar', role: 'role_supervisor', plant: 'Plant-V', dept: 'Press Shop & Notching', initials: 'SK', label: 'Suresh Kumar (Supervisor)' },
    { id: 'u008', name: 'Anita Mehta', role: 'role_manager', plant: 'Plant-V', dept: '', initials: 'AM', label: 'Anita Mehta (Plant Manager)' },
  ];

  function switchUser(persona: typeof DEMO_PERSONAS[0]) {
    setUser({
      id: persona.id,
      name: persona.name,
      plant: persona.plant,
      department: persona.dept,
    }, persona.role);
    setPlant(persona.plant);
    setShowUserMenu(false);
    nav(getDefaultLandingRoute(persona.role));
  }

  const loc = useLocation();
  const isInnerPage = loc.pathname !== '/dashboard' && loc.pathname !== '/';

  return (
    <header
      style={{
        height: 64,
        background: 'rgba(255, 255, 255, 0.78)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Hamburger, Back Button & Plant Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && (
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.ink,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        {canSwitchMultiPlant ? (
          <div style={{ position: 'relative' }}>
            <select
              value={plant}
              onChange={(e) => {
                const newP = e.target.value;
                setPlant(newP);
                if (user) setUser({ ...user, plant: newP }, role);
              }}
              style={{
                padding: '6px 28px 6px 12px',
                borderRadius: 8,
                border: `1px solid ${T.border}`,
                background: '#FFFFFF',
                color: T.ink,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                outline: 'none',
              }}
              title="Multi-Plant Facility Switcher"
            >
              {Array.from(new Set([...dynamicPlants, plant])).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: T.muted,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${T.border}`,
              background: '#F8FAFC',
              color: T.ink,
              fontSize: 13,
              fontWeight: 600,
            }}
            title={`Assigned Plant: ${user?.plant || 'Plant-V'}`}
          >
            <span>{user?.plant || 'Plant-V'}</span>
          </div>
        )}
      </div>

      {/* Right: Notifications & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => nav('/approvals')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -5,
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 700,
              width: 16,
              height: 16,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF',
            }}
          >
            {role === 'role_operator' ? '5' : role === 'role_supervisor' ? '3' : '6'}
          </span>
        </div>

        {/* User Profile Pill */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 8,
              transition: 'background 0.15s ease',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: T.navy,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                boxShadow: '0 2px 4px rgba(11,25,44,0.15)',
              }}
            >
              {initials}
            </div>
            {!isMobile && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.2 }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.2 }}>
                  {displayRole}
                </div>
              </div>
            )}
            <span style={{ color: T.muted, marginLeft: 4, display: 'flex', alignItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>

          {/* Quick Persona Switcher Dropdown */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 46,
                right: 0,
                background: '#FFFFFF',
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                width: 250,
                padding: '8px 0',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Switch Demo User View
              </div>
              {DEMO_PERSONAS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => switchUser(p)}
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    fontSize: 13,
                    background: user?.name === p.name ? '#EEF5FF' : 'transparent',
                    color: user?.name === p.name ? T.blue : T.ink,
                    fontWeight: user?.name === p.name ? 600 : 400,
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: T.navy, color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.initials}
                  </div>
                  <span>{p.label}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 6, paddingTop: 6 }}>
                <div
                  onClick={() => {
                    setShowUserMenu(false);
                    nav('/settings');
                  }}
                  style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: T.ink }}
                >
                  Settings
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
