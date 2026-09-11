import { useState } from 'react';
import { T } from '../theme/tokens';
import { ghostBtn, primaryBtn } from '../components/buttons';
import { useAuthStore } from '../store/authStore';
import { useRequestCorrection, useApproveCorrection, useAuditTrail } from '../api/useSubmissions';

interface Correction { status?: string; reason?: string; requestedBy?: string; requestedAt?: string; decidedBy?: string; decidedAt?: string; }

export function CorrectionBar({ submissionId, correction }: { submissionId?: string; correction?: Correction }) {
  const permissions = useAuthStore((s) => s.permissions);
  const canRequest = permissions.includes('form:request_correction') || permissions.includes('admin:full_access');
  const canApprove = permissions.includes('form:approve_correction') || permissions.includes('admin:full_access');
  const req = useRequestCorrection(submissionId);
  const ap = useApproveCorrection(submissionId);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');

  if (!submissionId) return null;

  async function doRequest() {
    if (!reason.trim()) { setMsg('Give a reason first.'); return; }
    try { await req.mutateAsync(reason.trim()); setMsg('Correction requested.'); setReason(''); }
    catch { setMsg('Request failed.'); }
  }

  async function decide(approve: boolean) {
    try { await ap.mutateAsync(approve); setMsg(approve ? 'Correction approved — entry can be resubmitted.' : 'Correction rejected.'); }
    catch { setMsg('Decision failed.'); }
  }

  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
        Correction{correction?.status ? ` · ${correction.status}` : ' · none'}
      </div>
      {correction?.status === 'requested' && (
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
          Requested by {correction.requestedBy}: “{correction.reason}”
        </div>
      )}
      {(!correction || correction.status !== 'requested') && canRequest && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for correction…" style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
          <button style={ghostBtn} disabled={req.isPending} onClick={doRequest}>Request correction</button>
        </div>
      )}
      {correction?.status === 'requested' && canApprove && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={primaryBtn} disabled={ap.isPending} onClick={() => decide(true)}>Approve</button>
          <button style={ghostBtn} disabled={ap.isPending} onClick={() => decide(false)}>Reject</button>
        </div>
      )}
      {msg && <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{msg}</div>}
    </div>
  );
}

export function AuditTrail({ submissionId }: { submissionId?: string }) {
  const { data = [], isLoading } = useAuditTrail(submissionId);
  if (!submissionId) return null;
  const rows = data as { action: string; userId?: string; role?: string; at?: string; note?: string }[];
  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Audit trail</div>
      {isLoading ? <div style={{ fontSize: 12, color: T.muted }}>Loading…</div>
        : rows.length === 0 ? <div style={{ fontSize: 12, color: T.muted }}>No entries yet.</div>
        : rows.map((a, i) => (
          <div key={i} style={{ fontSize: 12, color: T.ink, padding: '4px 0', borderBottom: `1px solid ${T.paper}` }}>
            <b>{a.action}</b> · {a.userId ?? '?'} ({a.role ?? '?'}) · {a.at ? new Date(a.at).toLocaleString() : ''}{a.note ? ` · ${a.note}` : ''}
          </div>
        ))}
    </div>
  );
}
