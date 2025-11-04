#!/usr/bin/env node

/**
 * Quick Supabase Connection Test
 * Loads credentials from ../frontend/.env.local automatically
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
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function quickTest() {
  console.log('🔍 Quick Supabase Connection Test\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : '(not set)'}\n`);

  // Test 1: Environment variables
  if (!SUPABASE_URL) {
    console.log('❌ SUPABASE_URL is not set in frontend/.env.local');
    return false;
  }
  if (!SUPABASE_ANON_KEY) {
    console.log('❌ SUPABASE_ANON_KEY is not set in frontend/.env.local');
    return false;
  }
  console.log('✓ Environment variables loaded from frontend/.env.local');

  // Test 2: API health check
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    console.log(`✓ API Response: ${response.status} ${response.statusText}`);

    // Diagnose issues
    if (response.status === 401) {
      console.log('\n❌ ISSUE: Invalid API key (401)');
      console.log('   → Copy the correct anon key from: Dashboard → Settings → API');
      console.log('   → Make sure you copied the entire key');
      console.log('   → Dashboard link: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/settings/api');
      return false;
    }

    if (response.status === 540) {
      console.log('\n❌ ISSUE: Project is paused (540)');
      console.log('   → Go to Supabase Dashboard');
      console.log('   → Click "Restore Project"');
      console.log('   → Check billing status');
      return false;
    }

    if (!response.ok) {
      console.log(`\n⚠️  WARNING: Unexpected status ${response.status}`);
      const text = await response.text();
      console.log('   Response:', text.substring(0, 200));
      return false;
    }

    // Test 3: Try to read a table
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=count&limit=0`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact',
      },
    });

    if (testResponse.status === 200) {
      const range = testResponse.headers.get('content-range');
      const count = range ? range.split('/')[1] : '?';
      console.log(`✓ Table access works (profiles: ${count} rows)`);
    } else if (testResponse.status === 404) {
      console.log('⚠️  Table "profiles" not found (might not exist yet)');
    } else if (testResponse.status === 401) {
      console.log('⚠️  Table access blocked (RLS or invalid key)');
    } else {
      console.log(`⚠️  Table access: ${testResponse.status}`);
    }

    console.log('\n✅ CONNECTION SUCCESSFUL!');
    console.log('Your Supabase connection is working correctly.\n');
    return true;

  } catch (error) {
    console.log(`\n❌ CONNECTION FAILED: ${error.message}`);

    if (error.message.includes('fetch') || error.message.includes('ENOTFOUND')) {
      console.log('   → Check your internet connection');
      console.log('   → Verify the Supabase URL is correct');
      console.log('   → Check if Supabase is down: https://status.supabase.com');
    }
    return false;
  }
}

// Run test
quickTest()
  .then(success => {
    if (success) {
      console.log('Next steps:');
      console.log('  - Your Supabase connection is working!');
      console.log('  - You can now run: npm run dev');
      console.log('  - Visit: http://localhost:3000');
    } else {
      console.log('\nTroubleshooting guides:');
      console.log('  - See: .claude/knowledge/answers/06-troubleshooting-invalid-api-key.md');
      console.log('  - Dashboard: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
