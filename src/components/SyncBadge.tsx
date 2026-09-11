import { T } from '../theme/tokens';
export function SyncBadge({ status }: { status: 'synced' | 'pending' | 'local' }) {
  const map = {
    synced: { bg: T.tealLight, fg: T.teal, label: 'Synced', dot: T.teal },
    pending: { bg: '#FFF3D9', fg: T.amberDark, label: 'Pending sync', dot: T.amber },
    local: { bg: T.redLight, fg: T.red, label: 'Saved locally', dot: T.red },
  };
  const s = map[status];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.label}</span>;
}
