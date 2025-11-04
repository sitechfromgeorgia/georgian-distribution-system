#!/usr/bin/env node

/**
 * Apply Database Migrations via Supabase CLI
 * Uses npx supabase to push migrations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

console.log('🚀 Applying Database Migrations via Supabase CLI\n');

// Copy APPLY_ALL_MIGRATIONS.sql to a migration file
const migrationDir = path.join(__dirname, '../supabase/migrations');
if (!fs.existsSync(migrationDir)) {
  fs.mkdirSync(migrationDir, { recursive: true });
  console.log('✓ Created migrations directory\n');
}

const sourceFile = path.join(__dirname, '../APPLY_ALL_MIGRATIONS.sql');
const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
const targetFile = path.join(migrationDir, `${timestamp}_apply_all.sql`);

fs.copyFileSync(sourceFile, targetFile);
console.log(`✓ Copied migration to: ${targetFile}\n`);

try {
  console.log('📝 Linking to Supabase project...\n');

  // Set environment variables for the CLI
  const cliEnv = {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Link project (skip if already linked)
  try {
    execSync('npx supabase link --project-ref akxmacfsltzhbnunoepb', {
      stdio: 'inherit',
      env: cliEnv,
    });
    console.log('✓ Project linked\n');
  } catch (error) {
    console.log('⚠️  Project link failed (may already be linked)\n');
  }

  console.log('📤 Pushing migrations to database...\n');

  // Push migrations
  execSync('npx supabase db push', {
    stdio: 'inherit',
    env: cliEnv,
  });

  console.log('\n✅ Migrations applied successfully!\n');

  // Run verification
  console.log('🔍 Verifying database setup...\n');
  execSync('node scripts/verify-supabase-simple.js', {
    stdio: 'inherit',
  });

} catch (error) {
  console.log('\n❌ CLI approach failed\n');
  console.log('Alternative: Manual Application via Dashboard');
  console.log('1. Open: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/sql/new');
  console.log('2. Copy contents of: APPLY_ALL_MIGRATIONS.sql');
  console.log('3. Paste and run in SQL Editor\n');
  process.exit(1);
}
