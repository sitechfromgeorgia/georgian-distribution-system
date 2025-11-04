# Security Requirements

> **უსაფრთხოების მოთხოვნები** | Security standards and best practices

---

## 🔒 Security Philosophy

1. **Defense in Depth** - Multiple layers of security
2. **Principle of Least Privilege** - Minimal access by default
3. **Never Trust User Input** - Validate everything
4. **RLS is Primary Enforcement** - Database-level security first
5. **Fail Securely** - Errors should not expose sensitive data

---

## 🛡️ Authentication & Authorization

### Authentication Requirements

```typescript
// ✅ Always verify authentication in API routes
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Proceed with authenticated logic
}

// ✅ Check user role for authorization
export async function DELETE(request: NextRequest) {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin-only logic
}
```

### Session Management

```typescript
// ✅ Secure session configuration
const SESSION_CONFIG = {
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  httpOnly: true, // No client-side access
  sameSite: 'lax', // CSRF protection
}

// ✅ Implement session timeout
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_TIMEOUT = 25 * 60 * 1000 // 25 minutes (5 min warning)

// ✅ Auto-logout on inactivity
useEffect(() => {
  const timer = setTimeout(() => {
    signOut()
  }, SESSION_TIMEOUT)

  return () => clearTimeout(timer)
}, [lastActivity])
```

### Password Requirements

```typescript
// ✅ Strong password validation
const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// ❌ Never log or expose passwords
console.log(password) // ❌ NEVER DO THIS
```

---

## 🗄️ Database Security

### Row-Level Security (RLS)

**Primary Security Layer** - All security is enforced at the database level.

```sql
-- ✅ Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ✅ Admin: Full access
CREATE POLICY "admin_full_access" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ✅ Restaurant: Own orders only
CREATE POLICY "restaurant_own_orders" ON orders
  FOR SELECT
  USING (restaurant_id = auth.uid());

-- ✅ Restaurant: Can insert own orders
CREATE POLICY "restaurant_insert_orders" ON orders
  FOR INSERT
  WITH CHECK (restaurant_id = auth.uid());

-- ✅ Driver: Assigned orders only
CREATE POLICY "driver_assigned_orders" ON orders
  FOR SELECT
  USING (driver_id = auth.uid());

-- ✅ Driver: Can update status of assigned orders
CREATE POLICY "driver_update_assigned" ON orders
  FOR UPDATE
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

-- ✅ Demo: Read-only, recent data only
CREATE POLICY "demo_read_recent" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'demo'
    )
    AND created_at > NOW() - INTERVAL '7 days'
  );
```

### RLS Testing Checklist

Test RLS policies for each role:
- [ ] Admin can access all records
- [ ] Restaurant can only see their own orders
- [ ] Restaurant cannot see other restaurants' orders
- [ ] Driver can only see assigned deliveries
- [ ] Driver cannot modify order prices
- [ ] Demo user has read-only access
- [ ] Demo user can only see recent data
- [ ] Unauthenticated users have no access

### Database Query Security

```typescript
// ✅ Use Supabase client (RLS applied automatically)
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', restaurantId)

// ❌ NEVER build raw SQL with user input
const query = `SELECT * FROM orders WHERE id = '${orderId}'` // ❌ SQL injection!

// ❌ NEVER bypass RLS in application code
const { data } = await supabase
  .from('orders')
  .select('*')
// Missing .eq() filter - might expose all orders!
```

---

## 🔐 Input Validation

### Zod Validation (Required)

**ALL user input MUST be validated with Zod schemas.**

```typescript
import { z } from 'zod'

// ✅ Define schemas for all inputs
const OrderCreateSchema = z.object({
  restaurant_id: z.string().uuid('Invalid restaurant ID'),
  items: z.array(
    z.object({
      product_id: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ).min(1, 'Order must have at least one item'),
  notes: z.string().max(500, 'Notes too long').optional(),
})

// ✅ Validate before processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = OrderCreateSchema.parse(body)

    // Safe to use validatedData
    const order = await createOrder(validatedData)

    return NextResponse.json({ order })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    throw error
  }
}
```

### Sanitization

```typescript
// ✅ Sanitize text inputs
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  })
}

// ✅ Remove XSS attempts
const safeNotes = sanitizeHTML(userInput)

// ✅ Escape for display (React does this automatically)
<div>{userGeneratedContent}</div> // React escapes by default

// ❌ NEVER use dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // ❌ XSS vulnerability!
```

