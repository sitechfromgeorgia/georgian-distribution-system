/**
 * CSRF Protection API Route
 * Implements CSRF token generation and validation
 */

import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getCsrfToken } from '@/lib/csrf'

export async function GET() {
  try {
    const csrfToken = getCsrfToken()
    
    return NextResponse.json({
      csrfToken,
      token: csrfToken,
      valid: true
    })
  } catch (error) {
    logger.error('CSRF token generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate CSRF token',
        valid: false 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csrfToken } = body
    
    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token is required', valid: false },
        { status: 400 }
      )
    }
    
    // Validate CSRF token
    const isValid = validateCsrfToken(csrfToken)
    
    return NextResponse.json({
      valid: isValid,
      csrfToken: isValid ? getCsrfToken() : null
    })
  } catch (error) {
    logger.error('CSRF validation failed:', error)
    return NextResponse.json(
      { 
        error: 'CSRF validation failed',
        valid: false 
      },
      { status: 500 }
    )
  }
}

// Helper function to validate CSRF token
function validateCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // Basic token validation - in production, implement more robust validation
  const tokenPattern = /^[a-zA-Z0-9]{32,64}$/
  return tokenPattern.test(token)
}