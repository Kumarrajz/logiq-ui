import React from 'react';
import { T } from '../theme/tokens';

export function GlassPanel({
  children,
  style,
  dark = false,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        background: dark ? 'rgba(11, 25, 44, 0.65)' : T.appleGlassBg,
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : T.appleGlassBorder}`,
        borderRadius: 18,
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.2)' : T.appleGlassShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
