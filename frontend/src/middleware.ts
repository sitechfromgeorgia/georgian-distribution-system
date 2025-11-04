/**
 * Enhanced Next.js Middleware with Comprehensive Security
 *
 * This middleware handles:
 * 1. Session refresh and authentication
 * 2. Rate limiting with sliding window
 * 3. Enhanced CSRF token validation
 * 4. Route protection based on user roles
 * 5. Audit logging for security events
 * 6. Comprehensive security headers
 * 7. Input validation and sanitization
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { getEnvVar, env } from '@/lib/env';
import { getRateLimiter, getRequestIdentifier } from '@/lib/security/rate-limiter';
import {
  validateCSRFToken,
  requiresCSRFProtection,
} from '@/lib/security/csrf-protection';
import { AuditLogger, AuditEventType } from '@/lib/security/audit-logger';
import { logger } from '@/lib/logger';

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/orders',
  '/api/orders',
  '/api/products',
  '/api/analytics',
];

/**
 * User role type based on database schema
 */
type UserRole = 'admin' | 'restaurant' | 'driver' | 'demo';

/**
 * Profile type returned from database query
 */
type ProfileRole = {
  role: UserRole;
};

/**
 * Routes that require specific roles
 */
const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/admin': ['admin'],
  '/dashboard/restaurant': ['admin', 'restaurant'],
  '/dashboard/driver': ['admin', 'driver'],
  '/api/admin': ['admin'],
  '/api/analytics': ['admin'],
};

/**
 * Public routes that don't require authentication
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
];

/**
 * Routes that require strict rate limiting
 */
const STRICT_RATE_LIMIT_ROUTES = [
  '/api/auth',
  '/api/orders/submit',
  '/api/contact',
];

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(path: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (path === route) return true;
    // Prefix match for nested routes
    if (path.startsWith(route + '/')) return true;
    return false;
  });
}

/**
 * Get appropriate rate limiter based on route
 */
function getRateLimiterType(pathname: string): 'auth' | 'order' | 'sensitive' | 'api' {
  if (pathname.startsWith('/api/auth')) return 'auth';
  if (pathname.startsWith('/api/orders/submit')) return 'order';
  if (matchesRoute(pathname, STRICT_RATE_LIMIT_ROUTES)) return 'sensitive';
  return 'api';
}

/**
 * Apply rate limiting to request
 */
async function applyRateLimiting(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  try {
    // Get appropriate rate limiter
    const limiterType = getRateLimiterType(pathname);
    const rateLimiter = getRateLimiter(limiterType);

    // Get request identifier
    const identifier = getRequestIdentifier(request);

    // Check rate limit
    const result = await rateLimiter.checkLimit(identifier);

    // Add rate limit headers to all responses
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.success) {
      // Rate limit exceeded - log security event
      await AuditLogger.logSecurityEvent(
        AuditEventType.RATE_LIMIT_EXCEEDED,
        request,
        {
          identifier,
          limit: result.limit,
          retryAfter: result.retryAfter,
        }
      );

      headers.set('Retry-After', result.retryAfter?.toString() || '60');

      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers,
        }
      );
    }

    return null; // No rate limit issue
  } catch (error) {
    logger.error('Rate limiting failed', { error, pathname });
    // Fail open - allow request on error
    return null;
  }
}

/**
 * Apply enhanced CSRF validation
 */
async function applyCSRFValidation(request: NextRequest): Promise<NextResponse | null> {
  // Skip CSRF for non-mutation methods
  if (!requiresCSRFProtection(request.method)) {
    return null;
  }

  // Validate CSRF token
  const isValid = await validateCSRFToken(request);

  if (!isValid) {
    // Log security event
    await AuditLogger.logSecurityEvent(
      AuditEventType.CSRF_VALIDATION_FAILED,
      request,
      {
        method: request.method,
        path: request.nextUrl.pathname,
      }
    );

    return new NextResponse(
      JSON.stringify({
        error: 'CSRF validation failed',
        code: 'CSRF_INVALID',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}

/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response: NextResponse): void {
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (CSP)
  const isDevelopment = process.env.NODE_ENV === 'development';

  const cspDirectives = [
    "default-src 'self'",
    // Development: Allow unsafe-inline and unsafe-eval for Next.js hot reload
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net"
      : "script-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://data.greenland77.ge wss://*.supabase.co wss://*.supabase.in",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // Strict Transport Security (HSTS) - Only in production
  if (env.isProduction) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );

  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Cache control for sensitive pages
  if (response.headers.get('content-type')?.includes('text/html')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Apply rate limiting (before authentication to prevent brute force)
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await applyRateLimiting(request, pathname);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Create Supabase client with cookie handling
  const supabase = createServerClient<Database>(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if needed
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // Add comprehensive security headers
  addSecurityHeaders(response);

  // Check if route is public
  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);

  if (isPublicRoute) {
    return response;
  }

  // Check if route requires authentication
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);

  if (isProtectedRoute) {
    // No session - redirect to login
    if (!session) {
      // Log unauthorized access attempt
      await AuditLogger.logSecurityEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        request,
        {
          path: pathname,
          reason: 'no_session',
        }
      );

      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Apply CSRF validation for API mutations
    if (pathname.startsWith('/api/')) {
      const csrfResponse = await applyCSRFValidation(request);
      if (csrfResponse) {
        return csrfResponse;
      }
    }

    // Check role-based access
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (matchesRoute(pathname, [route])) {
        // Get user profile to check role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        // Type guard: Validate profile has correct structure
        const isValidProfile = (p: unknown): p is ProfileRole => {
          return (
            p !== null &&
            typeof p === 'object' &&
            'role' in p &&
            typeof (p as ProfileRole).role === 'string'
          );
        };

        // Validate profile
        if (profileError || !profileData || !isValidProfile(profileData)) {
          // Log security event
          await AuditLogger.logSecurityEvent(
            AuditEventType.UNAUTHORIZED_ACCESS,
            request,
            {
              path: pathname,
              reason: 'invalid_profile',
              userId: session.user.id,
            },
            session.user.id
          );

          return NextResponse.redirect(new URL('/login', request.url));
        }

        const profile: ProfileRole = profileData;

        // Check if user has required role
        if (!allowedRoles.includes(profile.role)) {
          // Log unauthorized access
          await AuditLogger.logSecurityEvent(
            AuditEventType.UNAUTHORIZED_ACCESS,
            request,
            {
              path: pathname,
              userRole: profile.role,
              requiredRoles: allowedRoles,
            },
            session.user.id
          );

          // Redirect to appropriate dashboard
          switch (profile.role) {
            case 'restaurant':
              return NextResponse.redirect(new URL('/dashboard/restaurant', request.url));
            case 'driver':
              return NextResponse.redirect(new URL('/dashboard/driver', request.url));
            case 'demo':
              return NextResponse.redirect(new URL('/dashboard/demo', request.url));
            default:
              return NextResponse.redirect(new URL('/login', request.url));
          }
        }
      }
    }
  }

  return response;
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
};
