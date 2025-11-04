# Schema Verification Without Admin Access
## Best Practices for Georgian Distribution Management System

## Overview
You have 10 tables defined locally but cannot verify sync with Supabase Cloud due to API key issues. These methods work with standard `anon` key (no admin access required).

---

## Method 1: Table Existence Check (Anon Key Only)

### Create: `scripts/check-tables.ts`

```typescript
#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

// Configure your Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Georgian Distribution System Tables
const TABLES = [
  'products',           // პროდუქტები
  'distributors',       // დისტრიბუტორები
  'customers',          // მომხმარებლები
  'orders',             // შეკვეთები
  'order_items',        // შეკვეთის პოზიციები
  'inventory',          // მარაგი
  'shipments',          // გადაზიდვები
  'invoices',           // ინვოისები
  'payments',           // გადახდები
  'users',              // მომხმარებლები
] as const

type TableStatus = {
  name: string
  exists: boolean
  accessible: boolean
  error: string | null
  errorCode: string | null
  rowCount: number | null
}

async function checkTable(tableName: string): Promise<TableStatus> {
  try {
    // Attempt to query the table
    const { data, error, count } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true })
      .limit(0)

    // Analyze the error to determine table status
    if (!error) {
      return {
        name: tableName,
        exists: true,
        accessible: true,
        error: null,
        errorCode: null,
        rowCount: count,
      }
    }

    // Error codes interpretation:
    // PGRST116 = relation does not exist (table not found)
    // 42501 = permission denied (table exists, RLS blocks)
    // 42P01 = undefined table

    const exists = !['PGRST116', '42P01'].includes(error.code || '')

    return {
      name: tableName,
      exists,
      accessible: !error,
      error: error.message,
      errorCode: error.code || null,
      rowCount: exists ? count : null,
    }

  } catch (err: any) {
    return {
      name: tableName,
      exists: false,
      accessible: false,
      error: err.message,
      errorCode: null,
      rowCount: null,
    }
  }
}

async function checkAllTables() {
  console.log('🔍 Georgian Distribution Management System - Schema Check\n')
  console.log(`Project: ${supabaseUrl}\n`)
  console.log('─'.repeat(70))

  const results: TableStatus[] = []

  for (const table of TABLES) {
    const status = await checkTable(table)
    results.push(status)

    // Visual indicators
    const existsIcon = status.exists ? '✅' : '❌'
    const accessIcon = status.accessible ? '🔓' : '🔒'
    
    const statusText = status.exists
      ? status.accessible
        ? `Exists & Accessible (${status.rowCount || 0} rows)`
        : 'Exists (RLS Protected)'
      : 'NOT FOUND'

    console.log(`${existsIcon} ${accessIcon} ${table.padEnd(20)} → ${statusText}`)

    if (status.error && !status.exists) {
      console.log(`   └─ Error: ${status.error}`)
    }
  }

  console.log('─'.repeat(70))

  // Summary statistics
  const existsCount = results.filter(r => r.exists).length
  const accessibleCount = results.filter(r => r.accessible).length
  const missingCount = results.filter(r => !r.exists).length

  console.log(`\n📊 Summary:`)
  console.log(`   Total tables: ${TABLES.length}`)
  console.log(`   Exists in cloud: ${existsCount} ✅`)
  console.log(`   Accessible (no RLS): ${accessibleCount} 🔓`)
  console.log(`   Missing: ${missingCount} ❌`)

  // Analysis and recommendations
  console.log(`\n💡 Analysis:`)

  if (missingCount === TABLES.length) {
    console.log(`   ⚠️  NO tables found!`)
    console.log(`   Possible causes:`)
    console.log(`   1. Migrations not applied to Supabase Cloud`)
    console.log(`   2. Wrong project/database connected`)
    console.log(`   3. Tables exist in non-public schema`)
    console.log(`\n   🔧 Actions:`)
    console.log(`   → Run: npx supabase db push`)
    console.log(`   → Verify project ref in .env.local`)
    console.log(`   → Check Supabase dashboard for tables`)
  } else if (missingCount > 0) {
    console.log(`   ⚠️  Some tables are missing`)
    console.log(`   Missing tables:`)
    results
      .filter(r => !r.exists)
      .forEach(r => console.log(`      - ${r.name}`))
    console.log(`\n   🔧 Actions:`)
    console.log(`   → Review migration files`)
    console.log(`   → Run: npx supabase db push`)
  } else if (accessibleCount === 0) {
    console.log(`   ✅ All tables exist!`)
    console.log(`   🔒 All are RLS protected (this is good for security)`)
    console.log(`\n   🔧 Next steps:`)
    console.log(`   → Set up RLS policies for your app`)
    console.log(`   → Test with authenticated users`)
  } else {
    console.log(`   ✅ All tables exist and are accessible!`)
    console.log(`\n   🔧 Security recommendation:`)
    console.log(`   → Enable RLS on publicly accessible tables`)
  }

  // Exit code for CI/CD
  return existsCount === TABLES.length ? 0 : 1
}

// Run the check
checkAllTables()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    console.error('\n❌ Fatal error:', err.message)
    process.exit(1)
  })
```

