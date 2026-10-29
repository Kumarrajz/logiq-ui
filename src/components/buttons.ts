import { CSSProperties } from 'react';
import { T } from '../theme/tokens';

export function inputStyle(dark = false): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    borderRadius: 8,
    border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255, 255, 255, 0.75)',
    background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    color: dark ? '#FFFFFF' : T.ink,
    fontSize: 14,
    outline: 'none',
    boxShadow: '0 4px 14px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };
}

export const primaryBtn: CSSProperties = {
  background: 'linear-gradient(135deg, #1E60D5 0%, #1653BA 100%)',
  color: '#FFFFFF',
  border: '1px solid rgba(255, 255, 255, 0.35)',
  backdropFilter: 'blur(12px)',
  padding: '10px 20px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 14px rgba(30, 96, 213, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
};

export const ghostBtn: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  color: T.ink,
  border: '1px solid rgba(255, 255, 255, 0.8)',
  padding: '10px 18px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
};

export const selStyle: CSSProperties = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.75)',
  fontSize: 13,
  background: 'rgba(255, 255, 255, 0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  color: T.ink,
  outline: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 14px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
};
