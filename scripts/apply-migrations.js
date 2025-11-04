#!/usr/bin/env node

/**
 * Apply All Database Migrations
 * Executes APPLY_ALL_MIGRATIONS.sql using Supabase service role key
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../frontend/.env.local');
  const env = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }

  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function applyMigrations() {
  console.log('🚀 Applying Database Migrations\n');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log('❌ Missing environment variables');
    console.log('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
    return false;
  }

  // Read migration file
  const migrationPath = path.join(__dirname, '../APPLY_ALL_MIGRATIONS.sql');
  if (!fs.existsSync(migrationPath)) {
    console.log('❌ Migration file not found:', migrationPath);
    return false;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(`✓ Loaded migration file (${migrationSQL.length} characters)\n`);

  // Split into individual statements (simple approach)
  // We'll execute the entire SQL as one transaction
  console.log('📝 Executing migration SQL...\n');

  try {
    // Use Supabase SQL endpoint (requires service role)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: migrationSQL }),
    });

    if (!response.ok) {
      // Try alternative approach: use pg-meta endpoint
      console.log('⚠️  RPC approach failed, trying direct query...\n');

      const queryResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ query: migrationSQL }),
      });

      if (!queryResponse.ok) {
        const error = await queryResponse.text();
        console.log('❌ Migration failed:', queryResponse.status, queryResponse.statusText);
        console.log('   Error:', error.substring(0, 500));
        return false;
      }
    }

    console.log('✅ Migrations applied successfully!\n');
    return true;

  } catch (error) {
    console.log('❌ Error applying migrations:', error.message);
    return false;
  }
}

// Run migrations
applyMigrations()
  .then(async (success) => {
    if (success) {
      console.log('🔍 Verifying database setup...\n');

      // Verify tables exist
      const verifyPath = path.join(__dirname, 'verify-supabase-simple.js');
      if (fs.existsSync(verifyPath)) {
        console.log('Running verification script...\n');
        const { spawn } = require('child_process');
        const verify = spawn('node', [verifyPath], { stdio: 'inherit' });
        verify.on('close', (code) => {
          process.exit(code);
        });
      } else {
        process.exit(0);
      }
    } else {
      console.log('\n❌ Migration failed. Please check the errors above.');
      console.log('\nAlternative approach:');
      console.log('1. Open: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/sql/new');
      console.log('2. Copy contents of: APPLY_ALL_MIGRATIONS.sql');
      console.log('3. Paste and run in SQL Editor\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
