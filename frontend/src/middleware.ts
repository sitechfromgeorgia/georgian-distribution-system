/**
 * Next.js Middleware with Supabase Authentication and i18n
 *
 * This middleware handles:
 * 1. Internationalization (i18n) with next-intl
 * 2. Session refresh and authentication
 * 3. Route protection based on user roles
 * 4. CSRF token validation for mutations
 * 5. Security headers
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 * @see https://next-intl-docs.vercel.app/docs/routing/middleware
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import type { Database } from '@/types/database'
import { getEnvVar, env } from '@/lib/env'
import { locales, defaultLocale } from '@/i18n/config'

/**
 * Protected routes that require authentication (without locale prefix)
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/orders',
  '/api/orders',
  '/api/products',
  '/api/analytics',
]

/**
 * User role type based on database schema
 */
type UserRole = 'admin' | 'restaurant' | 'driver' | 'demo'

/**
 * Profile type returned from database query
 */
type ProfileRole = {
  role: UserRole
}

/**
 * Routes that require specific roles (without locale prefix)
 */
const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/admin': ['admin'],
  '/dashboard/restaurant': ['admin', 'restaurant'],
  '/dashboard/driver': ['admin', 'driver'],
  '/api/admin': ['admin'],
  '/api/analytics': ['admin'],
}

/**
 * Public routes that don't require authentication (without locale prefix)
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/test',
  '/diagnostic',
  '/health',
  '/api/health',
  '/api/csrf',
  '/api/contact',
]

/**
 * Mutation methods that require CSRF protection
 */
const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Strip locale from pathname to get the actual route
 */
function stripLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || '/'
    }
  }
  return pathname
}

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some(route => {
    // Exact match
    if (path === route) return true
    // Prefix match for nested routes
    if (path.startsWith(route + '/')) return true
    return false
  })
}

/**
 * Validate CSRF token for mutation requests
 */
function validateCSRF(request: NextRequest): boolean {
  // Skip CSRF for GET requests
  if (!MUTATION_METHODS.includes(request.method)) {
    return true
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get('x-csrf-token')

  // Get CSRF token from cookie
  const csrfCookie = request.cookies.get('csrf-token')?.value

  // Validate tokens match
  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
    return false
  }

  return true
}

/**
 * Create next-intl middleware for locale handling
 */
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip locale handling for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return handleAuthMiddleware(request)
  }

  // Handle i18n routing first
  const intlResponse = intlMiddleware(request)

  // Get pathname without locale for route matching
  const pathnameWithoutLocale = stripLocale(pathname)

  // If it's a public route or static file, return the intl response
  if (matchesRoute(pathnameWithoutLocale, PUBLIC_ROUTES)) {
    return intlResponse
  }

  // For protected routes, apply auth middleware
  return handleAuthMiddleware(request, intlResponse)
}

/**
 * Authentication middleware logic
 */
async function handleAuthMiddleware(
  request: NextRequest,
  baseResponse: NextResponse = NextResponse.next({ request: { headers: request.headers } })
) {
  const { pathname } = request.nextUrl
  const pathnameWithoutLocale = stripLocale(pathname)

  // Create response
  let response = baseResponse

  // Create Supabase client with cookie handling
  const supabase = createServerClient<Database>(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Set cookie in both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          // Remove cookie from both request and response
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if needed
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Add comprehensive security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy (CSP)
  const isDevelopment = process.env.NODE_ENV === 'development'

  const cspDirectives = [
    "default-src 'self'",
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net"
      : "script-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://data.greenland77.ge wss://*.supabase.co wss://*.supabase.in",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspDirectives)

  // Strict Transport Security (HSTS) - Only in production
  if (env.isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  )

  // Check if route is public
  const isPublicRoute = matchesRoute(pathnameWithoutLocale, PUBLIC_ROUTES)

  if (isPublicRoute) {
    return response
  }

  // Check if route requires authentication
  const isProtectedRoute = matchesRoute(pathnameWithoutLocale, PROTECTED_ROUTES)

  if (isProtectedRoute) {
    // No session - redirect to login (preserve locale)
    if (!session) {
      // Extract locale from pathname
      let locale = defaultLocale
      for (const loc of locales) {
        if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
          locale = loc
          break
        }
      }

      const redirectUrl = new URL(`/${locale}/login`, request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate CSRF for API mutations
    if (pathnameWithoutLocale.startsWith('/api/') && !validateCSRF(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (matchesRoute(pathnameWithoutLocale, [route])) {
        // Get user profile to check role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        // Type guard: Validate profile has correct structure
        const isValidProfile = (p: unknown): p is ProfileRole => {
          return p !== null &&
                 typeof p === 'object' &&
                 'role' in p &&
                 typeof (p as ProfileRole).role === 'string'
        }

        // Validate profile
        if (profileError || !profileData || !isValidProfile(profileData)) {
          // Invalid profile - redirect to login (preserve locale)
          let locale = defaultLocale
          for (const loc of locales) {
            if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
              locale = loc
              break
            }
          }
          return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
        }

        // At this point, TypeScript knows profileData is ProfileRole
        const profile: ProfileRole = profileData

        // Check if user has required role
        if (!allowedRoles.includes(profile.role)) {
          // Unauthorized - redirect to appropriate dashboard based on user's actual role (preserve locale)
          let locale = defaultLocale
          for (const loc of locales) {
            if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
              locale = loc
              break
            }
          }

          switch (profile.role) {
            case 'restaurant':
              return NextResponse.redirect(new URL(`/${locale}/dashboard/restaurant`, request.url))
            case 'driver':
              return NextResponse.redirect(new URL(`/${locale}/dashboard/driver`, request.url))
            case 'demo':
              return NextResponse.redirect(new URL(`/${locale}/dashboard/demo`, request.url))
            default:
              // Unknown role - redirect to login
              return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
          }
        }
      }
    }
  }

  return response
}

/**
 * Middleware configuration
 * Define which routes should trigger the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
