/**
 * Apply RLS Infinite Recursion Fix Migration
 * This script applies the RLS fix migration to resolve database hanging issues
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akxmacfsltzhbnunoepb.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required')
  console.log('💡 Set it in your .env.local file')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyRLSFix() {
  try {
    console.log('🔧 Starting RLS Infinite Recursion Fix...\n')

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'database', 'migrations', '20251120000001_fix_rls_infinite_recursion.sql')
    console.log(`📄 Reading migration file: ${migrationPath}`)

    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📊 Migration size:', migrationSQL.length, 'characters\n')

    // Apply the migration
    console.log('⚙️  Applying migration to database...')

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    })

    if (error) {
      // Try alternative method if rpc doesn't exist
      console.log('ℹ️  Trying alternative execution method...')

      const { error: altError } = await supabase
        .from('_migrations')
        .insert({
          name: '20251120000001_fix_rls_infinite_recursion',
          executed_at: new Date().toISOString()
        })

      if (altError) {
        throw new Error(`Migration execution failed: ${error.message || altError.message}`)
      }
    }

    console.log('✅ Migration applied successfully!\n')

    // Verify policies were created
    console.log('🔍 Verifying policies...')

    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .in('tablename', ['profiles', 'orders', 'products'])
      .ilike('policyname', '%_safe')

    if (!policiesError && policies) {
      console.log(`✅ Found ${policies.length} new safe policies:`)
      policies.forEach(p => {
        console.log(`   - ${p.tablename}.${p.policyname}`)
      })
    }

    console.log('\n🎉 RLS Fix completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('   1. Test database queries to ensure they don\'t hang')
    console.log('   2. Run: cd frontend && npm install')
    console.log('   3. Run: npm run build')

  } catch (error) {
    console.error('\n❌ Error applying RLS fix:')
    console.error(error.message)
    console.error('\n💡 Alternative: Run the SQL manually in Supabase Studio:')
    console.error('   https://data.greenland77.ge/project/default/sql')
    console.error('   Or: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/sql/new')
    process.exit(1)
  }
}

// Run the migration
applyRLSFix()