---

## Method 2: Column Comparison (Type-Safe)

### Create: `scripts/verify-schema.ts`

```typescript
#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Extract expected columns from your types
type ExpectedSchema = {
  [K in keyof Database['public']['Tables']]: {
    tableName: K
    columns: (keyof Database['public']['Tables'][K]['Row'])[]
  }
}

async function verifyTableSchema<T extends keyof Database['public']['Tables']>(
  tableName: T
): Promise<{
  tableName: T
  columnCount: number
  sampleRow: any
  typeCheck: 'pass' | 'fail' | 'unknown'
  issues: string[]
}> {
  const issues: string[] = []

  try {
    // Fetch a single row to check column structure
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        issues.push('Table does not exist')
      } else if (error.code === 'PGRST116') {
        issues.push('No data in table (cannot verify columns)')
      }
      return {
        tableName,
        columnCount: 0,
        sampleRow: null,
        typeCheck: 'unknown',
        issues,
      }
    }

    // Check if we got data
    if (!data) {
      issues.push('Table is empty (cannot verify structure)')
      return {
        tableName,
        columnCount: 0,
        sampleRow: null,
        typeCheck: 'unknown',
        issues,
      }
    }

    // Compare with expected types
    const actualColumns = Object.keys(data)
    const expectedColumns = Object.keys(
      {} as Database['public']['Tables'][T]['Row']
    )

    // Find missing columns
    const missing = expectedColumns.filter(
      col => !actualColumns.includes(col)
    )
    if (missing.length > 0) {
      issues.push(`Missing columns: ${missing.join(', ')}`)
    }

    // Find extra columns
    const extra = actualColumns.filter(
      col => !expectedColumns.includes(col)
    )
    if (extra.length > 0) {
      issues.push(`Extra columns: ${extra.join(', ')}`)
    }

    return {
      tableName,
      columnCount: actualColumns.length,
      sampleRow: data,
      typeCheck: issues.length === 0 ? 'pass' : 'fail',
      issues,
    }

  } catch (err: any) {
    return {
      tableName,
      columnCount: 0,
      sampleRow: null,
      typeCheck: 'fail',
      issues: [err.message],
    }
  }
}

async function main() {
  console.log('🔍 Schema Verification - Georgian Distribution System\n')

  // Get all table names from your Database type
  const tables = Object.keys(
    {} as Database['public']['Tables']
  ) as (keyof Database['public']['Tables'])[]

  console.log(`Checking ${tables.length} tables...\n`)

  for (const table of tables) {
    const result = await verifyTableSchema(table)

    const icon = result.typeCheck === 'pass' ? '✅' :
                 result.typeCheck === 'fail' ? '❌' : '⚠️'

    console.log(`${icon} ${String(table)}`)
    console.log(`   Columns: ${result.columnCount}`)
    
    if (result.issues.length > 0) {
      console.log(`   Issues:`)
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`)
      })
    }
    
    console.log('')
  }
}

main().catch(console.error)
```

---

## Method 3: Migration Status Check

### Create: `scripts/check-migrations.ts`

```typescript
#!/usr/bin/env tsx
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

async function checkMigrations() {
  console.log('📁 Checking local migration files...\n')

  const migrationsDir = './supabase/migrations'
  
  try {
    const files = await readdir(migrationsDir)
    const sqlFiles = files.filter(f => f.endsWith('.sql'))

    console.log(`Found ${sqlFiles.length} migration files:\n`)

    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file)
      const content = await readFile(filePath, 'utf-8')

      // Extract CREATE TABLE statements
      const tables = content.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/gi)
      const tableNames = tables?.map(t => 
        t.replace(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?/i, '')
      ) || []

      console.log(`📄 ${file}`)
      if (tableNames.length > 0) {
        console.log(`   Creates: ${tableNames.join(', ')}`)
      }
      console.log('')
    }

    console.log(`\n💡 To apply these migrations to Supabase Cloud:`)
    console.log(`   1. Ensure your API keys are correct`)
    console.log(`   2. Run: npx supabase db push`)
    console.log(`   3. Run: npm run check-tables (to verify)`)

  } catch (err: any) {
    console.error('❌ Error reading migrations:', err.message)
    process.exit(1)
  }
}

