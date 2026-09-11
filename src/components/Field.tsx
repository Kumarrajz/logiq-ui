import React from 'react';
import { T } from '../theme/tokens';
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 5 }}>{label}</div>{children}</div>;
}
export function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 6 }}>{label}</div>{children}</div>;
}
