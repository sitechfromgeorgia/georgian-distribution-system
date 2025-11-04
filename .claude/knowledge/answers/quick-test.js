#!/usr/bin/env node

/**
 * Quick Supabase Connection Test
 * 
 * Minimal script to quickly test if Supabase connection works.
 * Requires: Node.js 18+ (built-in fetch)
 * 
 * Usage:
 *   node quick-test.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://akxmacfsltzhbnunoepb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

async function quickTest() {
  console.log('🔍 Quick Supabase Connection Test\n');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : '(not set)'}\n`);

  // Test 1: Environment variables
  if (!SUPABASE_URL) {
    console.log('❌ SUPABASE_URL is not set');
    return false;
  }
  if (!SUPABASE_ANON_KEY) {
    console.log('❌ SUPABASE_ANON_KEY is not set');
    return false;
  }
  console.log('✓ Environment variables set');

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
    } else {
      console.log(`⚠️  Table access: ${testResponse.status}`);
    }

    console.log('\n✅ CONNECTION SUCCESSFUL!');
    console.log('Your Supabase connection is working correctly.\n');
    return true;

  } catch (error) {
    console.log(`\n❌ CONNECTION FAILED: ${error.message}`);
    
    if (error.message.includes('fetch')) {
      console.log('   → Check your internet connection');
      console.log('   → Verify the Supabase URL is correct');
    }
    return false;
  }
}

// Run test
quickTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
