import React from 'react';
import { T } from '../theme/tokens';
export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 600, color: T.ink, margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}
