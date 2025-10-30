import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { CSRFProtection, SecurityHeaders, RateLimiter } from '@/lib/csrf'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rate limiting check
  const rateLimitResponse = await RateLimiter.middleware(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // CSRF protection for state-changing requests
  const csrfResponse = CSRFProtection.middleware(request)
  if (csrfResponse) {
    return csrfResponse
  }

  // Protect routes that require authentication
  const protectedRoutes = ['/orders', '/admin', '/restaurant', '/driver']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Role-based route protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Admin routes
      if (request.nextUrl.pathname.startsWith('/admin') && profile.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Restaurant routes
      if (request.nextUrl.pathname.startsWith('/restaurant') && profile.role !== 'restaurant') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Driver routes
      if (request.nextUrl.pathname.startsWith('/driver') && profile.role !== 'driver') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // MFA enforcement for admin accounts
      if (profile.role === 'admin') {
        // Check if MFA is enrolled (this would need to be implemented in the database)
        // For now, we'll skip this check but it should be added
      }
    }
  }

  // Apply comprehensive security headers
  const response = SecurityHeaders.applyToResponse(supabaseResponse)

  // Set rate limiting headers
  const identifier = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'anonymous'
  const limit = await RateLimiter.checkLimit(identifier)

  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', limit.resetTime.toString())

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}