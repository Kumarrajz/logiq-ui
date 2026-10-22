import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { T } from '../../theme/tokens';
import { primaryBtn, ghostBtn } from '../../components/buttons';
import {
  SYSTEM_SCREENS,
  getStoredPolicy,
  savePolicy,
  resetToDefaultPolicy,
  type RoleAccessConfig,
} from '../../rbac/accessControl';
import { showConfirm, showSuccess } from '../../utils/alerts';
import { useDynamicPlants, useDynamicDepartments } from '../../utils/masterDataUtils';

interface UserRecord {
  employeeId: string;
  name: string;
  role: string;
  plant?: string;
  department?: string;
  email?: string;
  phone?: string;
  status?: string;
  createdAt?: string;
}

const DEFAULT_USERS: UserRecord[] = [
  { employeeId: 'admin', name: 'Super Admin', role: 'role_admin', plant: 'Corporate / Central', department: 'IT', status: 'Active' },
  { employeeId: 'u001', name: 'Ramesh Pawar', role: 'role_operator', plant: 'Plant-V', department: 'Press Shop', status: 'Active' },
  { employeeId: 'u002', name: 'Vinay Kumar', role: 'role_operator', plant: 'Plant-V', department: 'Press Shop', status: 'Active' },
  { employeeId: 'u003', name: 'Suresh Kumar', role: 'role_supervisor', plant: 'Plant-V', department: 'Press Shop', status: 'Active' },
  { employeeId: 'u004', name: 'Vikram Singh', role: 'role_supervisor', plant: 'Aurangabad', department: 'Assembly', status: 'Active' },
  { employeeId: 'u005', name: 'Pooja Sharma', role: 'role_qa', plant: 'Plant-V', department: 'Quality', status: 'Active' },
  { employeeId: 'u006', name: 'Dinesh Patel', role: 'role_qa', plant: 'Aurangabad', department: 'Quality', status: 'Active' },
  { employeeId: 'u007', name: 'Ramesh', role: 'role_operator', plant: 'Plant-V', department: 'Press Shop', status: 'Active' },
  { employeeId: 'u008', name: 'Anita Mehta', role: 'role_manager', plant: 'Plant-V', department: 'Operations', status: 'Active' },
  { employeeId: 'u009', name: 'Admin User', role: 'role_admin', plant: 'Plant-V', department: 'IT', status: 'Active' },
];

const ROLE_OPTIONS = [
  { value: 'role_operator', label: 'Operator', color: '#D97706', bg: '#FEF3C7' },
  { value: 'role_supervisor', label: 'Supervisor', color: '#1E60D5', bg: '#EEF5FF' },
  { value: 'role_qa', label: 'QA', color: '#15803D', bg: '#DCFCE7' },
  { value: 'role_manager', label: 'Manager', color: '#4338CA', bg: '#EEF2FF' },
  { value: 'role_admin', label: 'Admin', color: '#7E22CE', bg: '#F3E8FF' },
];

const PLANT_OPTIONS = ['Plant-V', 'Aurangabad', 'Corporate / Central'];
const DEPT_OPTIONS = ['Press Shop', 'Assembly', 'Machine Shop', 'Die Casting', 'CTL / SLT', 'Tool Room', 'Quality', 'Maintenance', 'Stores'];

