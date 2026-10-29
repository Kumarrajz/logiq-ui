import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useOfflineReady } from '../offline/useOfflineReady';
import { useDynamicPlants } from '../utils/masterDataUtils';

export function ProfileScreen() {
  const dynamicPlants = useDynamicPlants();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const { isOnline, pendingCount, sync } = useOfflineReady();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || (role === 'role_admin' ? 'Super Admin' : 'Operator'),
    email: role === 'role_admin' ? 'admin@pitti.in' : `${user?.id || 'operator'}@pitti.in`,
    phone: '+91 98230 44819',
    plant: user?.plant || 'Plant-V',
    department: user?.department || (role === 'role_admin' ? 'IT' : 'Press Shop'),
    shift: 'Shift A (06:00 – 14:00)',
  });

  const [prefs, setPrefs] = useState({
    defaultScreen: role === 'role_operator' ? '/entry' : '/dashboard',
    soundAlerts: true,
    highContrastMode: false,
  });

  function showToast(text: string, type: 'success' | 'info' = 'success') {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (user) {
      setUser(
        { ...user, name: profileData.name, plant: profileData.plant, department: profileData.department },
        role
      );
    }
    setIsEditing(false);
    showToast('Profile updated');
  }

  function doLogout() {
    localStorage.removeItem('logiq-refresh');
    logout();
    nav('/login');
  }

  const isSuperAdmin = role === 'role_admin' || user?.id === 'admin';
  const roleLabel = isSuperAdmin ? 'Super Admin' : role === 'role_supervisor' ? 'Supervisor' : role === 'role_manager' ? 'Plant Manager' : 'Operator';

  const initials = (profileData.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 48 }}>
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 1000,
            background: toastMsg.type === 'success' ? '#10B981' : '#1E60D5',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: T.ink,
            margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Settings
        </h1>
        <button
          type="button"
          onClick={doLogout}
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Compact Profile Card */}
      <div
        className="clean-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: isSuperAdmin ? '#7E22CE' : T.blue,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{profileData.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.muted }}>
              <span className="clean-badge">{roleLabel}</span>
              <span>{profileData.plant}</span>
              <span style={{ color: '#CBD5E1' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isOnline ? '#10B981' : '#F59E0B',
                  }}
                />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          style={{
            background: '#FFFFFF',
            border: `1px solid ${T.border}`,
            color: T.ink,
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Clean Tab Bar */}
      <div className="clean-tab-bar">
        {[
          {
            id: 'profile',
            label: 'Profile',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            id: 'security',
            label: 'Security & Access',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ),
          },
          {
            id: 'preferences',
            label: 'Preferences',
            icon: (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            ),
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`clean-tab ${activeTab === tab.id ? 'clean-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <div className="clean-card" style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  {[
                    { label: 'Full Name', value: profileData.name, key: 'name', required: true },
                    { label: 'Email', value: profileData.email, key: 'email', type: 'email' },
                    { label: 'Phone', value: profileData.phone, key: 'phone' },
                    { label: 'Department', value: profileData.department, key: 'department' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
                        {field.label} {field.required && <span style={{ color: T.red }}>*</span>}
                      </label>
                      <input
                        type={field.type || 'text'}
                        value={field.value}
                        required={field.required}
                        onChange={(e) => setProfileData({ ...profileData, [field.key]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${T.inputBorder}`,
                          fontSize: 14,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Plant</label>
                    <select
                      value={profileData.plant}
                      onChange={(e) => setProfileData({ ...profileData, plant: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${T.inputBorder}`,
                        fontSize: 14,
                        boxSizing: 'border-box',
                        background: '#FFFFFF',
                      }}
                    >
                      {(dynamicPlants.length > 0 ? dynamicPlants : ['Plant-V', 'Aurangabad', 'Corporate / Central']).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      background: '#FFFFFF',
                      color: T.ink,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 22px',
                      borderRadius: 8,
                      border: 'none',
                      background: T.blue,
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {/* Details */}
              <div className="clean-card">
                <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.ink }}>
                  Details
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Name', value: profileData.name },
                    { label: 'Employee ID', value: user?.id || 'admin' },
                    { label: 'Email', value: profileData.email },
                    { label: 'Phone', value: profileData.phone },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 13, color: T.muted }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignment */}
              <div className="clean-card">
                <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.ink }}>
                  Assignment
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Plant', value: profileData.plant },
                    { label: 'Department', value: profileData.department },
                    { label: 'Shift', value: profileData.shift },
                    { label: 'Status', value: 'Active', isStatus: true },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 13, color: T.muted }}>{row.label}</span>
                      {row.isStatus ? (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D', background: '#DCFCE7', padding: '3px 8px', borderRadius: 6 }}>
                          Active
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="clean-card">
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.ink }}>
            Role & Access
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.muted }}>System Role</span>
              <span className="clean-badge clean-badge--blue">{roleLabel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.muted }}>Key Access</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: isSuperAdmin ? '#7E22CE' : T.muted }}>
                {isSuperAdmin ? 'Full' : 'Standard'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.muted }}>Sync Status</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: isOnline ? '#10B981' : '#F59E0B' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? '#10B981' : '#F59E0B' }} />
                {isOnline ? 'Online' : 'Offline'}
                {pendingCount > 0 && <span style={{ color: T.muted, fontWeight: 500 }}>· {pendingCount} queued</span>}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: T.muted }}>Sync</span>
              <button
                type="button"
                onClick={() => { sync(); showToast('Sync triggered', 'info'); }}
                style={{
                  background: T.blue,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sync Now
              </button>
            </div>
          </div>

          {isSuperAdmin && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
              <button
                type="button"
                onClick={() => nav('/admin/users')}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${T.border}`,
                  color: T.ink,
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Manage Access Control
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="clean-card">
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.ink }}>
            Preferences
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Default Screen</div>
                <div style={{ fontSize: 12, color: T.muted }}>Screen shown after sign-in</div>
              </div>
              <select
                value={prefs.defaultScreen}
                onChange={(e) => {
                  setPrefs({ ...prefs, defaultScreen: e.target.value });
                  showToast('Preference updated');
                }}
                style={{
                  maxWidth: 200,
                  minWidth: 140,
                  flexShrink: 0,
                  fontWeight: 600,
                  color: T.ink,
                  cursor: 'pointer',
                }}
              >
                <option value="/entry">Production Entry</option>
                <option value="/dashboard">Dashboard</option>
                <option value="/approvals">Approvals</option>
                <option value="/reports">Reports</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Sound Alerts</div>
                <div style={{ fontSize: 12, color: T.muted }}>Play sound on submission</div>
              </div>
              <button
                type="button"
                className={`clean-toggle ${prefs.soundAlerts ? 'clean-toggle--on' : ''}`}
                onClick={() => {
                  setPrefs({ ...prefs, soundAlerts: !prefs.soundAlerts });
                  showToast('Sound alerts ' + (!prefs.soundAlerts ? 'enabled' : 'disabled'));
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>High Contrast Mode</div>
                <div style={{ fontSize: 12, color: T.muted }}>Larger touch targets for tablets</div>
              </div>
              <button
                type="button"
                className={`clean-toggle ${prefs.highContrastMode ? 'clean-toggle--on' : ''}`}
                onClick={() => {
                  setPrefs({ ...prefs, highContrastMode: !prefs.highContrastMode });
                  showToast('High contrast ' + (!prefs.highContrastMode ? 'enabled' : 'disabled'));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
