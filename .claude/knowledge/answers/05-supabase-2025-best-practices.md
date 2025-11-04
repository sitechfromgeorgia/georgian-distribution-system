# 2025 Best Practices for Supabase API Key Management and Troubleshooting

## Overview
This comprehensive guide covers modern best practices for managing Supabase API keys in 2025, with special focus on Next.js 15, security, the transition to new key types, and production-grade troubleshooting workflows.

---

## Part 1: Environment Configuration Best Practices

### 1.1 Next.js 15 Environment Variables Structure

#### Recommended File Structure
```
my-nextjs-app/
├── .env                      # Shared across all environments
├── .env.local               # Local secrets (never commit!)
├── .env.development         # Development-specific
├── .env.production          # Production (no secrets!)
├── .env.test                # Testing
└── .gitignore              # Must include .env.local
```

#### File Precedence (Highest to Lowest)
```
1. .env.local (overrides everything)
2. .env.development or .env.production (based on NODE_ENV)
3. .env
```

---

### 1.2 Naming Conventions (2025 Standard)

#### Client-Side Keys (Exposed in Browser)
```bash
# ✅ CORRECT - Must have NEXT_PUBLIC_ prefix
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# OR with new keys (recommended)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# ❌ WRONG - Will not be accessible in client components
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

#### Server-Side Keys (Secret)
```bash
# ✅ CORRECT - No prefix (server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# OR with new keys (recommended)
SUPABASE_SECRET_KEY=sb_secret_...

# Additional recommended variables
SUPABASE_JWT_SECRET=your-jwt-secret-here
DATABASE_URL=postgresql://postgres:[password]@...
```

---

### 1.3 Complete .env.local Template (2025)

```bash
# ==================================
# Supabase Configuration (Local Dev)
# ==================================

# Project URL (always NEXT_PUBLIC)
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co

# Choose ONE of the following key sets:

# Option A: Legacy Keys (current standard)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Option B: New Keys (recommended for 2025+)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# ==================================
# Optional: Database Direct Access
# ==================================
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# ==================================
# Optional: Debugging
# ==================================
NEXT_PUBLIC_SUPABASE_DEBUG=false
NODE_ENV=development
```

---

### 1.4 TypeScript Environment Variable Validation

#### Create Type Definitions
```typescript
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    // Public variables (client + server)
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
    
    // Private variables (server only)
    SUPABASE_SERVICE_ROLE_KEY?: string
    SUPABASE_SECRET_KEY?: string
    DATABASE_URL?: string
    
    // Next.js
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
```

#### Runtime Validation
```typescript
// src/lib/env.ts
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
  ]
  
  // Must have either legacy or new keys
  const hasLegacyKeys = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const hasNewKeys = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
  
  if (!hasLegacyKeys && !hasNewKeys) {
    throw new Error(
      'Missing Supabase keys: Must provide either ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY or ' +
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    )
  }
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
  
  console.log('✅ Environment variables validated')
}

// Call in app initialization
validateEnv()
```

---

## Part 2: Supabase Client Configuration

### 2.1 Client-Side Configuration (Browser)

#### Modern Approach (Next.js 15 App Router)
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Usage in Client Components
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const [data, setData] = useState(null)
  const supabase = createClient()
  
  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
      
      if (error) console.error('Error:', error)
      else setData(data)
    }
    
    loadData()
  }, [])
  
  return <div>{/* render data */}</div>
}
```

---

### 2.2 Server-Side Configuration

#### Server Components
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie errors
          }
        },
      },
    }
  )
}
```

#### API Routes (Admin Access)
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

// Use service role for admin operations (bypasses RLS)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY! ||
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

#### Usage in API Routes
```typescript
// app/api/admin/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  
  // This bypasses RLS - use with caution!
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ data })
}
```

---

### 2.3 Middleware Configuration (Cookie-Based Auth)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Part 3: Security Best Practices

### 3.1 Key Storage Security

#### ✅ DO's
```bash
# Store in environment files
.env.local (local development)
Vercel/Netlify dashboard (production)
GitHub Secrets (CI/CD)
Password managers (team sharing)

# Never commit secrets
# .gitignore
.env*.local
.env.production
*.key
*.pem
```

#### ❌ DON'Ts
```javascript
// Never hardcode keys
const supabase = createClient(
  'https://xxx.supabase.co',
  'eyJhbGc...' // ❌ NEVER DO THIS
)

// Never commit to Git
// ❌ Don't commit .env.local

// Never expose server keys in client
if (typeof window !== 'undefined') {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY // ❌ WRONG
}

