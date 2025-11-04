/**
 * Enhanced CSRF Protection with Token Expiration and Double Submit Cookie Pattern
 */

import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export interface CSRFTokenData {
  token: string;
  expiresAt: number;
  issuedAt: number;
}

export const CSRF_CONFIG = {
  COOKIE_NAME: 'csrf-token',
  HEADER_NAME: 'x-csrf-token',
  TOKEN_LENGTH: 32, // bytes (64 hex chars)
  TOKEN_LIFETIME: 60 * 60 * 1000, // 1 hour
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60, // 1 hour
  },
} as const;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): CSRFTokenData {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('crypto.getRandomValues is not available');
  }

  const array = new Uint8Array(CSRF_CONFIG.TOKEN_LENGTH);
  crypto.getRandomValues(array);

  // Convert to hex string
  const token = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const now = Date.now();
  return {
    token,
    expiresAt: now + CSRF_CONFIG.TOKEN_LIFETIME,
    issuedAt: now,
  };
}

/**
 * Validate CSRF token format
 */
export function isValidCSRFTokenFormat(token: string): boolean {
  // Must be exactly 64 hex characters
  const pattern = /^[a-f0-9]{64}$/i;
  return pattern.test(token);
}

/**
 * Set CSRF token in cookie
 */
export async function setCSRFCookie(tokenData: CSRFTokenData): Promise<void> {
  try {
    const cookieStore = await cookies();

    // Store token with metadata as JSON
    const cookieValue = JSON.stringify(tokenData);

    cookieStore.set(CSRF_CONFIG.COOKIE_NAME, cookieValue, {
      ...CSRF_CONFIG.COOKIE_OPTIONS,
      expires: new Date(tokenData.expiresAt),
    });

    logger.debug('CSRF cookie set', { expiresAt: new Date(tokenData.expiresAt) });
  } catch (error) {
    logger.error('Failed to set CSRF cookie', { error });
    throw new Error('Failed to set CSRF cookie');
  }
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFCookieToken(): Promise<CSRFTokenData | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(CSRF_CONFIG.COOKIE_NAME)?.value;

    if (!cookieValue) {
      return null;
    }

    const tokenData = JSON.parse(cookieValue) as CSRFTokenData;

    // Validate token format
    if (!isValidCSRFTokenFormat(tokenData.token)) {
      logger.warn('Invalid CSRF token format in cookie');
      return null;
    }

    // Check expiration
    if (Date.now() > tokenData.expiresAt) {
      logger.warn('CSRF token expired');
      return null;
    }

    return tokenData;
  } catch (error) {
    logger.error('Failed to parse CSRF cookie', { error });
    return null;
  }
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(request: Request): Promise<boolean> {
  try {
    // Get token from header
    const headerToken = request.headers.get(CSRF_CONFIG.HEADER_NAME);

    if (!headerToken) {
      logger.warn('CSRF validation failed: No token in header');
      return false;
    }

    // Validate format
    if (!isValidCSRFTokenFormat(headerToken)) {
      logger.warn('CSRF validation failed: Invalid token format');
      return false;
    }

    // Get token from cookie
    const cookieTokenData = await getCSRFCookieToken();

    if (!cookieTokenData) {
      logger.warn('CSRF validation failed: No valid token in cookie');
      return false;
    }

    // Compare tokens (constant-time comparison)
    const tokensMatch = constantTimeCompare(headerToken, cookieTokenData.token);

    if (!tokensMatch) {
      logger.warn('CSRF validation failed: Token mismatch');
      return false;
    }

    // Validate origin (additional check)
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!validateOrigin(origin, referer, request.url)) {
      logger.warn('CSRF validation failed: Origin mismatch', { origin, referer });
      return false;
    }

    logger.debug('CSRF validation successful');
    return true;
  } catch (error) {
    logger.error('CSRF validation error', { error });
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate request origin
 */
function validateOrigin(origin: string | null, referer: string | null, requestUrl: string): boolean {
  try {
    const requestUrlObj = new URL(requestUrl);
    const allowedOrigins = getAllowedOrigins();

    // Check Origin header
    if (origin) {
      const originUrl = new URL(origin);
      if (allowedOrigins.some(allowed => originUrl.origin === allowed)) {
        return true;
      }
    }

    // Check Referer header
    if (referer) {
      const refererUrl = new URL(referer);
      if (allowedOrigins.some(allowed => refererUrl.origin === allowed)) {
        return true;
      }
    }

    // Same-origin check
    if (origin) {
      const originUrl = new URL(origin);
      return originUrl.origin === requestUrlObj.origin;
    }

    return false;
  } catch (error) {
    logger.error('Origin validation error', { error });
    return false;
  }
}

/**
 * Get allowed origins from environment
 */
function getAllowedOrigins(): string[] {
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://greenland77.ge',
    'https://www.greenland77.ge',
    'https://data.greenland77.ge',
  ].filter(Boolean) as string[];

  // Add development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000');
  }

  return origins;
}

/**
 * Clear CSRF cookie
 */
export async function clearCSRFCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(CSRF_CONFIG.COOKIE_NAME);
    logger.debug('CSRF cookie cleared');
  } catch (error) {
    logger.error('Failed to clear CSRF cookie', { error });
  }
}

/**
 * Refresh CSRF token (generate new one)
 */
export async function refreshCSRFToken(): Promise<CSRFTokenData> {
  const tokenData = generateCSRFToken();
  await setCSRFCookie(tokenData);
  return tokenData;
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return mutatingMethods.includes(method.toUpperCase());
}

/**
 * Middleware helper for CSRF validation
 */
export async function csrfMiddleware(request: Request): Promise<Response | null> {
  // Skip CSRF check for safe methods
  if (!requiresCSRFProtection(request.method)) {
    return null;
  }

  // Skip CSRF check for API routes that use other auth methods
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/auth/')) {
    // Auth endpoints use other security measures
    return null;
  }

  // Validate CSRF token
  const isValid = await validateCSRFToken(request);

  if (!isValid) {
    logger.warn('CSRF validation failed', {
      method: request.method,
      path: url.pathname,
    });

    return new Response(
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
