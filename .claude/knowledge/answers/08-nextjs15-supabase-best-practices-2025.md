# 2025 Best Practices: Next.js 15 + Supabase Configuration
## Georgian Distribution Management System

## Complete Setup Checklist

### ✅ Initial Setup (30 minutes)

```bash
# 1. Project Structure
georgian-distribution/
├── .env.local                    # Local secrets (NEVER commit)
├── .env.example                  # Template (safe to commit)
├── .gitignore                    # Must include .env*.local
├── src/
│   ├── types/
│   │   └── database.ts          # Generated Supabase types (10 tables)
│   └── lib/
│       └── supabase/
│           ├── client.ts        # Browser client
│           ├── server.ts        # Server client
│           ├── admin.ts         # Admin client (service role)
│           └── health.ts        # Health check utilities
├── supabase/
│   └── migrations/              # 4 migration files
│       ├── 20240101000000_initial_schema.sql
│       ├── 20240102000000_distributors.sql
│       ├── 20240103000000_orders.sql
│       └── 20240104000000_rls_policies.sql
├── scripts/
│   ├── check-tables.ts          # Verify tables exist
│   ├── verify-schema.ts         # Compare with types
│   └── apply-migrations.sh      # Migration helper
└── app/
    └── api/
        ├── health/route.ts      # Health check endpoint
        └── test-supabase/route.ts  # Connection test
```

---

## Step 1: Environment Variables Configuration (2025 Standard)

### 1.1 Create .env.local

```bash
# Georgian Distribution Management System
# Project: akxmacfsltzhbnunoepb
# Region: us-east-1
# Created: 2025-11-03

# ==================================
# SUPABASE CONFIGURATION
# ==================================

# Project URL (always NEXT_PUBLIC for client access)
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co

# Choose ONE key set:

# Option A: Legacy Keys (current standard, works until late 2025)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_ROLE_KEY_HERE

# Option B: New Keys (recommended for 2025+)
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY_HERE
# SUPABASE_SECRET_KEY=sb_secret_YOUR_KEY_HERE

# ==================================
# OPTIONAL: DIRECT DATABASE ACCESS
# ==================================
# DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# ==================================
# OPTIONAL: DEBUGGING
# ==================================
# NEXT_PUBLIC_SUPABASE_DEBUG=false

# ==================================
# APPLICATION SETTINGS
# ==================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 1.2 Create .env.example (Safe Template)

```bash
# Georgian Distribution Management System
# Copy this to .env.local and fill in your values

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 1.3 Update .gitignore

```bash
# Environment variables
.env*.local
.env.local
.env.production.local
.env.development.local

# Supabase
.supabase/

# Next.js
.next/
out/
build/
dist/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Dependencies
node_modules/
```

---

## Step 2: Supabase Client Configuration

### 2.1 Browser Client (Client Components)

**File: `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Singleton pattern for browser client
let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  // Validate environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    )
  }

  // Reuse existing client instance
  if (client) {
    return client
  }

  // Create new client with Georgian Distribution schema
  client = createBrowserClient<Database>(url, key, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'georgian-distribution-system/1.0',
      },
    },
  })

  return client
}

// Helper function to check if client is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}
```

**Usage in Client Component:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [supabase])

  if (loading) return <div>მოტვირთვა...</div>

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name_ka || product.name}</h3>
          <p>ფასი: {product.price} ₾</p>
        </div>
      ))}
    </div>
  )
}
```

---

### 2.2 Server Client (Server Components & Actions)

**File: `src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
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
            // Server component - cannot set cookies
          }
        },
      },
    }
  )
}
```

**Usage in Server Component:**

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function DistributorsPage() {
  const supabase = await createClient()

  const { data: distributors, error } = await supabase
    .from('distributors')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error:', error)
    return <div>შეცდომა: {error.message}</div>
  }

  return (
    <div>
      <h1>დისტრიბუტორები</h1>
      {distributors?.map(dist => (
        <div key={dist.id}>
          <h3>{dist.name}</h3>
          <p>{dist.contact_person}</p>
        </div>
      ))}
    </div>
  )
}
```