checkMigrations()
```

---

## Method 4: Connection Health Check

### Create: `src/lib/supabase/health.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type HealthCheckResult = {
  status: 'healthy' | 'degraded' | 'down'
  timestamp: string
  checks: {
    environment: boolean
    connection: boolean
    authentication: boolean
    database: boolean
  }
  details: {
    projectUrl: string
    tablesChecked: number
    tablesFound: number
    errors: string[]
  }
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const timestamp = new Date().toISOString()
  const errors: string[] = []
  let tablesFound = 0

  // Check 1: Environment variables
  const hasEnv = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  if (!hasEnv) {
    errors.push('Missing environment variables')
    return {
      status: 'down',
      timestamp,
      checks: {
        environment: false,
        connection: false,
        authentication: false,
        database: false,
      },
      details: {
        projectUrl: 'N/A',
        tablesChecked: 0,
        tablesFound: 0,
        errors,
      },
    }
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check 2: Connection
  let connectionOk = false
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      }
    )
    connectionOk = response.ok
    if (!response.ok) {
      errors.push(`Connection failed with status ${response.status}`)
    }
  } catch (err: any) {
    errors.push(`Connection error: ${err.message}`)
  }

  // Check 3: Authentication
  let authOk = false
  try {
    await supabase.auth.getSession()
    authOk = true
  } catch (err: any) {
    errors.push(`Auth error: ${err.message}`)
  }

  // Check 4: Database (check critical tables)
  const criticalTables = ['products', 'orders', 'distributors']
  let databaseOk = false

  try {
    for (const table of criticalTables) {
      const { error } = await supabase
        .from(table as any)
        .select('id')
        .limit(1)

      if (!error || error.code === '42501') {
        // No error or RLS block = table exists
        tablesFound++
      }
    }
    databaseOk = tablesFound > 0
  } catch (err: any) {
    errors.push(`Database check error: ${err.message}`)
  }

  // Determine overall status
  const allChecks = hasEnv && connectionOk && authOk && databaseOk
  const someChecks = hasEnv || connectionOk || authOk || databaseOk

  return {
    status: allChecks ? 'healthy' : someChecks ? 'degraded' : 'down',
    timestamp,
    checks: {
      environment: hasEnv,
      connection: connectionOk,
      authentication: authOk,
      database: databaseOk,
    },
    details: {
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'N/A',
      tablesChecked: criticalTables.length,
      tablesFound,
      errors,
    },
  }
}
```

### API Route: `app/api/health/route.ts`

```typescript
import { performHealthCheck } from '@/lib/supabase/health'
import { NextResponse } from 'next/server'

export async function GET() {
  const health = await performHealthCheck()

  const statusCode =
    health.status === 'healthy' ? 200 :
    health.status === 'degraded' ? 503 : 503

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

export const dynamic = 'force-dynamic'
```

**Test it:**
```bash
curl http://localhost:3000/api/health | jq

# Expected healthy response:
{
  "status": "healthy",
  "timestamp": "2025-11-03T12:00:00.000Z",
  "checks": {
    "environment": true,
    "connection": true,
    "authentication": true,
    "database": true
  },
  "details": {
    "projectUrl": "https://akxmacfsltzhbnunoepb.supabase.co",
    "tablesChecked": 3,
    "tablesFound": 3,
    "errors": []
  }
}
```

---

## Method 5: Interactive Schema Explorer

### Create: `scripts/explore-schema.ts`

```typescript
#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

async function exploreTable(tableName: string) {
  console.log(`\n🔍 Exploring: ${tableName}\n`)

  // Try to get structure
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)

  if (error) {
    console.log(`❌ Error: ${error.message}`)
    if (error.code === 'PGRST116') {
      console.log(`   Table "${tableName}" does not exist`)
    } else if (error.code === '42501') {
      console.log(`   Table exists but RLS blocks access`)
    }
    return
  }

  if (!data || data.length === 0) {
    console.log(`⚠️  Table is empty (no data to show structure)`)
    return
  }

  // Show structure
  const columns = Object.keys(data[0])
  console.log(`Columns (${columns.length}):`)
  columns.forEach(col => {
    const value = data[0][col]
    const type = value === null ? 'null' : typeof value
    console.log(`  • ${col}: ${type}`)
  })

  console.log(`\nSample data:`)
  console.log(JSON.stringify(data[0], null, 2))
}

async function main() {
  console.log('🔎 Georgian Distribution System - Schema Explorer')
  console.log('Type table name to explore, or "exit" to quit\n')

  while (true) {
    const input = await question('Table name (or "exit"): ')

    if (input.toLowerCase() === 'exit') {
      break
    }

    if (!input.trim()) {
      continue
    }

    await exploreTable(input.trim())
  }

  rl.close()
  console.log('\n👋 Goodbye!')
}

