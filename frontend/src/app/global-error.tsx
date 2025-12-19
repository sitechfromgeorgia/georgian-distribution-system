'use client'

/**
 * Global Error Boundary
 *
 * Catches errors in the root layout, including errors in the root layout itself.
 * This is the last line of defense for error handling.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

import * as React from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Inner content component - exported for testing purposes
 * The GlobalError component must render <html> and <body> for Next.js,
 * but this inner component can be tested without those wrapper elements.
 */
export function GlobalErrorContent({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // Log critical error to console (simplified - no external dependencies)
    console.error('Critical application error', error, {
      digest: error.digest,
      location: 'global-error-boundary',
    })
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ კრიტიკული შეცდომა</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          ბოდიში, მოხდა სერიოზული შეცდომა. გთხოვთ, გადატვირთოთ გვერდი.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              textAlign: 'left',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}
          >
            {error.message}
            {error.digest && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                Error ID: {error.digest}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            სცადე თავიდან
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            მთავარი გვერდი
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Global Error component for Next.js
 * Must render full HTML document as it replaces the entire page on critical errors
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <GlobalErrorContent error={error} reset={reset} />
      </body>
    </html>
  )
}