---

## 🛡️ CSRF Protection

### Implementation

```typescript
// ✅ Generate CSRF token
import { randomBytes } from 'crypto'

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

// ✅ Validate CSRF token
export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('x-csrf-token')
  const session = await getSession(request)

  if (!csrfToken || csrfToken !== session?.csrfToken) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Proceed with mutation
}

// ✅ Include CSRF token in forms
<form onSubmit={handleSubmit}>
  <input type="hidden" name="csrf_token" value={csrfToken} />
  {/* Form fields */}
</form>
```

### API Route Protection

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check CSRF token for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')

    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

---

## 🔒 Data Protection

### Sensitive Data Handling

```typescript
// ✅ Never log sensitive data
const user = await getUserById(id)
console.log({ id: user.id, role: user.role }) // ✅ OK
console.log(user) // ❌ Might contain password hash, tokens, etc.

// ✅ Redact sensitive fields in responses
function sanitizeUser(user: User): PublicUser {
  const { password, reset_token, ...publicData } = user
  return publicData
}

// ✅ Use environment variables for secrets
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
// ❌ Never hardcode secrets
const API_KEY = 'sk-1234567890' // ❌ NEVER DO THIS
```

### Encryption

```typescript
// ✅ Encrypt sensitive data at rest
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32 bytes
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

// ✅ Use HTTPS in production
if (process.env.NODE_ENV === 'production') {
  // Enforce HTTPS
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(`https://${req.headers.host}${req.url}`)
    }
    next()
  })
}
```

---

## 🚨 Error Handling

### Secure Error Messages

```typescript
// ✅ Generic error messages for users
try {
  await processPayment(orderId)
} catch (error) {
  // Log detailed error internally
  console.error('Payment processing failed:', error)

  // Return generic message to user
  return NextResponse.json(
    { error: 'Payment processing failed. Please try again.' },
    { status: 500 }
  )
}

// ❌ Don't expose internal details
catch (error) {
  return NextResponse.json(
    { error: error.message }, // ❌ Might expose sensitive info
    { status: 500 }
  )
}
```

### Error Monitoring

```typescript
// ✅ Use Sentry for error tracking
import * as Sentry from '@sentry/nextjs'

try {
  await riskyOperation()
} catch (error) {
  // Send to Sentry with context
  Sentry.captureException(error, {
    tags: {
      operation: 'order_creation',
      user_role: session.user.role,
    },
    user: {
      id: session.user.id,
      // Don't include email or personal info
    },
  })

  // Return safe error to user
  throw new Error('Operation failed')
}
```

---

## 🔐 File Upload Security

### Validation

```typescript
// ✅ Validate file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadProductImage(file: File) {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }

  // Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    throw new Error('Invalid file extension')
  }

  // Generate random filename (don't use user-provided name)
  const filename = `${randomBytes(16).toString('hex')}.${ext}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('products')
    .upload(filename, file, {
      contentType: file.type,
    })

  return data?.path
}
```

---

## 🔒 Rate Limiting

### API Rate Limiting

```typescript
// ✅ Implement rate limiting
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply to API routes
app.use('/api/', limiter)

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
})

app.use('/api/auth/login', authLimiter)
```

---

## 🛡️ Security Headers

### Next.js Configuration

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

---

## 📋 Security Checklist

### Before Every Deployment

- [ ] All environment variables secured
- [ ] No secrets in code or logs
- [ ] RLS policies tested for all roles
- [ ] All user inputs validated with Zod
- [ ] CSRF protection on all mutations
- [ ] Authentication required on protected routes
- [ ] Error messages don't expose internals
- [ ] File uploads validated
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Sentry error tracking active
- [ ] Dependencies up to date (no known vulnerabilities)

### Security Audit Commands

```bash
# Check for dependency vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

---

## 🚨 Incident Response

### If Security Breach Detected

1. **Immediately:**
   - Disable affected accounts
   - Rotate all API keys and secrets
   - Review access logs

2. **Investigate:**
   - Check Sentry for error patterns
   - Review database audit logs
   - Identify scope of breach

3. **Communicate:**
   - Notify affected users
   - Document incident
   - Report to authorities if required

4. **Prevent:**
   - Patch vulnerability
   - Add tests to prevent regression
   - Update security documentation

---

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Sentry Security](https://sentry.io/security/)

---

**Last Updated:** 2025-11-03
**Security Level:** Production-ready
**Compliance:** GDPR considerations for Georgian market