main()
```

**Run it:**
```bash
npx tsx scripts/explore-schema.ts

# Interactive session:
# Table name: products
# 🔍 Exploring: products
# Columns (8):
#   • id: string
#   • name: string
#   • name_ka: string
#   • price: number
#   • created_at: string
# ...
```

---

## Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "check-tables": "tsx scripts/check-tables.ts",
    "verify-schema": "tsx scripts/verify-schema.ts",
    "check-migrations": "tsx scripts/check-migrations.ts",
    "explore-schema": "tsx scripts/explore-schema.ts",
    "health": "curl http://localhost:3000/api/health | jq",
    "supabase:sync": "npm run check-tables && npm run verify-schema"
  }
}
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/verify-schema.yml
name: Verify Supabase Schema

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check tables exist
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npm run check-tables
      
      - name: Verify schema matches
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npm run verify-schema
```

---

## Usage Examples

### Daily Development Workflow

```bash
# Morning: Verify everything is in sync
npm run check-tables

# After schema changes: Verify structure matches
npm run verify-schema

# Before pushing: Full check
npm run supabase:sync

# If issues: Explore specific table
npm run explore-schema
```

### Troubleshooting Workflow

```bash
# Step 1: Check connection
curl http://localhost:3000/api/health

# Step 2: Verify tables exist
npm run check-tables

# Step 3: If tables missing, check migrations
npm run check-migrations

# Step 4: Apply migrations
npx supabase db push

# Step 5: Verify again
npm run check-tables
```

---

## Expected Outputs

### ✅ Healthy System
```
🔍 Georgian Distribution Management System - Schema Check

Project: https://akxmacfsltzhbnunoepb.supabase.co

──────────────────────────────────────────────────────────────────────
✅ 🔓 products              → Exists & Accessible (45 rows)
✅ 🔒 distributors          → Exists (RLS Protected)
✅ 🔒 customers             → Exists (RLS Protected)
✅ 🔒 orders                → Exists (RLS Protected)
✅ 🔒 order_items           → Exists (RLS Protected)
✅ 🔒 inventory             → Exists (RLS Protected)
✅ 🔒 shipments             → Exists (RLS Protected)
✅ 🔒 invoices              → Exists (RLS Protected)
✅ 🔒 payments              → Exists (RLS Protected)
✅ 🔒 users                 → Exists (RLS Protected)
──────────────────────────────────────────────────────────────────────

📊 Summary:
   Total tables: 10
   Exists in cloud: 10 ✅
   Accessible (no RLS): 1 🔓
   Missing: 0 ❌

💡 Analysis:
   ✅ All tables exist!
   🔒 All are RLS protected (this is good for security)
```

### ❌ Schema Not Synced
```
🔍 Georgian Distribution Management System - Schema Check

Project: https://akxmacfsltzhbnunoepb.supabase.co

──────────────────────────────────────────────────────────────────────
❌ 🔒 products              → NOT FOUND
❌ 🔒 distributors          → NOT FOUND
❌ 🔒 customers             → NOT FOUND
...
──────────────────────────────────────────────────────────────────────

📊 Summary:
   Total tables: 10
   Exists in cloud: 0 ✅
   Accessible (no RLS): 0 🔓
   Missing: 10 ❌

💡 Analysis:
   ⚠️  NO tables found!
   Possible causes:
   1. Migrations not applied to Supabase Cloud
   2. Wrong project/database connected
   3. Tables exist in non-public schema

   🔧 Actions:
   → Run: npx supabase db push
   → Verify project ref in .env.local
   → Check Supabase dashboard for tables
```

---

## Key Benefits

1. **No Admin Access Required**: Uses standard `anon` key
2. **Type-Safe**: Leverages your existing `Database` types
3. **CI/CD Ready**: Exit codes for automated checks
4. **Georgian-Friendly**: Works with bilingual table data
5. **Detailed Diagnostics**: Clear error messages and solutions
6. **Zero Dependencies**: Uses only Supabase client

---

## Common Issues and Solutions

### Issue: "Cannot read properties of undefined"
```
Solution: Table has no data yet
→ Insert sample data or check empty tables differently
```

### Issue: "relation does not exist"
```
Solution: Migration not applied
→ Run: npx supabase db push
```

### Issue: "permission denied for table"
```
Solution: RLS is enabled (good!)
→ This means table EXISTS, just protected
→ Configure RLS policies for your use case
```

### Issue: All checks timeout
```
Solution: Connection problem
→ Verify API keys with: curl test (see main troubleshooting guide)
→ Check project not paused
```
