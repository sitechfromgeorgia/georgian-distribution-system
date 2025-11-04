#!/usr/bin/env node

/**
 * Supabase Configuration Verification Script (Simplified)
 * Uses REST API directly without dependencies
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Load .env.local file manually
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
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

function addResult(category, name, status, message, details = null) {
  results.checks.push({ category, name, status, message, details });
  if (status === 'passed') results.passed++;
  else if (status === 'failed') results.failed++;
  else if (status === 'warning') results.warnings++;
}

async function makeSupabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: !response.ok ? data : null,
    };
  } catch (error) {
    return {
      ok: false,
      error: { message: error.message },
    };
  }
}

async function verifyEnvironmentVariables() {
  log.section('📋 Phase 1: Environment Variables Verification');

  if (SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
    log.success(`Supabase URL: ${SUPABASE_URL}`);
    addResult('Environment', 'Supabase URL', 'passed', 'URL is configured correctly');
  } else {
    log.error('Supabase URL is missing or invalid');
    addResult('Environment', 'Supabase URL', 'failed', 'URL is missing or invalid');
    return false;
  }

  if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ')) {
    log.success('Supabase Anon Key configured');
    addResult('Environment', 'Anon Key', 'passed', 'Anon key is configured');
  } else {
    log.error('Supabase Anon Key is missing or invalid');
    addResult('Environment', 'Anon Key', 'failed', 'Anon key is missing or invalid');
    return false;
  }

  if (SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
    log.success('Supabase Service Role Key configured');
    addResult('Environment', 'Service Role Key', 'passed', 'Service role key is configured');
  } else {
    log.warn('Supabase Service Role Key is missing');
    addResult('Environment', 'Service Role Key', 'warning', 'Service role key is missing (optional)');
  }

  // Extract project ref
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectRef) {
    log.info(`Project Reference: ${colors.bright}${projectRef}${colors.reset}`);
    addResult('Environment', 'Project Ref', 'passed', `Project ref: ${projectRef}`, { projectRef });
  }

  return true;
}

async function verifyConnection() {
  log.section('🔌 Phase 2: Supabase Cloud Connection Test');

  try {
    // Test with profiles table
    const result = await makeSupabaseRequest('profiles?select=id&limit=1');

    if (result.ok) {
      log.success('Successfully connected to Supabase Cloud');
      addResult('Connection', 'Database Access', 'passed', 'Connection successful');
      return true;
    } else if (result.status === 404 || result.error?.code === 'PGRST116') {
      log.warn('Connected but "profiles" table not found');
      addResult('Connection', 'Database Access', 'warning', 'Connected but table not found');
      return true;
    } else {
      log.error(`Connection failed: ${result.error?.message || 'Unknown error'}`);
      addResult('Connection', 'Database Access', 'failed', result.error?.message || 'Unknown error');
      return false;
    }
  } catch (err) {
    log.error(`Connection error: ${err.message}`);
    addResult('Connection', 'Database Access', 'failed', err.message);
    return false;
  }
}

async function verifyDatabaseTables() {
  log.section('🗄️  Phase 3: Database Tables Verification');

  const expectedTables = [
    'profiles',
    'products',
    'orders',
    'order_items',
    'order_status_history',
    'order_audit_logs',
    'deliveries',
    'notifications',
    'demo_sessions',
    'policy_audit_log',
  ];

  let foundTables = [];
  let missingTables = [];

  for (const table of expectedTables) {
    const result = await makeSupabaseRequest(`${table}?select=*&limit=0`, {
      headers: { 'Prefer': 'count=exact' }
    });

    if (result.ok) {
      log.success(`Table "${table}" exists`);
      foundTables.push(table);
      addResult('Database', `Table: ${table}`, 'passed', 'Table exists');
    } else if (result.status === 404 || result.error?.code === 'PGRST116') {
      log.error(`Table "${table}" not found`);
      missingTables.push(table);
      addResult('Database', `Table: ${table}`, 'failed', 'Table does not exist');
    } else {
      log.warn(`Table "${table}" check failed: ${result.error?.message || 'Unknown error'}`);
      addResult('Database', `Table: ${table}`, 'warning', result.error?.message || 'Unknown error');
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log.info(`\nFound ${foundTables.length}/${expectedTables.length} tables`);
  if (missingTables.length > 0) {
    log.warn(`Missing tables: ${missingTables.join(', ')}`);
  }

  return missingTables.length === 0;
}

async function verifyTypeDefinitions() {
  log.section('📝 Phase 4: TypeScript Type Definitions');

  const typesPath = path.join(__dirname, '../frontend/src/types/database.ts');

  try {
    if (fs.existsSync(typesPath)) {
      const content = fs.readFileSync(typesPath, 'utf8');
      const lines = content.split('\n').length;
      log.success(`Type definitions file exists (${lines} lines)`);
      addResult('Types', 'database.ts', 'passed', `File exists with ${lines} lines`);

      // Check for key type definitions
      const hasProfiles = content.includes('profiles');
      const hasProducts = content.includes('products');
      const hasOrders = content.includes('orders');

      if (hasProfiles && hasProducts && hasOrders) {
        log.success('Core table types are defined');
        addResult('Types', 'Core Types', 'passed', 'All core types defined');
      } else {
        log.warn('Some core types may be missing');
        addResult('Types', 'Core Types', 'warning', 'Some types may be missing');
      }
    } else {
      log.error('Type definitions file not found');
      addResult('Types', 'database.ts', 'failed', 'File not found');
    }
  } catch (err) {
    log.error(`Error reading types: ${err.message}`);
    addResult('Types', 'Type Definitions', 'failed', err.message);
  }
}

async function verifyMigrationFiles() {
  log.section('📜 Phase 5: Migration Files Check');

  const migrationsDir = path.join(__dirname, '../supabase/migrations');

  try {
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      log.success(`Found ${files.length} migration files`);
      addResult('Migrations', 'Migration Files', 'passed', `${files.length} migration files found`);

      files.forEach(file => {
        log.info(`  - ${file}`);
      });

      const expectedMigrations = [
        '20251102_initial_schema.sql',
        '20251103_seed_data.sql',
        '20251104_rls_policies.sql',
        '20251105_storage_buckets.sql',
      ];

      const missingMigrations = expectedMigrations.filter(m => !files.includes(m));
      if (missingMigrations.length > 0) {
        log.warn(`Missing expected migrations: ${missingMigrations.join(', ')}`);
        addResult('Migrations', 'Expected Migrations', 'warning', `Missing: ${missingMigrations.join(', ')}`);
      } else {
        log.success('All expected migrations present');
        addResult('Migrations', 'Expected Migrations', 'passed', 'All migrations present');
      }
    } else {
      log.warn('Migrations directory not found');
      addResult('Migrations', 'Migrations Directory', 'warning', 'Directory not found');
    }
  } catch (err) {
    log.error(`Error checking migrations: ${err.message}`);
    addResult('Migrations', 'Migration Check', 'failed', err.message);
  }
}

function generateReport() {
  log.section('📊 Verification Summary');

  console.log(`${colors.bright}Results:${colors.reset}`);
  console.log(`  ${colors.green}✓ Passed:${colors.reset} ${results.passed}`);
  console.log(`  ${colors.red}✗ Failed:${colors.reset} ${results.failed}`);
  console.log(`  ${colors.yellow}⚠ Warnings:${colors.reset} ${results.warnings}`);
  console.log(`  📋 Total Checks: ${results.checks.length}\n`);

  // Group by category
  const categories = {};
  results.checks.forEach(check => {
    if (!categories[check.category]) {
      categories[check.category] = [];
    }
    categories[check.category].push(check);
  });

  console.log(`${colors.bright}Details by Category:${colors.reset}\n`);
  for (const [category, checks] of Object.entries(categories)) {
    console.log(`${colors.cyan}${category}:${colors.reset}`);
    checks.forEach(check => {
      const icon = check.status === 'passed' ? '✓' : check.status === 'failed' ? '✗' : '⚠';
      const color = check.status === 'passed' ? colors.green : check.status === 'failed' ? colors.red : colors.yellow;
      console.log(`  ${color}${icon}${colors.reset} ${check.name}: ${check.message}`);
    });
    console.log('');
  }

  // Save report to file
  const reportPath = path.join(__dirname, '../SUPABASE_VERIFICATION_REPORT.json');
  const timestamp = new Date().toISOString();
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp,
    projectRef,
    projectUrl: SUPABASE_URL,
    summary: {
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      total: results.checks.length,
    },
    checks: results.checks,
  }, null, 2));

  log.info(`Report saved to: ${reportPath}`);

  return results.failed === 0;
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║     SUPABASE CONFIGURATION VERIFICATION SCRIPT          ║
║     Georgian Distribution Management System             ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Phase 1: Environment Variables
    const envOk = await verifyEnvironmentVariables();
    if (!envOk) {
      log.error('\n❌ Environment variables verification failed. Aborting.');
      process.exit(1);
    }

    // Phase 2: Connection Test
    const connOk = await verifyConnection();
    if (!connOk) {
      log.warn('\n⚠️  Connection test failed. Continuing with other checks...');
    }

    // Phase 3: Database Tables
    await verifyDatabaseTables();

    // Phase 4: Type Definitions
    await verifyTypeDefinitions();

    // Phase 5: Migration Files
    await verifyMigrationFiles();

    // Generate final report
    const success = generateReport();

    if (success) {
      console.log(`\n${colors.green}${colors.bright}✓ All critical checks passed!${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.yellow}${colors.bright}⚠ Some checks failed. See report above.${colors.reset}\n`);
      process.exit(1);
    }
  } catch (error) {
    log.error(`\nUnexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
