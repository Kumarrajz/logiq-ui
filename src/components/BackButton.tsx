import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  to?: string | -1;
  label?: string;
  variant?: 'nav' | 'primary' | 'success' | 'dark';
  style?: React.CSSProperties;
}

export function BackButton({ to = -1, label = 'Back to Dashboard', variant = 'nav', style }: BackButtonProps) {
  const nav = useNavigate();
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  function handleClick() {
    if (typeof to === 'number') {
      if (window.history.length > 1) {
        nav(-1);
      } else {
        nav('/dashboard');
      }
    } else {
      nav(to);
    }
  }

  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';
  const isDark = variant === 'dark';

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      title={`Navigate: ${label}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Space Grotesk', 'Inter', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        borderRadius: 980, // Signature Apple pill curve
        padding: '7px 16px',
        cursor: 'pointer',
        userSelect: 'none',
        touchAction: 'manipulation',
        overflow: 'hidden',
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease, border-color 0.2s ease',
        transform: isPressed ? 'scale(0.96)' : isHovered ? 'translateY(-1px) scale(1.02)' : 'scale(1)',
        
        // Apple Multi-stop Flowing Gradient & Material Surface
        background: isPrimary
          ? 'linear-gradient(135deg, #0A84FF 0%, #0066CC 35%, #4F46E5 70%, #0A84FF 100%)'
          : isSuccess
          ? 'linear-gradient(135deg, #34C759 0%, #28CD41 35%, #059669 70%, #34C759 100%)'
          : isDark
          ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
          : isHovered
          ? 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 246, 251, 0.94) 100%)',
        backgroundSize: isPrimary || isSuccess ? '250% 250%' : 'auto',
        animation: (isPrimary || isSuccess) ? 'appleGradientShift 6s ease infinite' : 'none',
        
        color: isPrimary || isSuccess || isDark ? '#FFFFFF' : isHovered ? '#007AFF' : '#0F172A',
        
        // Apple Sleek 1px Translucent Border
        border: isPrimary
          ? '1px solid rgba(255, 255, 255, 0.35)'
          : isSuccess
          ? '1px solid rgba(255, 255, 255, 0.35)'
          : isDark
          ? '1px solid rgba(255, 255, 255, 0.15)'
          : `1px solid ${isHovered ? 'rgba(0, 122, 255, 0.4)' : 'rgba(203, 213, 225, 0.85)'}`,

        // Apple Soft Luminous Ambient Glow (No chunky bottom drop)
        boxShadow: isPressed
          ? isPrimary
            ? '0 2px 6px rgba(10, 132, 255, 0.3), inset 0 1px 2px rgba(0, 0, 0, 0.2)'
            : '0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.05)'
          : isHovered
          ? isPrimary
            ? '0 8px 24px rgba(10, 132, 255, 0.52), inset 0 1px 1px rgba(255, 255, 255, 0.6)'
            : isSuccess
            ? '0 8px 24px rgba(52, 199, 89, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6)'
            : isDark
            ? '0 8px 22px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
            : '0 6px 20px rgba(0, 122, 255, 0.16), inset 0 1px 1px rgba(255, 255, 255, 1)'
          : isPrimary
          ? '0 4px 14px rgba(10, 132, 255, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
          : isSuccess
          ? '0 4px 14px rgba(52, 199, 89, 0.38), inset 0 1px 1px rgba(255, 255, 255, 0.45)'
          : isDark
          ? '0 4px 14px rgba(0, 0, 0, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
        
        ...style,
      }}
    >
      {/* Apple Liquid Specular Light Sheen Glide */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: isHovered ? '160%' : '-120%',
          width: '60%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent)',
          transform: 'skewX(-22deg)',
          transition: isHovered ? 'left 0.75s ease-in-out' : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Apple-style Chevron */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: isPrimary || isSuccess || isDark
            ? 'rgba(255, 255, 255, 0.18)'
            : isHovered
            ? 'rgba(0, 122, 255, 0.12)'
            : 'rgba(15, 23, 42, 0.06)',
          transition: 'all 0.2s ease',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isHovered ? 'translateX(-1px)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </span>

      {/* Button Label */}
      <span>{label}</span>
    </button>
  );
}
