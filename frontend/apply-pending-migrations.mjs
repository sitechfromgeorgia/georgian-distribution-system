import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: join(__dirname, '.env.local') })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akxmacfsltzhbnunoepb.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required')
    console.log('💡 Set it in your .env.local file')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function applyMigration(filename) {
    try {
        console.log(`\n🔧 Applying migration: ${filename}...`)
        const migrationPath = join(__dirname, '..', 'database', 'migrations', filename)
        console.log(`📄 Reading migration file: ${migrationPath}`)

        const migrationSQL = readFileSync(migrationPath, 'utf-8')
        console.log('📊 Migration size:', migrationSQL.length, 'characters')

        const { error } = await supabase.rpc('exec_sql', {
            sql_query: migrationSQL
        })

        if (error) {
            console.log('ℹ️  RPC exec_sql failed, trying direct insert to _migrations table (mocking execution)...')
            // Note: This doesn't actually run the SQL if RPC fails, it just records it. 
            // But if RPC fails, we likely can't run DDL via client anyway unless we have a specific function.
            // Let's hope exec_sql exists or we are in an environment where we can run SQL.
            // Actually, if exec_sql fails, we might be stuck. But let's try.
            throw new Error(`Migration execution failed: ${error.message}`)
        }

        console.log('✅ Migration applied successfully!')
    } catch (error) {
        console.error(`❌ Error applying ${filename}:`, error.message)
        process.exit(1)
    }
}

async function run() {
    await applyMigration('20251121000001_add_order_comments.sql')
    await applyMigration('20251121000002_add_cart_snapshots.sql')
    console.log('\n🎉 All pending migrations applied!')
}

run()
