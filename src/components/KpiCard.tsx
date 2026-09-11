import { T } from '../theme/tokens';
export function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 26, fontWeight: 700, color: '#fff', margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: 12, color: accent || 'rgba(255,255,255,0.5)' }}>{sub}</div>
    </div>
  );
}