// Never log keys
console.log('Key:', process.env.SUPABASE_SECRET_KEY) // ❌ NEVER
```

---

### 3.2 Row Level Security (RLS) Setup

#### Enable RLS on All Tables
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Public read, authenticated write
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

#### Test RLS Policies
```typescript
// Test with anon key (should respect RLS)
const supabase = createClient(url, anonKey)
const { data } = await supabase.from('users').select('*')
// Should only return user's own data

// Test with service role (bypasses RLS)
const admin = createClient(url, serviceRoleKey)
const { data } = await admin.from('users').select('*')
// Returns ALL data (use carefully!)
```

---

### 3.3 API Key Rotation Strategy

#### Annual Rotation Schedule (Recommended)
```
January: Plan rotation
February: Generate new keys
March: Deploy new keys to staging
April: Monitor and test
May: Deploy to production (gradual rollout)
June: Deactivate old keys
```

#### Zero-Downtime Rotation Process
```bash
# Phase 1: Generate New Keys
1. Dashboard → Settings → API → Create new API Keys
2. Copy new publishable and secret keys
3. Store securely

# Phase 2: Deploy New Keys (Blue-Green)
1. Add new keys to environment (keep old ones)
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NEW...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJOLD... # Keep temporarily
   
2. Update code to use new keys first, fallback to old:
   createClient(url, 
     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   )

# Phase 3: Monitor
1. Deploy to staging
2. Test all features
3. Monitor logs for issues
4. Check "Last Used" in dashboard

# Phase 4: Production Rollout
1. Deploy to production
2. Monitor for 48 hours
3. Verify old keys no longer used

# Phase 5: Cleanup
1. Remove old key environment variables
2. Disable old keys in dashboard
3. Update documentation
```

---

### 3.4 Multiple Environment Strategy

#### Separate Projects Per Environment
```
Development:  dev-project.supabase.co
Staging:      staging-project.supabase.co  
Production:   prod-project.supabase.co
```

#### Environment-Specific .env Files
```bash
# .env.development
NEXT_PUBLIC_SUPABASE_URL=https://dev-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dev...

# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_prod...
```

---

## Part 4: Error Handling and Debugging

### 4.1 Comprehensive Error Handler

```typescript
// src/lib/supabase/error-handler.ts
export type SupabaseError = {
  code: string
  message: string
  details?: string
  hint?: string
  status?: number
}

export function handleSupabaseError(error: any): {
  message: string
  shouldRetry: boolean
  isAuthError: boolean
} {
  // Invalid API key
  if (error.message?.includes('Invalid API key')) {
    return {
      message: 'Authentication failed. Please check your API keys.',
      shouldRetry: false,
      isAuthError: true
    }
  }
  
  // Project paused
  if (error.status === 540) {
    return {
      message: 'Service temporarily unavailable. Project may be paused.',
      shouldRetry: true,
      isAuthError: false
    }
  }
  
  // Rate limiting
  if (error.status === 429) {
    return {
      message: 'Too many requests. Please try again later.',
      shouldRetry: true,
      isAuthError: false
    }
  }
  
  // RLS policy error (not actually invalid key)
  if (error.code === 'PGRST204' || error.code === '42501') {
    return {
      message: 'Access denied by security policy.',
      shouldRetry: false,
      isAuthError: false
    }
  }
  
  // Network errors
  if (error.message?.includes('Failed to fetch')) {
    return {
      message: 'Network error. Please check your connection.',
      shouldRetry: true,
      isAuthError: false
    }
  }
  
  // Default
  return {
    message: error.message || 'An unexpected error occurred.',
    shouldRetry: false,
    isAuthError: false
  }
}
```

#### Usage
```typescript
try {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) throw error
  
  return data
} catch (error) {
  const { message, shouldRetry, isAuthError } = 
    handleSupabaseError(error)
  
  if (isAuthError) {
    // Redirect to login or show config error
    console.error('Auth configuration error:', message)
  }
  
  if (shouldRetry) {
    // Implement retry logic
    setTimeout(() => retryOperation(), 5000)
  }
  
  // Show user-friendly message
  toast.error(message)
}
```

---

### 4.2 Health Check System

```typescript
// src/lib/supabase/health-check.ts
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'down'
  checks: Record<string, boolean>
  errors: string[]
}> {
  const checks: Record<string, boolean> = {}
  const errors: string[] = []
  
  // Check 1: Environment variables
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing SUPABASE_URL')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Missing Supabase keys')
    }
    checks.env = true
  } catch (error) {
    checks.env = false
    errors.push(error.message)
  }
  
  // Check 2: API connectivity
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        }
      }
    )
    checks.api = response.ok
    if (!response.ok) {
      errors.push(`API returned ${response.status}`)
    }
  } catch (error) {
    checks.api = false
    errors.push('API connectivity failed')
  }
  
  // Check 3: Auth service
  try {
    const supabase = createClient()
    await supabase.auth.getSession()
    checks.auth = true
  } catch (error) {
    checks.auth = false
    errors.push('Auth service check failed')
  }
  
  // Determine overall status
  const allHealthy = Object.values(checks).every(v => v)
  const someHealthy = Object.values(checks).some(v => v)
  
  return {
    status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'down',
    checks,
    errors
  }
}
```

#### API Route for Health Check
```typescript
// app/api/health/route.ts
import { healthCheck } from '@/lib/supabase/health-check'
import { NextResponse } from 'next/server'

