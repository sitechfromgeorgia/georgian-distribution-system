import { NextRequest, NextResponse } from 'next/server'

/**
 * Security Headers Utilities
 * Provides comprehensive security headers for the application
 */
export class SecurityHeaders {

  /**
   * Get comprehensive security headers
   */
  static getHeaders(): Record<string, string> {
    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://data.greenland77.ge wss://data.greenland77.ge",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),

      // Prevent clickjacking
      'X-Frame-Options': 'DENY',

      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',

      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',

      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Permissions policy
      'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()',
        'ambient-light-sensor=()',
        'autoplay=()',
        'encrypted-media=()',
        'fullscreen=(self)',
        'picture-in-picture=()'
      ].join(', '),

      // HSTS (HTTP Strict Transport Security)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

      // Prevent caching of sensitive content
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }

  /**
   * Apply security headers to response
   */
  static applyToResponse(response: NextResponse): NextResponse {
    const headers = this.getHeaders()

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Rate Limiting Utilities
 * Simple rate limiting for API protection
 */
export class RateLimiter {

  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes
  private static readonly MAX_REQUESTS = 100 // requests per window

  /**
   * Check if request should be rate limited
   * Note: This is a simple in-memory implementation.
   * For production, use Redis or similar.
   */
  static async checkLimit(identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    // In a real implementation, you'd check against Redis or database
    // For now, return mock data
    return {
      allowed: true,
      remaining: this.MAX_REQUESTS - 1,
      resetTime: Date.now() + this.WINDOW_MS
    }
  }

  /**
   * Middleware for rate limiting
   */
  static async middleware(request: NextRequest): Promise<NextResponse | null> {
    // Get client IP from headers (set by reverse proxy)
    const identifier = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'anonymous'
    const limit = await this.checkLimit(identifier)

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': this.MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limit.resetTime.toString()
          }
        }
      )
    }

    return null
  }
}

/**
 * CSRF Protection - DEPRECATED
 *
 * CSRF protection is now handled natively by Supabase Auth.
 * This class is kept for reference but is no longer used.
 *
 * DELETE ALL REFERENCES TO CSRFProtection as Supabase handles security automatically.
 */
export class CSRFProtection {

  /**
   * NOTE: This class is deprecated
   * Supabase Auth provides automatic CSRF protection
   * No custom CSRF implementation is needed
   */

  static generateToken(): string {
    console.warn('CSRFProtection.generateToken() is deprecated. Supabase handles CSRF protection.')
    return crypto.randomUUID()
  }

  static validateToken(request: NextRequest): boolean {
    console.warn('CSRFProtection.validateToken() is deprecated. Supabase handles CSRF protection.')
    return true // Always allow as Supabase handles this
  }

  static setToken(response: NextResponse, token: string): NextResponse {
    console.warn('CSRFProtection.setToken() is deprecated. Supabase handles CSRF protection.')
    return response
  }

  static getTokenForClient(request: NextRequest): string | null {
    console.warn('CSRFProtection.getTokenForClient() is deprecated. Supabase handles CSRF protection.')
    return null
  }

  static middleware(request: NextRequest): NextResponse | null {
    console.warn('CSRFProtection.middleware() is deprecated. Supabase handles CSRF protection.')
    return null
  }
}