# Security Implementation Guide

## Overview

This document describes the comprehensive security implementation for the Georgian Distribution System. Our security architecture follows industry best practices and implements multiple layers of defense to protect against common web vulnerabilities.

## Table of Contents

1. [CSRF Protection](#csrf-protection)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [SQL Injection Prevention](#sql-injection-prevention)
5. [XSS Protection](#xss-protection)
6. [CORS Configuration](#cors-configuration)
7. [Security Headers](#security-headers)
8. [API Key Management & Rotation](#api-key-management--rotation)
9. [Audit Logging](#audit-logging)
10. [Session Management](#session-management)

---

## 1. CSRF Protection

### Implementation

Cross-Site Request Forgery (CSRF) protection is implemented using the double-submit cookie pattern with enhanced validation.

**Location:** `src/lib/security/csrf-protection.ts`

### Features

- **Token Generation:** Cryptographically secure 64-character hexadecimal tokens
- **Token Lifetime:** 1 hour with automatic expiration
- **Token Validation:** Constant-time comparison to prevent timing attacks
- **Origin Validation:** Additional check against allowed origins
- **Cookie Security:** HttpOnly, Secure (production), SameSite=Strict

### Usage

#### Server-Side (API Routes)

```typescript
import { validateCSRFToken } from '@/lib/security/csrf-protection';

export async function POST(request: Request) {
  // CSRF validation is automatic in middleware
  // Manual validation if needed:
  const isValid = await validateCSRFToken(request);
  if (!isValid) {
    return new Response('CSRF validation failed', { status: 403 });
  }
  // ... handle request
}
```

#### Client-Side (React Hooks)

```typescript
import { useCSRFToken } from '@/hooks/useSecurity';

function MyForm() {
  const { csrfToken, getCSRFHeaders } = useCSRFToken();

  const handleSubmit = async () => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getCSRFHeaders(),
      },
      body: JSON.stringify(data),
    });
  };
}
```

### Configuration

```typescript
// CSRF Configuration
COOKIE_NAME: 'csrf-token'
HEADER_NAME: 'x-csrf-token'
TOKEN_LENGTH: 32 bytes (64 hex chars)
TOKEN_LIFETIME: 60 minutes
```

---

## 2. Rate Limiting

### Implementation

Production-ready rate limiting with Redis support and in-memory fallback.

**Location:** `src/lib/security/rate-limiter.ts`

### Features

- **Sliding Window Algorithm:** Accurate rate limiting across time windows
- **Multiple Tiers:** Different limits for different endpoint types
- **Redis Support:** Production-ready with automatic fallback
- **Per-User/Per-IP:** Identifies requests by user ID or IP address
- **Rate Limit Headers:** X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### Rate Limit Tiers

| Tier | Window | Max Requests | Use Case |
|------|--------|--------------|----------|
| **AUTH** | 15 min | 5 | Authentication endpoints |
| **ORDER** | 1 min | 5 | Order submission |
| **SENSITIVE** | 1 min | 10 | Password reset, profile updates |
| **API** | 1 min | 60 | General API endpoints |
| **GENERAL** | 1 min | 100 | Read-only operations |

### Usage

Rate limiting is automatically applied by middleware. No additional code required for standard endpoints.

#### Custom Rate Limiting

```typescript
import { getRateLimiter, getRequestIdentifier } from '@/lib/security/rate-limiter';

export async function POST(request: Request) {
  const rateLimiter = getRateLimiter('sensitive');
  const identifier = getRequestIdentifier(request);

  const result = await rateLimiter.checkLimit(identifier);

  if (!result.success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter?.toString() || '60',
      },
    });
  }

  // ... handle request
}
```

### Redis Configuration (Production)

```bash
# Add to .env
REDIS_URL=redis://localhost:6379
```

```typescript
// Initialize with Redis
import { createClient } from 'redis';
import { initializeRateLimiters } from '@/lib/security/rate-limiter';

const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

initializeRateLimiters(redisClient);
```

---

## 3. Input Validation & Sanitization

### Implementation

Comprehensive input sanitization using DOMPurify and custom validators.

**Location:** `src/lib/security/input-sanitizer.ts`

### Features

- **XSS Prevention:** HTML stripping and encoding
- **SQL Injection Detection:** Pattern matching and keyword removal
- **Type-Safe Validation:** Email, phone, URL, UUID validators
- **File Upload Validation:** Size, type, and extension checks
- **Recursive Sanitization:** Deep object sanitization

### Usage

#### Server-Side

```typescript
import { InputSanitizer } from '@/lib/security/input-sanitizer';

// Sanitize text input
const result = InputSanitizer.sanitizeString(userInput, {
  maxLength: 500,
  trim: true,
  allowHTML: false,
});

if (!result.isValid) {
  console.error(result.errors);
}

// Use sanitized value
const cleanInput = result.sanitized;

// Quick sanitization
import { quickSanitize } from '@/lib/security/input-sanitizer';

const cleanEmail = quickSanitize.email(email);
const cleanPhone = quickSanitize.phone(phone);
const cleanNumber = quickSanitize.number(amount, 0, 10000);
```

#### Client-Side

```typescript
import { useInputSanitizer } from '@/hooks/useSecurity';

function MyForm() {
  const { sanitizeText, sanitizeEmail, sanitizePhone } = useInputSanitizer();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeText(e.target.value, 200);
    setValue(sanitized);
  };
}
```

### Validation Methods

- `sanitizeString()` - General text sanitization
- `sanitizeEmail()` - Email validation and cleaning
- `sanitizePhone()` - Phone number E.164 validation
- `sanitizeURL()` - URL validation (http/https only)
- `sanitizeUUID()` - UUID format validation
- `sanitizeNumber()` - Numeric validation with range checks
- `sanitizeHTML()` - Allow specific HTML tags
- `sanitizeObject()` - Recursive object sanitization

---

## 4. SQL Injection Prevention

### Implementation

Multiple layers of SQL injection prevention:

1. **Supabase ORM:** Parameterized queries by default
2. **Input Sanitization:** SQL keyword detection and removal
3. **Type Validation:** Strong typing prevents injection
4. **RLS Policies:** Database-level access control

**Location:** `src/lib/security/input-sanitizer.ts`

### SQL Injection Detection

The sanitizer detects common SQL injection patterns:

- SQL keywords (UNION, SELECT, INSERT, UPDATE, DELETE, DROP, etc.)
- SQL comments (`--`, `/*`, `*/`)
- Boolean-based injection (`OR '1'='1'`)
- Stacked queries (`;DROP TABLE`)

### Best Practices

1. **Always use Supabase client methods** - Never construct raw SQL queries
2. **Validate all user input** - Use input sanitizer before database operations
3. **Use prepared statements** - Supabase handles this automatically
4. **Enable RLS policies** - Database-level protection

```typescript
// ✅ GOOD: Using Supabase methods (parameterized)
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .eq('status', status);

// ❌ BAD: Never construct raw SQL from user input
const query = `SELECT * FROM orders WHERE user_id = '${userId}'`; // VULNERABLE
```

---

## 5. XSS Protection

### Implementation

Multi-layered XSS protection:

1. **Content Security Policy (CSP)** - Browser-level protection
2. **Input Sanitization** - Remove/encode dangerous content
3. **Output Encoding** - Automatic in React
4. **DOMPurify** - HTML sanitization library

**Locations:**
- `src/lib/security/input-sanitizer.ts` - Input sanitization
- `src/middleware.ts` - CSP headers
- `src/hooks/useSecurity.ts` - Client-side validation

### Content Security Policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
```

### XSS Detection

```typescript
import { useContentSecurity } from '@/hooks/useSecurity';

function MyComponent() {
  const { isContentSafe } = useContentSecurity();

  const handleInput = (content: string) => {
    const { safe, reason } = isContentSafe(content);
    if (!safe) {
      alert(`Unsafe content detected: ${reason}`);
      return;
    }
    // ... proceed
  };
}
```

---

## 6. CORS Configuration

### Implementation

Environment-aware CORS configuration with strict origin validation.

**Location:** `next.config.ts`

### Configuration

```typescript
// Production Origins
const productionOrigins = [
  'https://greenland77.ge',
  'https://www.greenland77.ge',
  'https://data.greenland77.ge',
];

// Development Origins
const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
];

// Allowed Methods
GET, POST, PUT, PATCH, DELETE, OPTIONS

// Allowed Headers
X-CSRF-Token, X-Requested-With, Accept, Content-Type,
Authorization, X-Api-Version

// Credentials: Enabled
// Max Age: 86400 seconds (24 hours)
```

### Server Actions Origin Validation

Next.js Server Actions are configured with allowed origins:

```typescript
experimental: {
  serverActions: {
    allowedOrigins: [
      'localhost:3000',
      '*.supabase.co',
      'greenland77.ge',
      // ...
    ],
  },
},
```

---

## 7. Security Headers

### Implementation

Comprehensive security headers added by middleware.

**Location:** `src/middleware.ts`

### Headers

| Header | Value | Purpose |
|--------|-------|---------|
| **X-Content-Type-Options** | nosniff | Prevents MIME sniffing |
| **X-Frame-Options** | DENY | Prevents clickjacking |
| **X-XSS-Protection** | 1; mode=block | Browser XSS filter |
| **Referrer-Policy** | strict-origin-when-cross-origin | Controls referrer information |
| **Strict-Transport-Security** | max-age=31536000; includeSubDomains; preload | Forces HTTPS (production) |
| **Permissions-Policy** | camera=(), microphone=(), geolocation=(self) | Restricts browser features |
| **Content-Security-Policy** | (see CSP section) | Prevents XSS and injection |
| **X-DNS-Prefetch-Control** | on | Controls DNS prefetching |
| **X-Download-Options** | noopen | Prevents file execution in IE |
| **Cache-Control** | no-store (for HTML) | Prevents sensitive data caching |

### Testing Headers

```bash
# Test security headers
curl -I https://your-domain.com

# Online tools
https://securityheaders.com
https://observatory.mozilla.org
```

---

## 8. API Key Management & Rotation

### Implementation

Secure API key generation, storage, and automatic rotation.

**Location:** `src/lib/security/api-key-manager.ts`

### Features

- **Secure Generation:** 32-byte cryptographically random keys
- **Hashed Storage:** SHA-256 hashing (never store plain keys)
- **Automatic Expiration:** 90-day default lifetime
- **Rotation Support:** Seamless key rotation
- **Scope-Based Permissions:** Granular access control
- **Usage Tracking:** Last used timestamp
- **Expiration Warnings:** 7-day advance notification

### Usage

#### Generate API Key

```typescript
import { APIKeyManager } from '@/lib/security/api-key-manager';

const apiKey = await APIKeyManager.generateKey(
  userId,
  'Production API Key',
  ['read:orders', 'write:products'],
  'Used for production integration',
  90 // expires in 90 days
);

// Save the key_secret securely - it's only shown once!
console.log('API Key:', apiKey.key_secret);
```

#### Validate API Key

```typescript
import { authenticateAPIKey } from '@/lib/security/api-key-manager';

export async function GET(request: Request) {
  const { authenticated, apiKey, error } = await authenticateAPIKey(request);

  if (!authenticated) {
    return new Response(error, { status: 401 });
  }

  // Check scope
  if (!apiKey.scopes.includes('read:orders')) {
    return new Response('Insufficient permissions', { status: 403 });
  }

  // ... handle request
}
```

#### Rotate API Key

```typescript
// Rotate before expiration
const newKey = await APIKeyManager.rotateKey(oldKeyId, userId);

// Auto-rotation (run via cron job)
const rotatedCount = await APIKeyManager.autoRotateExpiredKeys();
```

### API Key Format

```
gds_[64 hexadecimal characters]

Example:
gds_a1b2c3d4e5f6...
```

### Database Schema

See migration: `supabase/migrations/20251104000002_create_api_keys_table.sql`

---

## 9. Audit Logging

### Implementation

Comprehensive audit logging for security events and sensitive operations.

**Location:** `src/lib/security/audit-logger.ts`

### Features

- **Event Types:** 40+ predefined event types
- **Severity Levels:** Info, Warning, Error, Critical
- **Rich Context:** IP, user agent, user info, resource details
- **Immutable Logs:** No updates or deletes allowed
- **Retention Policy:** Configurable (default 90 days)
- **Statistics:** Aggregated metrics and reports

### Event Categories

- **Authentication:** Login, logout, MFA, password reset
- **User Management:** Create, update, delete, role changes
- **Orders:** Create, update, cancel, status changes
- **Products:** Create, update, delete, price changes
- **API Keys:** Create, rotate, revoke
- **Security:** CSRF failures, rate limits, SQL injection attempts, XSS attempts
- **Data Access:** Sensitive data access, exports, bulk operations
- **System:** Config changes, backups, migrations

### Usage

#### Log Authentication Event

```typescript
import { AuditLogger, AuditEventType } from '@/lib/security/audit-logger';

await AuditLogger.logAuth(
  AuditEventType.AUTH_LOGIN,
  userId,
  true, // success
  { method: 'email_password' },
  request
);
```

#### Log Security Event

```typescript
await AuditLogger.logSecurityEvent(
  AuditEventType.RATE_LIMIT_EXCEEDED,
  request,
  {
    limit: 60,
    attempts: 65,
  },
  userId
);
```

#### Query Audit Logs

```typescript
const logs = await AuditLogger.query({
  user_id: userId,
  event_type: AuditEventType.ORDER_CREATED,
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  limit: 100,
});
```

#### Get Statistics

```typescript
const stats = await AuditLogger.getStatistics(
  '2025-01-01',
  '2025-12-31'
);

console.log(`Total Events: ${stats.totalEvents}`);
console.log(`Security Events: ${stats.securityEvents}`);
console.log(`Failed Events: ${stats.failedEvents}`);
```

### Database Schema

See migration: `supabase/migrations/20251104000001_create_audit_logs_table.sql`

---

## 10. Session Management

### Implementation

Enhanced session management with timeout, activity tracking, and token rotation.

**Location:** `src/lib/security/session-manager.ts`

### Features

- **Idle Timeout:** 30 minutes of inactivity
- **Max Duration:** 24 hours absolute limit
- **Activity Tracking:** Mouse, keyboard, scroll, touch events
- **Token Refresh:** Automatic every hour
- **Expiry Warning:** 5-minute advance notification
- **Device Tracking:** Unique device identification

### Configuration

```typescript
SESSION_CONFIG = {
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,        // 30 minutes
  MAX_SESSION_DURATION_MS: 24 * 60 * 60 * 1000,  // 24 hours
  WARNING_BEFORE_TIMEOUT_MS: 5 * 60 * 1000,      // 5 minutes
  REFRESH_TOKEN_BEFORE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  TOKEN_ROTATION_INTERVAL_MS: 60 * 60 * 1000,     // 1 hour
}
```

### Usage

#### Initialize Session Manager

```typescript
import { useSessionManager } from '@/lib/security/session-manager';

function App() {
  const { initializeSession } = useSessionManager();

  useEffect(() => {
    initializeSession(
      () => {
        // Session expired callback
        router.push('/login');
      },
      (warning) => {
        // Warning callback
        toast.warning(warning.message);
      }
    );
  }, []);
}
```

#### Extend Session

```typescript
const { extendSession } = useSessionManager();

// Extend session on critical user action
const handleCriticalAction = async () => {
  await extendSession();
  // ... perform action
};
```

#### Monitor Session

```typescript
import { useSessionMonitor } from '@/hooks/useSecurity';

function SessionWarning() {
  const { timeUntilTimeout, showWarning } = useSessionMonitor();

  if (!showWarning) return null;

  return (
    <Alert>
      Your session will expire in {Math.ceil(timeUntilTimeout / 1000 / 60)} minutes
    </Alert>
  );
}
```

---

## Security Checklist

### Development

- [ ] Use CSRF tokens for all forms
- [ ] Sanitize all user inputs
- [ ] Validate file uploads
- [ ] Use secure API hooks
- [ ] Implement proper error handling
- [ ] Never log sensitive data

### Production

- [ ] Apply database migrations
- [ ] Configure Redis for rate limiting
- [ ] Enable HSTS headers
- [ ] Set up audit log retention
- [ ] Configure API key rotation
- [ ] Enable session monitoring
- [ ] Set up security alerts
- [ ] Regular security audits

### Monitoring

- [ ] Monitor rate limit violations
- [ ] Review audit logs regularly
- [ ] Track authentication failures
- [ ] Monitor API key usage
- [ ] Alert on security events
- [ ] Review CSP violations

---

## Database Migrations

Apply the security-related migrations:

```bash
# Apply audit logs table
supabase migration up 20251104000001_create_audit_logs_table

# Apply API keys table
supabase migration up 20251104000002_create_api_keys_table
```

---

## Testing Security

### CSRF Protection

```typescript
// Test CSRF validation
const response = await fetch('/api/orders/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Missing x-csrf-token header
  },
  body: JSON.stringify(data),
});

// Should return 403 Forbidden
expect(response.status).toBe(403);
```

### Rate Limiting

```typescript
// Test rate limit
for (let i = 0; i < 70; i++) {
  await fetch('/api/endpoint');
}

// 61st request should be rate limited
const response = await fetch('/api/endpoint');
expect(response.status).toBe(429);
```

### Input Sanitization

```typescript
const maliciousInput = '<script>alert("XSS")</script>';
const result = InputSanitizer.sanitizeString(maliciousInput);

expect(result.sanitized).not.toContain('<script>');
expect(result.warnings).toContain('Potential XSS patterns detected');
```

---

## Security Best Practices

1. **Never trust user input** - Always validate and sanitize
2. **Use prepared statements** - Let Supabase handle parameterization
3. **Implement defense in depth** - Multiple layers of security
4. **Log security events** - Track all suspicious activity
5. **Rotate credentials regularly** - API keys, tokens, secrets
6. **Keep dependencies updated** - Regular security patches
7. **Use HTTPS everywhere** - No exceptions
8. **Implement proper error handling** - Don't leak information
9. **Regular security audits** - Review code and logs
10. **Educate developers** - Security training and awareness

---

## Incident Response

If a security incident occurs:

1. **Isolate:** Immediately revoke compromised credentials
2. **Assess:** Review audit logs to determine scope
3. **Contain:** Block malicious IPs, disable affected features
4. **Remediate:** Fix vulnerabilities, rotate all secrets
5. **Document:** Record incident details and response
6. **Notify:** Inform affected users if required
7. **Review:** Conduct post-mortem and improve security

---

## Security Contacts

For security issues or questions:

- **Security Email:** security@greenland77.ge
- **Bug Bounty:** TBD
- **Responsible Disclosure:** See SECURITY_POLICY.md

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## Changelog

- **2025-11-04:** Initial comprehensive security implementation
  - CSRF protection with double-submit cookies
  - Production-ready rate limiting
  - Input validation and sanitization
  - SQL injection prevention
  - XSS protection with CSP
  - Security headers implementation
  - API key management and rotation
  - Comprehensive audit logging
  - Enhanced session management

---

**Last Updated:** 2025-11-04
**Version:** 1.0.0
