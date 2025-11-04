/**
 * Enhanced CSRF Protection API Route
 * Implements secure CSRF token generation and validation
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import {
  generateCSRFToken,
  setCSRFCookie,
  validateCSRFToken,
  getCSRFCookieToken,
  refreshCSRFToken,
} from '@/lib/security/csrf-protection';

/**
 * GET /api/csrf
 * Generate and return a new CSRF token
 */
export async function GET() {
  try {
    // Generate new token
    const tokenData = generateCSRFToken();

    // Set cookie
    await setCSRFCookie(tokenData);

    return NextResponse.json({
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      valid: true,
    });
  } catch (error) {
    logger.error('CSRF token generation failed', { error });
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        valid: false,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/csrf
 * Validate CSRF token and optionally refresh
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Handle refresh request
    if (action === 'refresh') {
      const refreshedToken = await refreshCSRFToken();

      return NextResponse.json({
        valid: true,
        token: refreshedToken.token,
        expiresAt: refreshedToken.expiresAt,
      });
    }

    // Handle validation request
    const isValid = await validateCSRFToken(request);

    if (!isValid) {
      logger.warn('CSRF validation failed', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        {
          valid: false,
          error: 'CSRF validation failed',
        },
        { status: 403 }
      );
    }

    // Get current token info
    const currentToken = await getCSRFCookieToken();

    return NextResponse.json({
      valid: true,
      expiresAt: currentToken?.expiresAt,
    });
  } catch (error) {
    logger.error('CSRF validation error', { error });
    return NextResponse.json(
      {
        error: 'CSRF validation failed',
        valid: false,
      },
      { status: 500 }
    );
  }
}