---

### 2.3 Admin Client (Server-Side Only)

**File: `src/lib/supabase/admin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ⚠️ WARNING: This client bypasses RLS!
// Only use in API routes and server actions
// NEVER expose to client-side code

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ||
              process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase admin credentials. ' +
      'Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local'
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'georgian-distribution-admin/1.0',
      },
    },
  })
}

// Helper: Check if running in secure server context
export function isServerContext(): boolean {
  return typeof window === 'undefined'
}

// Safe admin client getter
export function getAdminClient() {
  if (!isServerContext()) {
    throw new Error(
      'Admin client can only be used in server-side code! ' +
      'This prevents accidental exposure of service role key.'
    )
  }

  return createAdminClient()
}
```

**Usage in API Route:**

```typescript
// app/api/admin/reset-inventory/route.ts
import { getAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = getAdminClient()

    // This bypasses RLS - use carefully!
    const { error } = await supabase
      .from('inventory')
      .update({ quantity: 0 })
      .match({ deleted: true })

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

## Step 3: Type-Safe Database Operations

### 3.1 Using Generated Types

```typescript
import type { Database } from '@/types/database'

// Extract specific table types
type Tables = Database['public']['Tables']
type Product = Tables['products']['Row']
type ProductInsert = Tables['products']['Insert']
type ProductUpdate = Tables['products']['Update']

// Type-safe queries
async function getProduct(id: string): Promise<Product | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Type-safe inserts
async function createProduct(
  product: ProductInsert
): Promise<Product> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) throw error
  return data
}

// Type-safe updates
async function updateProduct(
  id: string,
  updates: ProductUpdate
): Promise<Product> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

### 3.2 Error Handling Pattern

```typescript
// src/lib/supabase/errors.ts
import { PostgrestError } from '@supabase/supabase-js'

export class SupabaseError extends Error {
  code: string
  details: string
  hint?: string

  constructor(error: PostgrestError) {
    super(error.message)
    this.name = 'SupabaseError'
    this.code = error.code
    this.details = error.details
    this.hint = error.hint
  }
}

export function handleSupabaseError(error: PostgrestError): never {
  // Invalid API key
  if (error.message.includes('Invalid API key')) {
    throw new Error(
      'Database authentication failed. Please check your API keys.'
    )
  }

  // RLS policy violation
  if (error.code === '42501') {
    throw new Error(
      'Access denied. You do not have permission to perform this action.'
    )
  }

  // Table not found
  if (error.code === 'PGRST116') {
    throw new Error(
      'Database table not found. Schema may not be synced.'
    )
  }

  // Generic error
  throw new SupabaseError(error)
}

// Usage
try {
  const { data, error } = await supabase
    .from('products')
    .select('*')

  if (error) handleSupabaseError(error)

  return data
} catch (err) {
  console.error('Database error:', err)
  throw err
}
```

---

## Step 4: Safe Key Regeneration Process

### 4.1 Pre-Regeneration Checklist

```bash
# 1. Document current setup
echo "Current keys audit - $(date)" > key-audit.txt
echo "Project: akxmacfsltzhbnunoepb" >> key-audit.txt
echo "Environment: Development" >> key-audit.txt
echo "" >> key-audit.txt
echo "Keys in use:" >> key-audit.txt
cat .env.local | grep SUPABASE | sed 's/=.*/=REDACTED/' >> key-audit.txt

# 2. Backup current .env.local
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# 3. Verify no production traffic
# Check your analytics/monitoring

# 4. Notify team
echo "⚠️  Regenerating Supabase keys at $(date)" | # Send to Slack/Discord

# 5. Prepare rollback plan
cat > rollback-plan.md << EOF
# Rollback Plan

If key regeneration fails:

1. Stop: Don't proceed with deployment
2. Restore: cp .env.local.backup.TIMESTAMP .env.local
3. Restart: npm run dev
4. Test: npm run check-tables
5. Contact: Supabase support if issues persist
EOF
```

