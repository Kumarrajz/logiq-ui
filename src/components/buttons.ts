import { CSSProperties } from 'react';
import { T } from '../theme/tokens';

export function inputStyle(dark = false): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    borderRadius: 8,
    border: dark ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${T.border}`,
    background: dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
    color: dark ? '#FFFFFF' : T.ink,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  };
}

export const primaryBtn: CSSProperties = {
  background: T.blue,
  color: '#FFFFFF',
  border: 'none',
  padding: '10px 20px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 1px 3px rgba(30, 96, 213, 0.25)',
};

export const ghostBtn: CSSProperties = {
  background: '#FFFFFF',
  color: T.ink,
  border: `1px solid ${T.border}`,
  padding: '10px 18px',
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

export const selStyle: CSSProperties = {
  padding: '9px 12px',
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  fontSize: 13,
  background: '#FFFFFF',
  color: T.ink,
  outline: 'none',
  cursor: 'pointer',
};
