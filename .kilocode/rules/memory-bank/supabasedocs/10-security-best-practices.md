# Supabase Security Best Practices: Complete Technical Reference

## Overview

This document provides comprehensive security guidelines for the Georgian Distribution System using Supabase. It covers authentication security, Row-Level Security policies, API protection, data encryption, and compliance best practices for a multi-tenant B2B platform handling sensitive restaurant and customer data.

### Security Layers

The Georgian Distribution System implements security at multiple levels:

1. **Authentication Layer** - JWT validation, MFA, session management
2. **Authorization Layer** - RLS policies, role-based access control
3. **Network Layer** - SSL/TLS, API rate limiting, IP whitelisting
4. **Database Layer** - Encrypted at rest, parameterized queries, audit logs
5. **Application Layer** - Input validation, CSRF protection, XSS prevention

### Threat Model

**Assets to Protect:**
- User credentials (restaurants, drivers, admins)
- Order data (customer addresses, phone numbers)
- Payment information (transaction records)
- Product pricing and inventory
- Business analytics and reports

**Potential Threats:**
- Unauthorized data access
- SQL injection attacks
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Session hijacking
- Brute force attacks
- Data breaches

---

## Core Security Principles

### 1. Defense in Depth

Implement multiple layers of security:
- **Client-side**: Input validation, HTTPS only
- **Server-side**: Auth checks, RLS enforcement
- **Database**: Encrypted storage, backup encryption
- **Network**: Firewalls, rate limiting

### 2. Principle of Least Privilege

Grant minimum necessary permissions:
- **anon role**: Read public data only
- **authenticated role**: User-specific data via RLS
- **service_role**: Admin operations only (never in browser)

### 3. Zero Trust Architecture

Never trust, always verify:
- Validate every request server-side
- Check authentication for every operation
- Enforce RLS on all tables
- Validate JWT tokens

---

## Authentication Security

### 1. Strong Password Policies

**Requirements:**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Check against common passwords (HIBP API)
- Enforce password expiry (90 days for admins)

**Implementation:**

```typescript
// Supabase Dashboard > Authentication > Policies
// Or via SQL migration:

-- migrations/xxx_password_policy.sql
ALTER ROLE authenticator 
SET password_min_length = 8;

ALTER ROLE authenticator 
SET password_required_characters = 'upper:1,lower:1,digit:1,special:1';
```

**Client-Side Validation:**

```typescript
// lib/validators/password.ts
import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')

// Check against breached passwords
export async function isPasswordBreached(password: string): Promise<boolean> {
  const hash = await sha1(password)
  const prefix = hash.substring(0, 5)
  const suffix = hash.substring(5)

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
  const text = await response.text()

  return text.includes(suffix.toUpperCase())
}
```

---

### 2. Multi-Factor Authentication (MFA)

**When to Require:**
- All admin accounts (mandatory)
- Restaurant accounts handling payments (optional)
- Driver accounts (optional)
- High-value transactions

**Implementation:**

```typescript
// app/settings/mfa/actions.ts
'use server'

import { createServerActionClient } from '@/lib/supabase/server'

export async function enrollMFA() {
  const supabase = createServerActionClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Generate TOTP secret
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `${user.email} - Authenticator`
  })

  if (error) {
    return { error: error.message }
  }

  return {
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    factorId: data.id
  }
}

export async function verifyMFA(factorId: string, code: string) {
  const supabase = createServerActionClient()

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code
  })

  if (error) {
    return { error: 'Invalid code' }
  }

  return { success: true }
}
```

**RLS Policy (Require MFA for Sensitive Operations):**

```sql
-- Only allow order cancellations with MFA
CREATE POLICY "Cancel orders requires MFA"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = restaurant_id
    AND (auth.jwt() ->> 'aal') = 'aal2'  -- MFA verified
  )
  WITH CHECK (
    status = 'cancelled'
  );
```

---

### 3. Session Management

**Best Practices:**
- Short access token expiry (1 hour default)
- Refresh tokens with rotation
- Invalidate sessions on password change
- Limit concurrent sessions

**Implementation:**

```typescript
// lib/auth/session.ts
import { createServerClient } from '@/lib/supabase/server'

export async function validateSession() {
  const supabase = createServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { valid: false, user: null }
  }

  // Check if session is about to expire
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 1000 / 60

    // Refresh if less than 5 minutes remaining
    if (minutesUntilExpiry < 5) {
      await supabase.auth.refreshSession()
    }
  }

  return { valid: true, user }
}

// Invalidate all sessions on password change
export async function invalidateAllSessions(userId: string) {
  const supabaseAdmin = createAdminClient()

  // Sign out user from all devices
  await supabaseAdmin.auth.admin.signOut(userId, 'global')
}
```

