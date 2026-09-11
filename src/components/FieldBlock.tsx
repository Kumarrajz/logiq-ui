import { T } from '../theme/tokens';
export function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>{label}</div>{children}</div>;
}
