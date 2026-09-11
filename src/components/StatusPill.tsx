import { T } from '../theme/tokens';

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pending: { bg: '#FFEDD5', fg: '#C2410C', label: 'Pending' },
    approved: { bg: '#DCFCE7', fg: '#15803D', label: 'Approved' },
    rejected: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Rejected' },
    synced: { bg: '#DCFCE7', fg: '#15803D', label: 'Synced' },
    submitted: { bg: '#E0F2FE', fg: '#0369A1', label: 'Submitted' },
    draft: { bg: '#F1F5F9', fg: '#64748B', label: 'Draft' },
    running: { bg: '#DCFCE7', fg: '#15803D', label: 'Running' },
    idle: { bg: '#FEF3C7', fg: '#B45309', label: 'Idle' },
    breakdown: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Breakdown' },
    'local only': { bg: '#FEE2E2', fg: '#B91C1C', label: 'Local only' },
    local_only: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Local only' },
  };
  const s = map[status?.toLowerCase()] || { bg: '#F1F5F9', fg: '#64748B', label: status || 'Draft' };
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {s.label}
    </span>
  );
}
