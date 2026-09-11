import React from 'react';
import { T } from '../theme/tokens';

export function Card({
  children,
  style,
  interactive,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`apple-card ${interactive ? 'apple-card-interactive' : ''} ${className}`}
      style={{
        background: T.appleGlassBg,
        backdropFilter: T.appleBlur,
        WebkitBackdropFilter: T.appleBlur,
        border: `1px solid ${T.appleGlassBorder}`,
        boxShadow: T.appleGlassShadow,
        borderRadius: 18,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

