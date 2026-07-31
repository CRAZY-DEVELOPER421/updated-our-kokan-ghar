'use client';

// Must be dynamic — the root layout's client providers fail during static prerendering of this route
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('⚠️ Global Error:', error?.message);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: 'system-ui, sans-serif',
            backgroundColor: '#FAF7F0',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌊</div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#1C1C1E',
              marginBottom: '12px',
            }}>
              Something went wrong!
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}>
              The Konkan sea breeze must have tangled our wires. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#2D6A4F',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
