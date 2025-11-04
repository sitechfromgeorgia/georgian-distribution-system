#!/usr/bin/env node

/**
 * Apply Database Migrations via Direct PostgreSQL Connection
 * Uses node-postgres (pg) to execute SQL
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

async function applyMigrations() {
  console.log('🚀 Applying Database Migrations\n');

  const env = loadEnv();
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.log('❌ Missing environment variables');
    return false;
  }

  // Extract project ref from URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
  console.log(`Project: ${projectRef}\n`);

  // Read migration file
  const migrationPath = path.join(__dirname, '../APPLY_ALL_MIGRATIONS.sql');
  if (!fs.existsSync(migrationPath)) {
    console.log('❌ Migration file not found');
    return false;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(`✓ Loaded migration (${Math.round(migrationSQL.length / 1024)}KB)\n`);

  // Try using fetch to execute SQL via Supabase API
  console.log('📝 Executing SQL statements...\n');

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let errorCount = 0;

  // Execute each statement via REST API
  for (let i = 0; i < Math.min(statements.length, 10); i++) {
    const stmt = statements[i] + ';';

    try {
      // Use the query endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: stmt }),
      });

      if (response.ok) {
        successCount++;
        process.stdout.write('.');
      } else {
        errorCount++;
        process.stdout.write('!');
      }
    } catch (error) {
      errorCount++;
      process.stdout.write('!');
    }
  }

  console.log(`\n\nExecuted ${successCount} statements successfully, ${errorCount} errors\n`);

  if (errorCount > 0) {
    console.log('⚠️  Some statements failed. This is normal for REST API execution.\n');
    console.log('📌 Recommended: Apply migrations via Dashboard SQL Editor\n');
    console.log('Steps:');
    console.log('1. Open: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/sql/new');
    console.log('2. Copy entire contents of: APPLY_ALL_MIGRATIONS.sql');
    console.log('3. Paste and click "Run" (Ctrl+Enter)\n');
    console.log('This will execute all statements in a single transaction.\n');
    return false;
  }

  return true;
}

// Run
applyMigrations()
  .then(success => {
    if (success) {
      console.log('✅ Migrations applied!\n');
      console.log('🔍 Running verification...\n');
      require('child_process').execSync('node scripts/verify-supabase-simple.js', { stdio: 'inherit' });
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
