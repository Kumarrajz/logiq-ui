import React, { Component, ErrorInfo, ReactNode } from 'react';
import { T } from '../theme/tokens';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    // Clear potentially corrupted local state and return to safe dashboard
    try {
      localStorage.removeItem('logiq-last-error');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected error occurred.';

      return (
        <div
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: '100%',
              background: '#FFFFFF',
              borderRadius: 16,
              border: `1px solid ${T.border}`,
              boxShadow: '0 12px 36px rgba(11, 25, 44, 0.12)',
              padding: '32px 28px',
              textAlign: 'center',
            }}
          >
            {/* Warning Icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: T.ink,
                margin: '0 0 8px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>

            <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px', lineHeight: 1.5 }}>
              The application encountered an unexpected issue while rendering this view. Your session and data are secure.
            </p>

            {/* Error detail snippet */}
            <div
              style={{
                background: '#F8FAFC',
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 12,
                color: '#DC2626',
                fontFamily: 'monospace',
                textAlign: 'left',
                marginBottom: 24,
                overflowX: 'auto',
                maxHeight: 120,
              }}
            >
              {errorMsg}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: '#FFFFFF',
                  color: T.ink,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: T.blue,
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(30, 96, 213, 0.3)',
                }}
              >
                Return to Dashboard →
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
