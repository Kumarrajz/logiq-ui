import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { T } from '../theme/tokens';
import { Card } from '../components/Card';
import { StatusPill } from '../components/StatusPill';
import { SyncBadge } from '../components/SyncBadge';
import { SectionTitle } from '../components/SectionTitle';
import { primaryBtn, ghostBtn } from '../components/buttons';
import { BackButton } from '../components/BackButton';
import { useTemplates } from '../api/useTemplates';
import { useSubmissions } from '../api/useSubmissions';
import { useOfflineReady } from '../offline/useOfflineReady';
import { useAuthStore } from '../store/authStore';
import { db, type LocalSubmission } from '../offline/db';
import type { FormTemplate } from '../types/FormTemplate';
import type { FormSubmission } from '../types/FormSubmission';

const td = { padding: '6px 10px' };

export function FormListScreen() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isNewEntryMode = pathname.startsWith('/entry');
  const { data: templates = [], isLoading: tplLoading } = useTemplates();
  const { data: remote = [], isLoading: subLoading } = useSubmissions();
  const { isOnline, pendingCount, sync } = useOfflineReady();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const [local, setLocal] = useState<LocalSubmission[]>([]);
  const [q, setQ] = useState('');

  const visibleTemplates = useMemo(() => {
    const all = templates as FormTemplate[];
    if (permissions.includes('admin:full_access')) return all;
    return all.filter((t) => {
      const plantOk = !t.plants?.length || (user?.plant && t.plants.includes(user.plant));
      const deptOk = !t.departments?.length || (user?.department && t.departments.includes(user.department));
      return plantOk && deptOk;
    });
  }, [templates, user, permissions]);

  useEffect(() => {
    db.submissions.toArray().then(setLocal).catch(() => {});
  }, [pendingCount]);

  const rows: FormSubmission[] = useMemo(() => {
    const localRows: FormSubmission[] = local.map((l) => ({
      id: l.submissionId,
      submissionId: l.submissionId,
      templateId: String((l.payload as Record<string, unknown>).templateId ?? ''),
      plant: '', department: '', date: '', shift: '',
      status: ((l.payload as Record<string, unknown>).status as 'draft' | 'submitted') ?? 'draft',
      syncStatus: (l.syncStatus as FormSubmission['syncStatus']) ?? 'local_only',
      rows: [],
    }));
    const merged = [...localRows];
    for (const r of remote as FormSubmission[]) {
      if (!merged.some((m) => m.id === (r.id ?? (r as unknown as { submissionId: string }).submissionId))) merged.push(r);
    }
    const needle = q.trim().toLowerCase();
    if (!needle) return merged;
    return merged.filter((s) => {
      const rowText = JSON.stringify([...(s.rows ?? []), ...((s as unknown as { qaObservations?: unknown[] }).qaObservations ?? [])]).toLowerCase();
      return [s.id, s.templateId, s.department, s.shift, s.plant, rowText].join(' ').toLowerCase().includes(needle);
    });
  }, [local, remote, q]);

  const tplName = (id: string) => (templates as FormTemplate[]).find((t) => (t.id ?? t.templateId) === id)?.name ?? id;

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <BackButton to="/dashboard" label="Back" variant="nav" />
      </div>
      <SectionTitle sub={isNewEntryMode ? 'Pick a form to start a new shift entry' : 'All shift entries with live sync status'}>
        {isNewEntryMode ? 'New entry' : 'Submissions'}
      </SectionTitle>

      {!isOnline && (
        <Card style={{ marginBottom: 12, borderColor: T.amber }}>
          <span style={{ fontSize: 13 }}>Offline — entries save locally and sync when back online.</span>
          <button style={{ ...ghostBtn, marginLeft: 12 }} onClick={() => sync()}>Retry sync{pendingCount ? ` (${pendingCount})` : ''}</button>
        </Card>
      )}

      {isNewEntryMode && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12, marginBottom: 16 }}>
          {tplLoading && <Card>Loading templates…</Card>}
          {visibleTemplates.map((t) => {
            const tid = t.id ?? t.templateId ?? '';
            return (
              <Card key={tid}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>{t.grid?.label ?? t.sourceRef}</div>
                {(t.plants?.length || t.departments?.length) ? (
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>{[...(t.plants ?? []), ...(t.departments ?? [])].join(' · ')}</div>
                ) : <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>All plants</div>}
                <button style={primaryBtn} onClick={() => nav(`/entry/${tid}`)}>Start entry →</button>
              </Card>
            );
          })}
          {!tplLoading && visibleTemplates.length === 0 && (
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No forms assigned</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>No template matches {user?.plant}{user?.department ? ` · ${user.department}` : ''} — contact admin.</div>
            </Card>
          )}
          {!tplLoading && (templates as FormTemplate[]).length === 0 && (
            <Card>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Assembly DPR</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>No templates from API — offline demo</div>
              <button style={primaryBtn} onClick={() => nav('/entry/tpl_assembly_dpr')}>Start entry →</button>
            </Card>
          )}
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Traceability search: coil, batch, model, machine…" style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13 }} />
          {isNewEntryMode || <button style={ghostBtn} onClick={() => nav('/entry')}>+ New entry</button>}
        </div>
        {subLoading && rows.length === 0 ? <div style={{ fontSize: 13, color: T.muted }}>Loading…</div> : (
          <>
            {/* Desktop Table View */}
            <div className="table-scroll desktop-table-view">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
                <thead><tr style={{ textAlign: 'left', color: T.muted, borderBottom: `1px solid ${T.border}` }}>
                  {['ID', 'Form', 'Department', 'Shift', 'Date', 'Status', 'Sync'].map((h) => <th key={h} style={{ padding: '8px 10px', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {rows.map((s) => {
                    const sid = s.id ?? (s as unknown as { submissionId: string }).submissionId;
                    return (
                      <tr key={sid} style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }} onClick={() => nav(`/submissions/${sid}`)}>
                        <td style={td}>{sid}</td><td style={td}>{tplName(s.templateId)}</td><td style={td}>{s.department || '—'}</td>
                        <td style={td}>{s.shift || '—'}</td><td style={td}>{s.date || '—'}</td>
                        <td style={td}><StatusPill status={s.status} /></td>
                        <td style={td}><SyncBadge status={s.syncStatus === 'local_only' ? 'local' : s.syncStatus === 'synced' ? 'synced' : 'pending'} /></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 16, color: T.muted }}>No entries yet — pick a template above to start.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards View */}
            <div className="mobile-cards-view">
              {rows.map((s) => {
                const sid = s.id ?? (s as unknown as { submissionId: string }).submissionId;
                return (
                  <div
                    key={sid}
                    className="pitti-responsive-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => nav(`/submissions/${sid}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E60D5', fontFamily: 'Space Grotesk' }}>
                        {sid}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StatusPill status={s.status} />
                        <SyncBadge status={s.syncStatus === 'local_only' ? 'local' : s.syncStatus === 'synced' ? 'synced' : 'pending'} />
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
                      {tplName(s.templateId)}
                    </div>
                    <div className="card-metric-grid" style={{ padding: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Department</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginTop: 2 }}>{s.department || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Shift</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginTop: 2 }}>{s.shift || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: T.muted }}>Date</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, marginTop: 2 }}>{s.date || '—'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {rows.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: T.muted, background: '#FFFFFF', borderRadius: 12, border: `1px solid ${T.border}` }}>
                  No entries yet — pick a template above to start.
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
