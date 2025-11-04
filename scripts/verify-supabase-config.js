#!/usr/bin/env node

/**
 * Supabase Configuration Verification Script
 * Verifies that local configuration matches Supabase Cloud
 */

const { createClient } = require('@supabase/supabase-js');
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

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function verifyEnvironmentVariables() {
  log.section('📋 Phase 1: Environment Variables Verification');

  if (SUPABASE_URL && SUPABASE_URL.includes('supabase.co')) {
    log.success(`Supabase URL configured: ${SUPABASE_URL}`);
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Test connection with a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        log.warn('Table "profiles" does not exist in database');
        addResult('Connection', 'Database Access', 'warning', 'Connected but table not found', { error: error.message });
      } else {
        log.error(`Connection failed: ${error.message}`);
        addResult('Connection', 'Database Access', 'failed', error.message);
        return false;
      }
    } else {
      log.success('Successfully connected to Supabase Cloud');
      addResult('Connection', 'Database Access', 'passed', 'Connection successful');
    }

    return true;
  } catch (err) {
    log.error(`Connection error: ${err.message}`);
    addResult('Connection', 'Database Access', 'failed', err.message);
    return false;
  }
}

async function verifyDatabaseTables() {
  log.section('🗄️  Phase 3: Database Tables Verification');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

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
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          log.error(`Table "${table}" not found`);
          missingTables.push(table);
          addResult('Database', `Table: ${table}`, 'failed', 'Table does not exist');
        } else {
          log.warn(`Table "${table}" exists but query failed: ${error.message}`);
          foundTables.push(table);
          addResult('Database', `Table: ${table}`, 'warning', `Exists but: ${error.message}`);
        }
      } else {
        log.success(`Table "${table}" exists`);
        foundTables.push(table);
        addResult('Database', `Table: ${table}`, 'passed', 'Table exists');
      }
    } catch (err) {
      log.error(`Error checking table "${table}": ${err.message}`);
      addResult('Database', `Table: ${table}`, 'failed', err.message);
    }
  }

  log.info(`\nFound ${foundTables.length}/${expectedTables.length} tables`);
  if (missingTables.length > 0) {
    log.warn(`Missing tables: ${missingTables.join(', ')}`);
  }

  return missingTables.length === 0;
}

async function verifyStorageBuckets() {
  log.section('📦 Phase 4: Storage Buckets Verification');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

  const expectedBuckets = ['avatars', 'product-images'];

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      log.error(`Failed to list buckets: ${error.message}`);
      addResult('Storage', 'List Buckets', 'failed', error.message);
      return false;
    }

    const bucketNames = buckets.map(b => b.name);
    log.info(`Found buckets: ${bucketNames.join(', ') || 'none'}`);

    for (const bucket of expectedBuckets) {
      if (bucketNames.includes(bucket)) {
        log.success(`Bucket "${bucket}" exists`);
        addResult('Storage', `Bucket: ${bucket}`, 'passed', 'Bucket exists');
      } else {
        log.error(`Bucket "${bucket}" not found`);
        addResult('Storage', `Bucket: ${bucket}`, 'failed', 'Bucket does not exist');
      }
    }

    return true;
  } catch (err) {
    log.error(`Error checking storage: ${err.message}`);
    addResult('Storage', 'Storage Access', 'failed', err.message);
    return false;
  }
}

async function verifyTypeDefinitions() {
  log.section('📝 Phase 5: TypeScript Type Definitions');

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
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    projectRef: SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1],
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

    // Phase 4: Storage Buckets
    await verifyStorageBuckets();

    // Phase 5: Type Definitions
    await verifyTypeDefinitions();

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
