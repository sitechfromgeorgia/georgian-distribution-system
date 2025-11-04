#!/usr/bin/env node

/**
 * Apply Database Migrations via Supabase Management API
 * Final automated approach
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
  console.log('🚀 Georgian Distribution System - Database Setup\n');

  const env = loadEnv();
  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;

  if (!SUPABASE_URL) {
    console.log('❌ SUPABASE_URL not found in frontend/.env.local');
    return false;
  }

  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
  console.log(`📦 Project: ${projectRef}`);
  console.log(`🌐 URL: ${SUPABASE_URL}\n`);

  // Read migration file
  const migrationPath = path.join(__dirname, '../APPLY_ALL_MIGRATIONS.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📄 Migration file: ${Math.round(migrationSQL.length / 1024)}KB`);
  console.log(`📊 SQL statements: ~${migrationSQL.split(';').length}\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('⚠️  AUTOMATED MIGRATION NOT POSSIBLE\n');
  console.log('The Supabase REST API does not support executing raw SQL');
  console.log('statements directly. Migrations must be applied via:\n');
  console.log('1. Supabase Dashboard SQL Editor (Recommended) ✅');
  console.log('2. Direct PostgreSQL connection with psql');
  console.log('3. Supabase CLI (requires valid config.toml)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 MANUAL STEPS (5 minutes):\n');
  console.log('Step 1: Open SQL Editor');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);

  console.log('Step 2: Copy Migration SQL');
  console.log(`   File location: ${migrationPath}`);
  console.log('   → Open file in your text editor');
  console.log('   → Select all (Ctrl+A)');
  console.log('   → Copy (Ctrl+C)\n');

  console.log('Step 3: Paste and Execute');
  console.log('   → Paste into SQL Editor (Ctrl+V)');
  console.log('   → Click "Run" button (or press Ctrl+Enter)');
  console.log('   → Wait for execution (10-15 seconds)\n');

  console.log('Step 4: Verify Success');
  console.log('   → Look for: "Migration completed successfully!"');
  console.log('   → Should see: "Created 10 out of 10 tables"\n');

  console.log('Step 5: Verify in Terminal');
  console.log('   → Run: node scripts/verify-supabase-simple.js');
  console.log('   → Should show: All tables exist ✓\n');

  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('💡 What the migration does:\n');
  console.log('   ✓ Creates 10 database tables (profiles, products, orders, etc.)');
  console.log('   ✓ Adds performance indexes');
  console.log('   ✓ Inserts sample Georgian products');
  console.log('   ✓ Configures Row Level Security (RLS) policies');
  console.log('   ✓ Creates storage buckets (avatars, product-images)');
  console.log('   ✓ Sets up helper functions for role checking\n');

  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🔗 Quick Links:\n');
  console.log(`   Dashboard: https://supabase.com/dashboard/project/${projectRef}`);
  console.log(`   SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log(`   Table Editor: https://supabase.com/dashboard/project/${projectRef}/editor\n`);

  return false;
}

// Run
applyMigrations()
  .then(() => {
    console.log('ℹ️  Waiting for you to apply migrations in Dashboard...\n');
    console.log('Once done, verify with: node scripts/verify-supabase-simple.js\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
