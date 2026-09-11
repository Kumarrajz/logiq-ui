import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormTemplate } from '../types/FormTemplate';
import { FieldRenderer } from './FieldRenderer';
import { DataGrid } from './DataGrid';
import { SignOffBar } from './SignOffBar';
import { CorrectionBar, AuditTrail } from './CorrectionBar';
import { Field } from '../components/Field';
import { primaryBtn, ghostBtn } from '../components/buttons';
import { db } from '../offline/db';
import { useCreateSubmission, useUpdateSubmission } from '../api/useSubmissions';
import { useOfflineReady } from '../offline/useOfflineReady';
import { useAuthStore } from '../store/authStore';
import { T } from '../theme/tokens';

interface Props {
  template: FormTemplate;
  submissionId?: string;
  initialHeader?: Record<string, unknown>;
  initialRows?: Record<string, unknown>[];
  initialQa?: Record<string, unknown>[];
  initialSigns?: { role: string; userId: string; at: string }[];
  initialStatus?: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected' | string;
  initialCorrection?: { status?: string; reason?: string; requestedBy?: string; requestedAt?: string };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}

export function FormRenderer({
  template,
  submissionId,
  initialHeader = {},
  initialRows,
  initialQa,
  initialSigns = [],
  initialStatus = 'draft',
  initialCorrection,
}: Props) {
  const nav = useNavigate();
  const [header, setHeader] = useState<Record<string, unknown>>(initialHeader);
  const [rows, setRows] = useState<Record<string, unknown>[]>(initialRows ?? [{}]);
  const [qaRows, setQaRows] = useState<Record<string, unknown>[]>(initialQa ?? []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const create = useCreateSubmission();
  const update = useUpdateSubmission(submissionId);
  const { isOnline } = useOfflineReady();
  const permissions = useAuthStore((s) => s.permissions);
  const canQa = permissions.includes('qa:record_observation') || permissions.includes('admin:full_access');
  const tid = template.id ?? template.templateId ?? '';

  async function persist(status: 'draft' | 'submitted') {
    if (!rows.length || rows.every((r) => Object.keys(r).length === 0)) {
      setMsg('Add at least one grid row before saving.');
      return;
    }
    setSaving(true);
    setMsg('');
    const sid = submissionId ?? uid('SUB');
    const payload = {
      submissionId: sid,
      templateId: tid,
      plant: 'Plant-V',
      department: template.departments?.[0] || 'Press Shop & Notching',
      date: String(header.date ?? new Date().toISOString().slice(0, 10)),
      shift: String(header.shift ?? 'A'),
      status,
      syncStatus: 'local_only',
      rows,
      qaObservations: qaRows,
      header,
      submittedAt: status === 'submitted' ? new Date().toISOString() : undefined,
    };
    try {
      await db.submissions.add({ submissionId: sid, payload, syncStatus: 'local_only', updatedAt: Date.now() });
    } catch {
      /* already cached */
    }
    if (!isOnline) {
      setMsg('Saved locally — will sync when online.');
      setSaving(false);
      return;
    }
    try {
      if (submissionId) await update.mutateAsync({ ...payload, syncStatus: 'synced' });
      else await create.mutateAsync({ ...payload, syncStatus: 'synced' });
      const rec = await db.submissions.where('submissionId').equals(sid).first();
      if (rec?.id) await db.submissions.update(rec.id, { syncStatus: 'synced' });
      setMsg(status === 'draft' ? 'Draft saved & synced.' : 'Submitted for sign-off.');
      if (status === 'submitted') nav('/approvals');
    } catch {
      setMsg('Server unreachable — kept locally as pending.');
      const rec = await db.submissions.where('submissionId').equals(sid).first();
      if (rec?.id) await db.submissions.update(rec.id, { syncStatus: 'pending' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="responsive-card"
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Section 1: Header Parameters */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: T.ink,
            margin: '0 0 16px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Shift & Machine Parameters
        </h2>
        <div className="grid-entry-header">
          {template.header.map((h) => (
            <Field key={h.key} label={h.label}>
              <FieldRenderer field={h} value={header[h.key]} onChange={(v) => setHeader((p) => ({ ...p, [h.key]: v }))} />
            </Field>
          ))}
        </div>
      </div>

      {/* Section 2: Operations Data Grid */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: T.ink,
            margin: '0 0 16px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {template.grid.label}
        </h2>
        <div className="table-scroll" style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <DataGrid label={template.grid.label} columns={template.grid.columns} rows={rows} setRows={setRows} />
        </div>
      </div>

      {/* Section 3: QA Grid if present */}
      {template.qaGrid && (
        <div style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.ink,
              margin: '0 0 16px',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {template.qaGrid.label}
          </h2>
          <div className="table-scroll" style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <DataGrid label={template.qaGrid.label} columns={template.qaGrid.columns} rows={qaRows} setRows={setQaRows} readOnly={!canQa} />
          </div>
          {!canQa && <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>QA observations are read-only — QA Inspector role required.</div>}
        </div>
      )}

      {/* SignOff and Audit */}
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20, marginBottom: 20 }}>
        <SignOffBar roles={template.signOff} signs={initialSigns} submissionId={submissionId} />
        <CorrectionBar submissionId={submissionId} correction={initialCorrection} />
        <AuditTrail submissionId={submissionId} />
      </div>

      {msg && (
        <div
          style={{
            background: msg.includes('Draft') || msg.includes('Submitted') ? '#DCFCE7' : '#FEF3C7',
            color: msg.includes('Draft') || msg.includes('Submitted') ? '#15803D' : '#B45309',
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {msg}
        </div>
      )}

      {/* Bottom Actions Row matching Press Shop design */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          flexWrap: 'wrap',
          borderTop: `1px solid ${T.border}`,
          paddingTop: 20,
        }}
      >
        <button
          type="button"
          style={{ ...ghostBtn, padding: '11px 22px', fontSize: 14, minHeight: 44 }}
          disabled={saving}
          onClick={() => persist('draft')}
        >
          {saving ? 'Saving…' : 'Save as Draft'}
        </button>
        <button
          type="button"
          style={{
            ...primaryBtn,
            padding: '11px 24px',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minHeight: 44,
          }}
          disabled={saving}
          onClick={() => persist('submitted')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          {saving ? 'Submitting…' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  );
}