---

### 4.2 Regeneration Steps (Zero-Downtime)

```bash
# Phase 1: Generate new keys in dashboard
# 1. Go to: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/settings/api
# 2. Click "API Keys" tab
# 3. Click "Create new API Keys"
# 4. Copy new publishable and secret keys

# Phase 2: Update local development (KEEP OLD KEYS FOR NOW)
cat > .env.local << EOF
# OLD KEYS (temporary fallback)
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=OLD_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=OLD_SERVICE_ROLE_KEY

# NEW KEYS (primary)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=NEW_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=NEW_SECRET_KEY
EOF

# Phase 3: Update code to prefer new keys
# Update src/lib/supabase/client.ts:
# const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
#             process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  # fallback

# Phase 4: Test with new keys
rm -rf .next
npm run dev

# In another terminal:
npm run check-tables
npm run verify-schema
curl http://localhost:3000/api/health

# Phase 5: Deploy to staging/production
# Update environment variables in hosting platform

# Phase 6: Monitor for 48 hours
# Check dashboard "Last Used" timestamps
# Ensure old keys show no recent activity

# Phase 7: Cleanup
# Remove old keys from .env.local
# Disable old keys in dashboard
```

---

### 4.3 Emergency Rollback

```bash
# If something breaks during regeneration:

# 1. STOP deployment immediately
vercel rollback  # or your platform's rollback command

# 2. Restore backup
cp .env.local.backup.20251103_120000 .env.local

# 3. Restart development server
rm -rf .next
npm run dev

# 4. Verify restoration
npm run check-tables

# 5. Re-enable old keys in dashboard (if disabled)
# Dashboard → Settings → API → Legacy API Keys → Enable

# 6. Test thoroughly before trying regeneration again
npm run supabase:sync
```

---

## Step 5: Testing Connection

### 5.1 Quick Connection Test

```bash
# Create test script: scripts/test-connection.sh
#!/bin/bash

echo "🧪 Testing Supabase Connection..."
echo ""

# Load environment variables
export $(cat .env.local | grep SUPABASE | xargs)

# Test 1: Basic API
echo "1️⃣  Testing REST API..."
curl -s "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | \
  jq -r 'if .message then "✅ API responding" else "❌ API error" end'

# Test 2: Table access
echo "2️⃣  Testing table access..."
curl -s "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/products?select=id&limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" | \
  jq -r 'if type == "array" then "✅ Tables accessible" else "❌ Table error: " + .message end'

# Test 3: Health endpoint
echo "3️⃣  Testing health endpoint..."
curl -s "http://localhost:3000/api/health" | \
  jq -r 'if .status == "healthy" then "✅ Health check passed" else "❌ Health check failed" end'

echo ""
echo "Done! ✨"
```

**Run it:**
```bash
chmod +x scripts/test-connection.sh
./scripts/test-connection.sh
```

---

### 5.2 Comprehensive Test Suite

```typescript
// tests/supabase-connection.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/client'

describe('Supabase Connection', () => {
  beforeAll(() => {
    // Ensure env vars are loaded
    expect(isSupabaseConfigured()).toBe(true)
  })

  it('should create client successfully', () => {
    expect(() => createClient()).not.toThrow()
  })

  it('should connect to database', async () => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    // Either succeeds or RLS blocks (both mean connection works)
    expect(
      !error || error.code === '42501'
    ).toBe(true)
  })

  it('should handle all 10 tables', async () => {
    const supabase = createClient()
    
    const tables = [
      'products', 'distributors', 'customers',
      'orders', 'order_items', 'inventory',
      'shipments', 'invoices', 'payments', 'users'
    ]

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1)

      // Table exists if no error or RLS blocks
      const exists = !error || error.code === '42501'
      expect(exists).toBe(true)
    }
  })
})
```

**Run tests:**
```bash
npm run test
```

---

## Step 6: Production Deployment

