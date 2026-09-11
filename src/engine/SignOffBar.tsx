import { useState } from 'react';
import { T } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { useSignSubmission } from '../api/useSubmissions';

const SIGN_PERMS = ['form:countersign', 'qa:sign'];

export function SignOffBar({ roles, signs = [], submissionId }: { roles: string[]; signs?: { role: string; userId: string; at: string }[]; submissionId?: string }) {
  const permissions = useAuthStore((s) => s.permissions);
  const canSign = SIGN_PERMS.some((p) => permissions.includes(p)) || permissions.includes('admin:full_access');
  const sign = useSignSubmission(submissionId);
  const [msg, setMsg] = useState('');
  const signed = new Set(signs.map((s) => s.role));

  async function doSign() {
    if (!submissionId) return;
    setMsg('');
    try {
      await sign.mutateAsync();
      setMsg('Signed.');
    } catch {
      setMsg('Sign failed — server unreachable or forbidden.');
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {roles.map((r) => (
          <span key={r} style={{ fontSize: 12, color: signed.has(r) ? T.teal : T.muted, border: `1px solid ${signed.has(r) ? T.teal : T.border}`, borderRadius: 999, padding: '4px 10px' }}>
            {r} · {signed.has(r) ? 'signed' : 'pending'}
          </span>
        ))}
      </div>
      {submissionId && canSign && (
        <div style={{ marginTop: 10 }}>
          <button onClick={doSign} disabled={sign.isPending} style={{ border: 'none', background: T.teal, color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: sign.isPending ? 'wait' : 'pointer' }}>
            {sign.isPending ? 'Signing…' : 'Sign off'}
          </button>
          {msg && <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>{msg}</span>}
        </div>
      )}
      {submissionId && !canSign && <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>Your role cannot sign — supervisor / QA only.</div>}
    </div>
  );
}