export async function GET() {
  const health = await healthCheck()
  
  const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 503 : 503
  
  return NextResponse.json(health, { status: statusCode })
}
```

---

### 4.3 Logging and Monitoring

#### Client-Side Error Tracking
```typescript
// src/lib/error-tracker.ts
export function trackError(error: Error, context?: Record<string, any>) {
  // Send to error tracking service (Sentry, LogRocket, etc.)
  console.error('Tracked error:', error, context)
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/log-error', {
      method: 'POST',
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
        },
        context,
        timestamp: new Date().toISOString(),
      })
    })
  }
}

// Usage
try {
  await supabase.from('users').select('*')
} catch (error) {
  trackError(error, {
    operation: 'fetch_users',
    userId: user?.id,
  })
}
```

---

## Part 5: Production Deployment

### 5.1 Vercel Deployment

#### Configure Environment Variables
```bash
# Vercel Dashboard → Project → Settings → Environment Variables

# Production
NEXT_PUBLIC_SUPABASE_URL = https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = sb_publishable_prod...
SUPABASE_SECRET_KEY = sb_secret_prod...

# Preview (optional)
NEXT_PUBLIC_SUPABASE_URL = https://staging.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = sb_publishable_staging...

# Development (optional)
NEXT_PUBLIC_SUPABASE_URL = https://dev.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = sb_publishable_dev...
```

#### Vercel CLI Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel env add SUPABASE_SECRET_KEY production

# Pull environment variables locally
vercel env pull .env.local
```

---

### 5.2 Pre-Deployment Checklist

```
□ Environment variables configured in hosting platform
□ Keys match production Supabase project
□ RLS policies enabled on all tables
□ API health check passing
□ Error tracking configured
□ Monitoring alerts set up
□ CORS settings configured (if needed)
□ Rate limiting considered
□ Backup strategy in place
□ Team has access to credentials
□ Documentation updated
□ Rollback plan ready
```

---

### 5.3 Post-Deployment Verification

```typescript
// scripts/verify-production.ts
async function verifyProduction() {
  console.log('🔍 Verifying production deployment...\n')
  
  // Test 1: Environment variables
  const checks = []
  
  try {
    const response = await fetch('https://your-domain.com/api/health')
    const health = await response.json()
    
    console.log('✅ Health check:', health.status)
    checks.push(health.status === 'healthy')
  } catch (error) {
    console.error('❌ Health check failed:', error.message)
    checks.push(false)
  }
  
  // Test 2: Public API access
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`
    )
    console.log('✅ Public API:', response.ok)
    checks.push(response.ok)
  } catch (error) {
    console.error('❌ Public API failed')
    checks.push(false)
  }
  
  // Test 3: Authentication
  // Add more tests as needed
  
  const passed = checks.every(c => c)
  console.log(passed ? 
    '\n✅ All checks passed!' : 
    '\n❌ Some checks failed!'
  )
  
  process.exit(passed ? 0 : 1)
}

verifyProduction()
```

---

## Part 6: Advanced Patterns

### 6.1 API Key Abstraction Layer

```typescript
// src/lib/supabase/keys.ts
type Environment = 'development' | 'staging' | 'production'

interface SupabaseKeys {
  url: string
  publishableKey: string
  secretKey?: string
}

function getKeys(env?: Environment): SupabaseKeys {
  const nodeEnv = env || process.env.NODE_ENV || 'development'
  
  // Try new keys first (2025 recommended)
  const publishableKey = 
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!publishableKey) {
    throw new Error(
      `Missing Supabase publishable key for ${nodeEnv} environment`
    )
  }
  
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey,
    secretKey,
  }
}

export { getKeys }
```

---

### 6.2 Automatic Key Rotation Detection

```typescript
// src/lib/supabase/key-monitor.ts
let lastKeyCheck = Date.now()
let currentKeyHash = ''

export function monitorKeyChanges() {
  const newKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const newHash = hashKey(newKey)
  
  if (currentKeyHash && newHash !== currentKeyHash) {
    console.warn('⚠️ API key changed! Reinitializing connections...')
    // Trigger reconnection logic
    reinitializeConnections()
  }
  
  currentKeyHash = newHash
  lastKeyCheck = Date.now()
}