### 6.1 Vercel Configuration

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables (production)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://akxmacfsltzhbnunoepb.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
# Enter: your publishable key

vercel env add SUPABASE_SECRET_KEY production
# Enter: your secret key (will be encrypted)

# Deploy
vercel --prod

# Verify deployment
curl https://your-domain.vercel.app/api/health
```

---

### 6.2 Environment Variables by Platform

**Netlify:**
```bash
# netlify.toml
[build.environment]
  NODE_VERSION = "20"

[context.production.environment]
  NEXT_PUBLIC_SUPABASE_URL = "https://akxmacfsltzhbnunoepb.supabase.co"
  # Add keys via Netlify dashboard (encrypted)
```

**Railway:**
```bash
# Via Railway dashboard:
# 1. Project → Variables
# 2. Add each variable
# 3. Redeploy
```

---

## Step 7: Maintenance & Monitoring

### 7.1 Daily Checks

```bash
# Add to package.json
{
  "scripts": {
    "daily-check": "npm run check-tables && npm run health && echo '✅ Daily check passed'"
  }
}

# Run daily
npm run daily-check
```

---

### 7.2 Weekly Audit

```bash
# scripts/weekly-audit.sh
#!/bin/bash

echo "📊 Weekly Supabase Audit - $(date)"
echo ""

# 1. Check all tables exist
npm run check-tables

# 2. Verify schema matches
npm run verify-schema

# 3. Check API key usage (in dashboard)
echo "⚠️  Manual: Check Supabase dashboard → Settings → API"
echo "   Verify 'Last Used' timestamps are recent"

# 4. Review RLS policies
echo "⚠️  Manual: Review RLS policies in Supabase dashboard"

# 5. Check for schema drift
echo "⚠️  Manual: Compare database.ts with actual schema"

echo ""
echo "Audit complete! 🎉"
```

---

## Quick Reference Card

```bash
# Daily Operations
npm run dev                    # Start dev server
npm run check-tables          # Verify tables exist
npm run health                # Check connection
npm run daily-check           # Complete daily check

# Schema Management
npm run verify-schema         # Compare types with cloud
npm run check-migrations      # List migration files
npx supabase db push          # Apply migrations

# Troubleshooting
./scripts/test-connection.sh  # Test all connections
npm run explore-schema        # Interactive explorer
curl localhost:3000/api/health  # Health check

# Key Management
cp .env.local .env.local.backup  # Backup before changes
npm run verify-env            # Verify env matches dashboard

# Deployment
vercel env pull .env.local    # Pull prod env vars
vercel --prod                 # Deploy to production
```

---

## Success Metrics

Your setup is production-ready when:

```
□ npm run dev starts without errors
□ npm run check-tables shows 10/10 tables
□ npm run verify-schema passes
□ curl localhost:3000/api/health returns "healthy"
□ All tests pass (npm run test)
□ .env.local has all required variables
□ .env.local.backup exists
□ .gitignore includes .env*.local
□ RLS policies configured for all tables
□ Production environment variables configured
□ Team can access credentials securely
□ Monitoring/alerts set up
□ Documentation updated
```

---

## Common Pitfalls to Avoid

1. **❌ Committing .env.local to Git**
   ```bash
   # Always verify before committing
   git status | grep env
   ```

2. **❌ Using service role key in client**
   ```typescript
   // NEVER do this in browser code
   const supabase = createClient(url, serviceRoleKey) // 🚨 DANGER
   ```

3. **❌ Forgetting to restart dev server**
   ```bash
   # After changing .env.local, ALWAYS restart
   rm -rf .next && npm run dev
   ```

4. **❌ Not backing up before regeneration**
   ```bash
   # ALWAYS backup first
   cp .env.local .env.local.backup.$(date +%Y%m%d)
   ```

5. **❌ Testing in production first**
   ```bash
   # ALWAYS test locally first
   npm run check-tables  # Local test
   # Then deploy
   ```

---

This completes your 2025 best practices setup for Georgian Distribution Management System with Next.js 15 and Supabase! 🚀