**Security Headers (middleware.ts):**

```typescript
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // HSTS (Force HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}
```

---

### 4. Rate Limiting

**Protect Against:**
- Brute force login attempts
- API abuse
- DDoS attacks

**Implementation (PostgreSQL Function):**

```sql
-- migrations/xxx_rate_limiting.sql

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS private.rate_limits (
  id SERIAL PRIMARY KEY,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX rate_limits_ip_endpoint_idx 
  ON private.rate_limits(ip_address, endpoint, window_start DESC);

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address INET,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_request_count INTEGER;
BEGIN
  -- Clean up old entries
  DELETE FROM private.rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';

  -- Get request count in current window
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_request_count
  FROM private.rate_limits
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND window_start > NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Check if limit exceeded
  IF v_request_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;

  -- Increment counter
  INSERT INTO private.rate_limits (ip_address, endpoint, request_count, window_start)
  VALUES (p_ip_address, p_endpoint, 1, NOW())
  ON CONFLICT (ip_address, endpoint)
  DO UPDATE SET
    request_count = private.rate_limits.request_count + 1,
    window_start = CASE
      WHEN private.rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL
      THEN NOW()
      ELSE private.rate_limits.window_start
    END;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage in API Routes:**

```typescript
// app/api/login/route.ts
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Check rate limit (5 login attempts per 15 minutes)
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_ip_address: ip,
    p_endpoint: '/api/login',
    p_max_requests: 5,
    p_window_seconds: 900
  })

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  // Proceed with login...
}
```

---

## Row-Level Security (RLS)

### 1. Enable RLS on All Tables

**CRITICAL**: Every table in `public` schema must have RLS enabled

```sql
-- Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS on all tables
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
```

---

### 2. Multi-Tenant RLS Policies

**Restaurant Isolation:**

```sql
-- Restaurants can only see their own orders
CREATE POLICY "Restaurants view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = restaurant_id
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Restaurants can only create orders for themselves
CREATE POLICY "Restaurants create own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = restaurant_id
  );

-- Restaurants can only update their own orders
CREATE POLICY "Restaurants update own orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = restaurant_id
  )
  WITH CHECK (
    auth.uid() = restaurant_id
  );

-- Restaurants cannot delete orders
-- No DELETE policy = no deletes allowed
```

**Driver Isolation:**

```sql
-- Drivers can view assigned orders
CREATE POLICY "Drivers view assigned orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = driver_id
    OR (auth.jwt() ->> 'role') = 'driver'  -- See all available orders
    OR (auth.jwt() ->> 'role') = 'admin'
  );

-- Drivers can update order status
CREATE POLICY "Drivers update order status"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = driver_id
  )
  WITH CHECK (
    -- Only allow status updates
    status IN ('in_delivery', 'delivered')
  );