export function UsersAdmin() {
  const qc = useQueryClient();
  const dynamicPlants = useDynamicPlants();
  const dynamicDepts = useDynamicDepartments();
  const effectivePlants = dynamicPlants.length > 0 ? dynamicPlants : PLANT_OPTIONS;
  const effectiveDepts = dynamicDepts.length > 0 ? dynamicDepts : DEPT_OPTIONS;

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'directory' | 'accessControl'>('directory');
  const [policy, setPolicy] = useState<Record<string, RoleAccessConfig>>(() => getStoredPolicy());
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role_operator');

  function toggleScreenForRole(roleId: string, screenId: string) {
    if (roleId === 'role_admin' && (screenId === 'templates' || screenId === 'users')) return;
    setPolicy((prev) => {
      const currentRole = prev[roleId] || { roleId, roleName: roleId, description: '', defaultLandingRoute: '/entry', allowedScreens: [] };
      const hasIt = currentRole.allowedScreens.includes(screenId);
      const updated = hasIt ? currentRole.allowedScreens.filter((s) => s !== screenId) : [...currentRole.allowedScreens, screenId];
      return { ...prev, [roleId]: { ...currentRole, allowedScreens: updated } };
    });
  }

  function handleGrantAllScreens(roleId: string) {
    const isSA = roleId === 'role_admin';
    const allowable = SYSTEM_SCREENS.filter((s) => isSA || (!s.superAdminKeyOnly && !s.superAdminOnly)).map((s) => s.id);
    setPolicy((prev) => ({
      ...prev,
      [roleId]: { ...(prev[roleId] || { roleId, roleName: roleId, description: '', defaultLandingRoute: '/entry', allowedScreens: [] }), allowedScreens: isSA ? SYSTEM_SCREENS.map((s) => s.id) : allowable },
    }));
    toast('success', 'Granted all screens');
  }

  function handleRevokeAllScreens(roleId: string) {
    if (roleId === 'role_admin') { toast('error', 'Admin must retain all screens'); return; }
    setPolicy((prev) => ({
      ...prev,
      [roleId]: { ...(prev[roleId] || { roleId, roleName: roleId, description: '', defaultLandingRoute: '/entry', allowedScreens: [] }), allowedScreens: ['entry'] },
    }));
    toast('success', 'Reset to minimal access');
  }

  function setLandingRouteForRole(roleId: string, route: string) {
    setPolicy((prev) => ({ ...prev, [roleId]: { ...prev[roleId], defaultLandingRoute: route } }));
  }

  function handleSavePolicy() {
    savePolicy(policy);
    toast('success', 'Access policy saved');
  }

  function handleResetPolicy() {
    const def = resetToDefaultPolicy();
    setPolicy({ ...def });
    toast('success', 'Reset to defaults');
  }

  function toast(type: 'success' | 'error', text: string) {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  }

  // Form State
  const [form, setForm] = useState({ name: '', employeeId: '', role: 'role_operator', plant: 'Plant-V', department: 'Press Shop', password: '' });

  const { data: apiUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/users');
        const list = Array.isArray(res.data) ? res.data : [];
        return list.length > 0 ? list : DEFAULT_USERS;
      } catch { return DEFAULT_USERS; }
    },
  });

  const [localUsers, setLocalUsers] = useState<UserRecord[]>([]);

  const allUsers = useMemo(() => {
    const base = apiUsers.length > 0 ? apiUsers : DEFAULT_USERS;
    const combined = [...localUsers, ...base];
    const seen = new Set<string>();
    return combined.filter((u) => { const id = u.employeeId?.toLowerCase(); if (!id || seen.has(id)) return false; seen.add(id); return true; });
  }, [apiUsers, localUsers]);

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      try { const res = await api.post('/api/users', payload); return res.data; } catch { return payload; }
    },
    onSuccess: () => {
      setLocalUsers((prev) => [{ employeeId: form.employeeId.trim(), name: form.name.trim(), role: form.role, plant: form.plant, department: form.department, status: 'Active' }, ...prev]);
      qc.invalidateQueries({ queryKey: ['users'] });
      toast('success', `User "${form.name}" created`);
      setShowAddForm(false);
      setForm({ name: '', employeeId: '', role: 'role_operator', plant: 'Plant-V', department: 'Press Shop', password: '' });
    },
    onError: (err) => toast('error', `Error: ${String(err)}`),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.employeeId.trim()) { toast('error', 'Name and ID required'); return; }
    createMutation.mutate({ ...form, password: form.password.trim() || form.employeeId.trim() });
  }

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        if (!u.name?.toLowerCase().includes(q) && !u.employeeId?.toLowerCase().includes(q) && !u.department?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allUsers, roleFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = allUsers.length;
    const operators = allUsers.filter((u) => u.role === 'role_operator').length;
    const supervisors = allUsers.filter((u) => u.role === 'role_supervisor').length;
    const others = total - operators - supervisors;
    return { total, operators, supervisors, others };
  }, [allUsers]);

  function getRoleMeta(roleKey: string) {
    return ROLE_OPTIONS.find((r) => r.value === roleKey) || { value: roleKey, label: roleKey.replace('role_', ''), color: T.muted, bg: '#F1F5F9' };
  }

  function handleExportCSV() {
    const headers = ['Employee ID', 'Name', 'Role', 'Plant', 'Department', 'Status'];
    const rows = filteredUsers.map((u) => [u.employeeId, u.name, getRoleMeta(u.role).label, u.plant || '—', u.department || '—', u.status || 'Active']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Users_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 48 }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, background: toastMsg.type === 'success' ? '#10B981' : '#EF4444', color: '#FFFFFF', padding: '10px 18px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: 13, fontWeight: 600 }}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            Users & Access
          </h1>
          <div className="stats-bar" style={{ padding: '6px 0' }}>
            <span className="stats-bar__item"><span className="stats-bar__value">{stats.total}</span> Total</span>
            <span className="stats-bar__dot" />
            <span className="stats-bar__item"><span className="stats-bar__value">{stats.operators}</span> Operators</span>
            <span className="stats-bar__dot" />
            <span className="stats-bar__item"><span className="stats-bar__value">{stats.supervisors}</span> Supervisors</span>
            <span className="stats-bar__dot" />
            <span className="stats-bar__item"><span className="stats-bar__value">{stats.others}</span> QA & Mgmt</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {activeTab === 'directory' ? (
            <>
              <button type="button" onClick={handleExportCSV} style={{ background: '#FFFFFF', color: T.ink, border: `1px solid ${T.border}`, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Export</button>
              <button type="button" onClick={() => setShowAddForm(!showAddForm)} style={{ background: showAddForm ? '#64748B' : T.blue, color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {showAddForm ? 'Close' : '+ Add User'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleResetPolicy} style={{ background: '#FFFFFF', color: T.ink, border: `1px solid ${T.border}`, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
              <button type="button" onClick={handleSavePolicy} style={{ background: T.blue, color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save Policy</button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="clean-tab-bar">
        <button type="button" className={`clean-tab ${activeTab === 'directory' ? 'clean-tab--active' : ''}`} onClick={() => setActiveTab('directory')}>Users ({allUsers.length})</button>
        <button type="button" className={`clean-tab ${activeTab === 'accessControl' ? 'clean-tab--active' : ''}`} onClick={() => setActiveTab('accessControl')}>Access Control</button>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Add User Form */}
          {showAddForm && (
            <div className="clean-card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: T.ink, margin: 0 }}>New User</h2>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-builder-form" style={{ gap: '14px 18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Name <span style={{ color: T.red }}>*</span></label>
                    <input type="text" required placeholder="Rajesh Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.inputBorder}`, fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Employee ID <span style={{ color: T.red }}>*</span></label>
                    <input type="text" required placeholder="u010" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.inputBorder}`, fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Role <span style={{ color: T.red }}>*</span></label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.inputBorder}`, fontSize: 14, boxSizing: 'border-box', background: '#FFFFFF' }}>
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Plant <span style={{ color: T.red }}>*</span></label>
                    <select value={form.plant} onChange={(e) => setForm({ ...form, plant: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.inputBorder}`, fontSize: 14, boxSizing: 'border-box', background: '#FFFFFF' }}>
                      {effectivePlants.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Department</label>
                    <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.inputBorder}`, fontSize: 14, boxSizing: 'border-box', background: '#FFFFFF' }}>
                      {effectiveDepts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Password</label>
                    <input type="text" placeholder="Defaults to Employee ID" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.inputBorder}`, fontSize: 14, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ ...ghostBtn, padding: '9px 18px', fontSize: 13 }}>Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} style={{ ...primaryBtn, padding: '9px 20px', fontSize: 13 }}>{createMutation.isPending ? 'Saving…' : 'Create User'}</button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filter */}
          <div className="clean-card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: '1 1 260px', position: 'relative' }}>
              <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '9px 14px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {[{ key: 'ALL', label: 'All' }, ...ROLE_OPTIONS.map((r) => ({ key: r.value, label: r.label + 's' }))].map((tab) => (
                <button key={tab.key} type="button" onClick={() => setRoleFilter(tab.key)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${roleFilter === tab.key ? T.blue : T.border}`, background: roleFilter === tab.key ? '#EEF5FF' : '#FFFFFF', color: roleFilter === tab.key ? T.blue : T.ink, fontSize: 12, fontWeight: roleFilter === tab.key ? 600 : 500, cursor: 'pointer' }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          {/* Users Table / Cards */}
          <div className="clean-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-scroll desktop-table-view">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}`, textAlign: 'left', color: T.muted }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Department</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Plant</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: T.muted }}>Loading…</td></tr>}
                  {!isLoading && filteredUsers.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: T.muted }}>No users found</td></tr>}
                  {filteredUsers.map((u) => {
                    const rm = getRoleMeta(u.role);
                    return (
                      <tr key={u.employeeId} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: T.ink }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: T.muted, fontFamily: 'monospace' }}>{u.employeeId}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: rm.color, background: rm.bg }}>{rm.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: T.ink }}>{u.department || '—'}</td>
                        <td style={{ padding: '12px 16px', color: T.muted }}>{u.plant || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#15803D', background: '#DCFCE7', padding: '3px 8px', borderRadius: 999 }}>Active</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button type="button" onClick={() => { toast('success', `Password reset for ${u.name}`); }} style={{ background: '#F1F5F9', border: `1px solid ${T.border}`, color: T.ink, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 6 }}>Reset</button>
                          <button type="button" onClick={async () => { const ok = await showConfirm('Deactivate?', `Remove ${u.name}?`, 'Yes', 'Cancel'); if (ok) { setLocalUsers((prev) => prev.filter((x) => x.employeeId !== u.employeeId)); showSuccess('Removed', `${u.name} deactivated`); } }} style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Users Cards View */}
            <div className="mobile-cards-view" style={{ padding: 12 }}>
              {isLoading && <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>Loading…</div>}
              {!isLoading && filteredUsers.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: T.muted }}>No users found</div>}
              {filteredUsers.map((u) => {
                const rm = getRoleMeta(u.role);
                return (
                  <div key={u.employeeId} className="pitti-responsive-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: T.ink, fontSize: 14 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: T.muted, fontFamily: 'monospace', marginTop: 2 }}>ID: {u.employeeId}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, color: rm.color, background: rm.bg }}>
                          {rm.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#15803D', background: '#DCFCE7', padding: '3px 8px', borderRadius: 999 }}>
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="card-metric-grid" style={{ padding: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Department</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginTop: 2 }}>{u.department || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Plant</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginTop: 2 }}>{u.plant || '—'}</div>
                      </div>
                    </div>
                    <div className="card-action-bar" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                      <button
                        type="button"
                        onClick={() => { toast('success', `Password reset for ${u.name}`); }}
                        style={{ background: '#F1F5F9', border: `1px solid ${T.border}`, color: T.ink, padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', lineHeight: '16px' }}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await showConfirm('Deactivate?', `Remove ${u.name}?`, 'Yes', 'Cancel');
                          if (ok) {
                            setLocalUsers((prev) => prev.filter((x) => x.employeeId !== u.employeeId));
                            showSuccess('Removed', `${u.name} deactivated`);
                          }
                        }}
                        style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', lineHeight: '16px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '10px 16px', background: '#F8FAFC', borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.muted }}>
              {filteredUsers.length} of {allUsers.length} users
            </div>
          </div>
        </>
      ) : (
        /* ACCESS CONTROL — Clean Matrix */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) 1fr', gap: 16, alignItems: 'start' }}>
          {/* Roles List */}
          <div className="clean-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: '0 0 12px' }}>Roles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ROLE_OPTIONS.map((r) => {
                const isSel = r.value === selectedRoleId;
                const roleCfg = policy[r.value];
                const cnt = r.value === 'role_admin' ? SYSTEM_SCREENS.length : (roleCfg?.allowedScreens?.length || 0);
                return (
                  <button key={r.value} type="button" onClick={() => setSelectedRoleId(r.value)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: isSel ? '1px solid #D4E5FB' : '1px solid transparent', background: isSel ? '#EEF5FF' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: isSel ? 600 : 500, color: isSel ? T.blue : T.ink, transition: 'all 0.15s ease' }}>
                    <span>{r.label}</span>
                    <span style={{ fontSize: 11, color: T.muted }}>{cnt}/{SYSTEM_SCREENS.length}</span>
                  </button>
                );
              })}
            </div>

            {/* Landing Route */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 6 }}>Default Screen</label>
              <select value={(policy[selectedRoleId]?.defaultLandingRoute) || '/entry'} onChange={(e) => setLandingRouteForRole(selectedRoleId, e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, background: '#FFFFFF', cursor: 'pointer' }}>
                <option value="/entry">Production</option>
                <option value="/dashboard">Dashboard</option>
                <option value="/approvals">Approvals</option>
                <option value="/reports">Reports</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedRoleId !== 'role_admin' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button type="button" onClick={() => handleGrantAllScreens(selectedRoleId)} style={{ flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', cursor: 'pointer' }}>Grant All</button>
                <button type="button" onClick={() => handleRevokeAllScreens(selectedRoleId)} style={{ flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, background: '#F1F5F9', color: T.muted, border: `1px solid ${T.border}`, cursor: 'pointer' }}>Revoke</button>
              </div>
            )}

            {/* Executive Analytics Toggle */}
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>Analytics</span>
                <button
                  type="button"
                  className={`clean-toggle ${(selectedRoleId === 'role_admin' || (policy[selectedRoleId]?.canViewExecutiveAnalytics ?? (selectedRoleId === 'role_manager'))) ? 'clean-toggle--on' : ''}`}
                  onClick={() => {
                    if (selectedRoleId === 'role_admin') return;
                    const curr = policy[selectedRoleId]?.canViewExecutiveAnalytics ?? (selectedRoleId === 'role_manager');
                    setPolicy((prev) => ({
                      ...prev,
                      [selectedRoleId]: { ...(prev[selectedRoleId] || { roleId: selectedRoleId, roleName: '', description: '', defaultLandingRoute: '/entry', allowedScreens: ['entry'] }), canViewExecutiveAnalytics: !curr },
                    }));
                  }}
                  style={selectedRoleId === 'role_admin' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                />
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Executive dashboard charts</div>
            </div>
          </div>

          {/* Screens */}
          <div className="clean-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: 0 }}>
                Screen Access — <span style={{ color: T.blue }}>{ROLE_OPTIONS.find((r) => r.value === selectedRoleId)?.label}</span>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SYSTEM_SCREENS.map((screen) => {
                const isSA = selectedRoleId === 'role_admin';
                const cfg = policy[selectedRoleId] || { allowedScreens: ['entry'] };
                const isAllowed = isSA || cfg.allowedScreens.includes(screen.id);
                const isLocked = !isSA && (screen.superAdminKeyOnly || screen.superAdminOnly);

                return (
                  <div
                    key={screen.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1px solid ${isLocked ? '#FDE68A' : isAllowed ? '#BBF7D0' : T.border}`,
                      background: isLocked ? '#FFFBEB' : isAllowed ? '#F0FDF4' : '#FFFFFF',
                      cursor: isLocked || isSA ? 'default' : 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                    onClick={() => { if (!isLocked && !isSA) toggleScreenForRole(selectedRoleId, screen.id); }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{screen.label}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{screen.path}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isLocked && <span style={{ fontSize: 10, fontWeight: 600, color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>Admin only</span>}
                      <button
                        type="button"
                        className={`clean-toggle ${isAllowed ? 'clean-toggle--on' : ''}`}
                        onClick={(e) => { e.stopPropagation(); if (!isLocked && !isSA) toggleScreenForRole(selectedRoleId, screen.id); }}
                        style={isLocked || isSA ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
