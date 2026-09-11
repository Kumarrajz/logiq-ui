import React, { useState } from 'react';
import { T } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';

export const INSPIRATIONAL_QUOTES = [
  {
    quote: 'Quality is never an accident; it is always the result of high intention, sincere effort, and intelligent execution.',
    author: 'John Ruskin',
    tag: 'Craftsmanship & Precision',
  },
  {
    quote: 'Precision engineering, zero defects, safety first — every stroke, every shift matters at Pitti.',
    author: 'Pitti Industrial Excellence Creed',
    tag: 'Pitti Core Value',
  },
  {
    quote: 'Quality is everyone’s responsibility, and it begins with the pride you take in every lamination stamped.',
    author: 'W. Edwards Deming',
    tag: 'Shopfloor Pride',
  },
  {
    quote: 'Take the best that exists and make it better. When it does not exist, engineer it.',
    author: 'Sir Henry Royce',
    tag: 'Engineering Ingenuity',
  },
  {
    quote: 'Defects are prevented at the source, not inspected at the end. Right the first time, every time.',
    author: 'Joseph M. Juran',
    tag: 'Zero Defect Culture',
  },
  {
    quote: 'Safety is not a gadget, but a state of mind. Protect yourself, protect your teammates.',
    author: 'Eleanor Everet',
    tag: 'Safety Above All',
  },
];

/**
 * Inspirational Quote Banner & Shift Status for shopfloor users (operators/supervisors).
 * Displays daily motivational quote and active shift status pills.
 */
export function EntryPortalHeader() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  // Inspirational quote & shift banner are for shopfloor users, not super admin
  if (role === 'role_admin') {
    return null;
  }

  const [quoteIdx, setQuoteIdx] = useState(() => {
    const day = new Date().getDate();
    return day % INSPIRATIONAL_QUOTES.length;
  });

  const activeQuote = INSPIRATIONAL_QUOTES[quoteIdx];

  function nextQuote() {
    setQuoteIdx((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Sleek Glassmorphic Daily Quote Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0B192C 0%, #152A4A 60%, #1E3E6B 100%)',
          borderRadius: 14,
          padding: '18px 22px',
          color: '#FFFFFF',
          boxShadow: '0 8px 24px rgba(11, 25, 44, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 12,
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(30, 96, 213, 0.45)',
                  color: '#93C5FD',
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(147, 197, 253, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg> Daily Inspiration · {activeQuote.tag}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                Welcome, <strong>{user?.name || 'Operator'}</strong>
              </span>
            </div>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                fontWeight: 500,
                margin: '0 0 6px 0',
                color: '#F8FAFC',
                fontStyle: 'italic',
                maxWidth: 720,
              }}
            >
              “{activeQuote.quote}”
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#93C5FD', fontWeight: 600 }}>
              <span>— {activeQuote.author}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={nextQuote}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
              alignSelf: 'flex-start',
            }}
            title="Click for another inspirational quote"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Next Quote
          </button>
        </div>
      </div>

      {/* Compact Shift Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          padding: '10px 16px',
          background: '#FFFFFF',
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          fontSize: 13,
          color: '#64748B',
        }}
      >
        {/* Shift */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#10B981',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 600, color: '#1E293B' }}>Shift A</span>
          <span>06:00 – 14:00</span>
        </div>

        <span style={{ color: '#CBD5E1' }}>·</span>

        {/* Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, color: '#1E293B' }}>Line N3-5446</span>
        </div>

        <span style={{ color: '#CBD5E1' }}>·</span>

        {/* Target */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Target: 1,200 Kgs</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#10B981',
              background: '#ECFDF5',
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            92%
          </span>
        </div>
      </div>
    </div>
  );
}