function hashKey(key: string): string {
  // Simple hash for comparison (not cryptographic)
  return key.split('').reduce((acc, char) => 
    acc + char.charCodeAt(0), 0
  ).toString()
}
```

---

## Part 7: Testing Strategies

### 7.1 Unit Tests with Mock Keys

```typescript
// tests/supabase.test.ts
import { createClient } from '@/lib/supabase/client'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-key'
}

beforeEach(() => {
  Object.assign(process.env, mockEnv)
})

describe('Supabase Client', () => {
  it('should create client with correct keys', () => {
    const client = createClient()
    expect(client).toBeDefined()
  })
  
  it('should throw error when keys missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(() => createClient()).toThrow()
  })
})
```

---

### 7.2 Integration Tests

```typescript
// tests/integration/api.test.ts
import { createClient } from '@/lib/supabase/client'

describe('API Integration', () => {
  let supabase: ReturnType<typeof createClient>
  
  beforeAll(() => {
    // Use test environment keys
    process.env.NEXT_PUBLIC_SUPABASE_URL = 
      process.env.TEST_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 
      process.env.TEST_SUPABASE_KEY
      
    supabase = createClient()
  })
  
  it('should connect to database', async () => {
    const { error } = await supabase
      .from('_test_table')
      .select('*')
      .limit(1)
    
    expect(error).toBeNull()
  })
})
```

---

## Part 8: Migration Guide (Legacy → New Keys)

### 8.1 Preparation Phase
```bash
# Week 1-2: Assessment
□ Audit all locations using old keys
□ Identify all environments (dev, staging, prod)
□ Document current architecture
□ Plan rollout schedule
□ Communicate to team
```

### 8.2 Implementation Phase
```bash
# Week 3: Generate and Test
1. Create new keys in dashboard
2. Test in local development
3. Update .env.local with both key sets
4. Test all features locally
5. Fix any issues

# Week 4: Staging Deployment
1. Deploy to staging with new keys
2. Run integration tests
3. Monitor for 72 hours
4. Performance testing

# Week 5: Production Rollout
1. Deploy to production (keep old keys as fallback)
2. Monitor logs and metrics
3. Verify "Last Used" timestamps
4. Customer impact assessment
```

### 8.3 Cleanup Phase
```bash
# Week 6: Finalize
1. Confirm old keys no longer used
2. Remove old key environment variables
3. Disable old keys in dashboard
4. Update all documentation
5. Team training on new keys
6. Post-mortem review
```

---

## Part 9: Troubleshooting Decision Tree

```
Invalid API Key Error
    │
    ├─→ Check Project Status
    │   ├─→ Paused? → Restore project
    │   └─→ Active? → Continue
    │
    ├─→ Verify Environment Variables
    │   ├─→ Missing? → Add to .env.local
    │   ├─→ Wrong prefix? → Add NEXT_PUBLIC_
    │   └─→ Correct? → Continue
    │
    ├─→ Test with cURL
    │   ├─→ 401? → Key is actually invalid
    │   ├─→ 200? → Configuration issue
    │   └─→ 540? → Project paused
    │
    ├─→ Check Key Format
    │   ├─→ Starts with 'eyJ'? → Legacy JWT
    │   ├─→ Starts with 'sb_'? → New key
    │   └─→ Other? → Copied incorrectly
    │
    ├─→ Verify in Dashboard
    │   ├─→ Keys exist? → Possibly rotated
    │   ├─→ Keys missing? → Regenerate
    │   └─→ Last used old? → Update app
    │
    └─→ Check Logs
        ├─→ 401 errors? → Auth issue
        ├─→ 403 errors? → RLS policy
        └─→ 500 errors? → Server issue
```

---

## Part 10: Resources and Tools

### Essential Documentation
- [Supabase API Keys Guide](https://supabase.com/docs/guides/api/api-keys)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Error Codes](https://supabase.com/docs/guides/auth/debugging/error-codes)

### Recommended Tools
```bash
# Development
- Supabase CLI
- Postman / Insomnia (API testing)
- JWT.io (token inspection)

# Monitoring
- Supabase Dashboard Logs
- Vercel Analytics
- Sentry / LogRocket (error tracking)

# Security
- 1Password / Bitwarden (key storage)
- Git-secrets (prevent commits)
- GitHub Secret Scanning
```

### Community Resources
- [Supabase GitHub Discussions](https://github.com/orgs/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

---

## Conclusion

Following these 2025 best practices will help you:
- ✅ Avoid common API key errors
- ✅ Maintain security in production
- ✅ Prepare for new key migration
- ✅ Implement robust error handling
- ✅ Deploy with confidence
- ✅ Monitor and troubleshoot effectively

Remember: The new publishable/secret key system is the future. Start migrating when comfortable, but legacy keys will work until late 2025 or beyond.