```

---

### 3. Secure Functions with SECURITY DEFINER

**Use with Caution:**

```sql
-- Function to get admin statistics (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's privileges
SET search_path = public, private
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller is admin
  IF (auth.jwt() ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_restaurants', (SELECT COUNT(*) FROM restaurants),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'total_revenue', (SELECT SUM(total_price) FROM orders WHERE payment_status = 'paid')
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
```

**Security Checklist for SECURITY DEFINER:**
- ✅ Always validate caller's role
- ✅ Set `search_path` explicitly
- ✅ Use parameterized queries
- ✅ Limit to necessary operations only
- ✅ Audit function usage regularly

---

## Data Protection

### 1. Sensitive Data Encryption

**Encrypt PII Before Storage:**

```typescript
// lib/crypto.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encrypted, authTagHex] = encryptedText.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

**Usage:**

```typescript
// app/orders/actions.ts
import { encrypt } from '@/lib/crypto'

export async function createOrder(formData: FormData) {
  const deliveryAddress = formData.get('delivery_address') as string
  const customerPhone = formData.get('customer_phone') as string

  // Encrypt sensitive data
  const encryptedAddress = encrypt(deliveryAddress)
  const encryptedPhone = encrypt(customerPhone)

  await supabase.from('orders').insert({
    delivery_address: encryptedAddress,
    customer_phone: encryptedPhone,
    // ... other fields
  })
}
```

---

### 2. Data Masking for Logs

**Never Log Sensitive Data:**

```typescript
// lib/logger.ts
export function sanitizeForLogging(obj: any): any {
  const sensitive = ['password', 'token', 'secret', 'api_key', 'phone', 'address']

  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const sanitized = { ...obj }

  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key])
    }
  }

  return sanitized
}

// Usage
console.log('Order created:', sanitizeForLogging(orderData))
// Output: { customer_phone: '[REDACTED]', ... }
```

---

### 3. Audit Logging

**Track Security Events:**

```sql
-- migrations/xxx_audit_logs.sql

CREATE TABLE private.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX audit_logs_user_id_idx ON private.audit_logs(user_id);
CREATE INDEX audit_logs_created_at_idx ON private.audit_logs(created_at DESC);

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION private.log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO private.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER orders_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION private.log_audit_event();
```

---

## Input Validation & Sanitization

### 1. Server-Side Validation

**Always Validate on Server:**

```typescript
// app/orders/actions.ts
'use server'

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

const createOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive().max(1000)
  })).min(1).max(100),
  delivery_address: z.string()
    .min(5, 'Address too short')
    .max(500, 'Address too long')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Invalid characters in address'),
  delivery_notes: z.string().max(1000).optional(),
  total_price: z.number().positive().max(1000000)
})

export async function createOrder(formData: FormData) {
  // Parse input
  const rawData = {
    items: JSON.parse(formData.get('items') as string),
    delivery_address: formData.get('delivery_address'),
    delivery_notes: formData.get('delivery_notes'),
    total_price: parseFloat(formData.get('total_price') as string)
  }

  // Validate
  const parsed = createOrderSchema.safeParse(rawData)

  if (!parsed.success) {
    return {
      error: 'Invalid input',
      details: parsed.error.format()
    }
  }

  // Sanitize HTML
  const sanitizedNotes = parsed.data.delivery_notes
    ? DOMPurify.sanitize(parsed.data.delivery_notes)
    : null

  // Proceed with database insert
  const { data, error } = await supabase.from('orders').insert({
    ...parsed.data,
    delivery_notes: sanitizedNotes
  })

  return { data, error }
}
```

---

### 2. Prevent SQL Injection

**Use Parameterized Queries:**

```typescript
// ❌ WRONG - SQL Injection vulnerability
const { data } = await supabase
  .from('orders')
  .select('*')
  .filter('status', 'eq', userInput)  // If userInput = "pending' OR '1'='1"

// ✅ CORRECT - Parameterized query (safe)
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('status', userInput)  // Supabase automatically escapes

// ✅ CORRECT - Use RLS instead of dynamic queries
// RLS: auth.uid() = restaurant_id
const { data } = await supabase
  .from('orders')
  .select('*')  // RLS filters automatically
```

---

### 3. Prevent XSS (Cross-Site Scripting)

**Sanitize User Content:**

```typescript
// components/order-notes.tsx
import DOMPurify from 'isomorphic-dompurify'

export function OrderNotes({ notes }: { notes: string }) {
  // Sanitize HTML before rendering
  const clean = DOMPurify.sanitize(notes, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target']
  })

  return (
    <div
      dangerouslySetInnerHTML={{ __html: clean }}
      className="order-notes"
    />
  )
}
```

**Next.js Escaping (Automatic):**

```typescript
// Next.js automatically escapes variables
export function UserProfile({ user }) {
  return (
    <div>
      {/* Automatically escaped - safe from XSS */}
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  )
}
```

---

## API Security

### 1. CSRF Protection

**Server Actions (Automatic):**

Next.js Server Actions have built-in CSRF protection.

**API Routes (Manual):**

```typescript
// lib/csrf.ts
import { createHash } from 'crypto'

export function generateCsrfToken(): string {
  return createHash('sha256')
    .update(Math.random().toString())
    .digest('hex')
}

export function validateCsrfToken(token: string, sessionToken: string): boolean {
  // Implement token validation logic
  return token === sessionToken
}
```

---

### 2. API Key Rotation

**Rotate Keys Regularly:**

```bash
# Supabase Dashboard > Settings > API

# Generate new anon key
# Update environment variables
NEXT_PUBLIC_SUPABASE_ANON_KEY=new_key

# Update service_role key (more critical)
SUPABASE_SERVICE_ROLE_KEY=new_service_key

# Redeploy application
vercel --prod
```

---

### 3. IP Whitelisting

**Restrict Admin Panel Access:**

```typescript
// middleware.ts
const ADMIN_ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || []

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const ip = request.headers.get('x-forwarded-for') || request.ip

    if (ADMIN_ALLOWED_IPS.length > 0 && !ADMIN_ALLOWED_IPS.includes(ip!)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}
```

---

## Compliance & Regulations

### 1. GDPR Compliance

**User Rights:**
- Right to access data
- Right to rectification
- Right to erasure
- Right to data portability

**Implementation:**

```typescript
// app/api/gdpr/export/route.ts
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Export all user data
  const [
    { data: profile },
    { data: orders },
    { data: payments }
  ] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*').eq('restaurant_id', user.id),
    supabase.from('payments').select('*').eq('restaurant_id', user.id)
  ])

  const exportData = {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    profile,
    orders,
    payments
  }

  return NextResponse.json(exportData)
}

// app/api/gdpr/delete/route.ts
export async function DELETE(request: NextRequest) {
  const supabaseAdmin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Soft delete (preserve for legal compliance)
  await supabase
    .from('restaurants')
    .update({
      deleted_at: new Date().toISOString(),
      email: `deleted_${user.id}@example.com`,
      phone: null
    })
    .eq('id', user.id)

  // Delete auth user after 30 days
  // Scheduled via cron job

  return NextResponse.json({ success: true })
}
```

---

### 2. PCI DSS Compliance

**Payment Data Handling:**
- NEVER store full credit card numbers
- Use payment gateway tokens (Stripe, PayPal)
- Log all payment transactions
- Encrypt cardholder data at rest

```typescript
// ✅ CORRECT - Store token only
await supabase.from('payments').insert({
  order_id: orderId,
  stripe_payment_intent_id: paymentIntent.id,  // Token, not card
  amount: 100.00,
  currency: 'GEL',
  status: 'succeeded'
})

// ❌ WRONG - Never store card data
await supabase.from('payments').insert({
  card_number: '4242424242424242',  // NEVER DO THIS!
  cvv: '123'  // NEVER DO THIS!
})
```

---

## Security Monitoring & Incident Response

### 1. Security Monitoring

**Log Security Events:**

```sql
-- Query failed login attempts
SELECT
  user_id,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM private.audit_logs
WHERE action = 'LOGIN_FAILED'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 5;

-- Query suspicious activity
SELECT *
FROM private.audit_logs
WHERE action IN ('DELETE', 'UPDATE')
  AND table_name IN ('orders', 'payments')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

### 2. Incident Response Plan

**Steps for Security Breach:**

1. **Identify** - Detect breach via monitoring
2. **Contain** - Revoke compromised keys, lock accounts
3. **Investigate** - Review audit logs, identify scope
4. **Notify** - Inform affected users (GDPR requirement)
5. **Remediate** - Patch vulnerabilities, restore from backup
6. **Document** - Post-mortem analysis

**Emergency Procedures:**

```bash
# Revoke all JWT signing keys
# Supabase Dashboard > Authentication > JWT Settings > Revoke

# Force logout all users
supabase auth admin sign-out --scope global

# Rotate API keys
# Supabase Dashboard > Settings > API > Generate new keys

# Review audit logs
psql -h data.greenland77.ge -U postgres -c "
  SELECT * FROM private.audit_logs
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC;
"
```

---

## Security Checklist

### Pre-Deployment

- [ ] RLS enabled on all public tables
- [ ] Password policy configured (min 8 chars, complexity)
- [ ] MFA enabled for admin accounts
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS sanitization implemented
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Audit logging enabled
- [ ] service_role key not exposed in client
- [ ] Environment variables secured

### Post-Deployment

- [ ] Monitor failed login attempts
- [ ] Review audit logs weekly
- [ ] Rotate API keys quarterly
- [ ] Update dependencies monthly
- [ ] Penetration testing annually
- [ ] Backup database daily
- [ ] Test disaster recovery plan quarterly

---

## Related Documentation

- [01-supabase-auth.md](./01-supabase-auth.md) - Authentication implementation
- [05-row-level-security.md](./05-row-level-security.md) - RLS policies in depth
- [09-integration-patterns.md](./09-integration-patterns.md) - Secure Next.js patterns

---

## Official Resources

- **Security Best Practices**: https://supabase.com/docs/guides/platform/security
- **RLS Guide**: https://supabase.com/docs/guides/database/postgres/row-level-security
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

---

*Last Updated: October 29, 2025*  
*Project: Georgian Distribution System*  
*Security is not a feature, it's a requirement.*
