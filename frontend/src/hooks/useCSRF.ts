'use client'

/**
 * CSRF Hook - DEPRECATED
 *
 * This hook is no longer needed as Supabase handles CSRF protection natively.
 * All authentication flows are now handled directly through Supabase Auth.
 *
 * DELETED: /api/csrf endpoint as Supabase handles security automatically.
 */

export function useCSRF() {
  console.warn('useCSRF is deprecated. Supabase handles CSRF protection natively.')
  
  return {
    csrfToken: null,
    loading: false,
    getHeaders: () => ({ 'Content-Type': 'application/json' }),
    refreshToken: () => Promise.resolve()
  }
}