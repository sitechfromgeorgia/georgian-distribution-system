// 🚫 API ROUTE DEPRECATED - SUPABASE OPTIMIZATION
// 
// This API route has been REMOVED as Supabase handles CSRF protection natively.
// 
// USE: No custom CSRF implementation needed
//
// Supabase Auth automatically provides CSRF protection for all authentication flows.
// This endpoint is no longer needed.
//
// 📖 Migration Guide:
// 1. Remove all useCSRF() hook usage
// 2. Remove all CSRF token generation/validation logic
// 3. Use direct Supabase Auth calls without CSRF concerns
// 4. Supabase handles CSRF protection automatically

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'API Deprecated',
      message: 'CSRF protection is handled automatically by Supabase Auth',
      migration: {
        from: 'GET /api/csrf',
        to: 'No CSRF implementation needed - Supabase handles it automatically',
        documentation: 'https://supabase.com/docs/guides/auth/auth-email'
      }
    },
    { status: 410 } // Gone
  )
}