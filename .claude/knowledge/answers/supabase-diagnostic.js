#!/usr/bin/env node

/**
 * Supabase Connection Diagnostic Tool (2025)
 * 
 * Tests Supabase connection and diagnoses common issues:
 * - Invalid/expired API keys
 * - Paused project
 * - RLS policies blocking access
 * - Network connectivity
 * 
 * Requirements: Node.js 18+ (uses built-in fetch)
 * 
 * Usage:
 *   node supabase-diagnostic.js
 * 
 * Or with environment variables:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_ANON_KEY=eyJ... \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node supabase-diagnostic.js
 */

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // Your Supabase project details
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://akxmacfsltzhbnunoepb.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Tables to check
  TABLES_TO_CHECK: ['profiles', 'products', 'orders'],
  
  // Test timeouts
  REQUEST_TIMEOUT: 10000, // 10 seconds
};

// ============================================
// Utilities
// ============================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printSection(title) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(title, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan'));
}

function printTest(name, status, details = '') {
  const symbols = {
    pass: colorize('✓', 'green'),
    fail: colorize('✗', 'red'),
    warn: colorize('⚠', 'yellow'),
    info: colorize('ℹ', 'blue'),
  };
  
  const symbol = symbols[status] || symbols.info;
  console.log(`${symbol} ${name}${details ? ': ' + details : ''}`);
}

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload;
  } catch (error) {
    return null;
  }
}

async function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// ============================================
// Diagnostic Tests
// ============================================

class SupabaseDiagnostic {
  constructor(config) {
    this.config = config;
    this.results = {
      overall: 'unknown',
      tests: [],
      issues: [],
      recommendations: [],
    };
  }

  async run() {
    printSection('Supabase Connection Diagnostic Tool');
    console.log(`Project URL: ${this.config.SUPABASE_URL}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    // Run all diagnostic tests
    await this.testEnvironmentVariables();
    await this.testProjectReachability();
    await this.testAnonKey();
    await this.testServiceRoleKey();
    await this.testTablesExist();
    await this.testRLSPolicies();
    
    // Generate summary
    this.printSummary();
    
    // Exit with appropriate code
    process.exit(this.results.overall === 'fail' ? 1 : 0);
  }

  addTest(name, passed, details = '') {
    const status = passed ? 'pass' : 'fail';
    this.results.tests.push({ name, status, details });
    printTest(name, status, details);
    
    if (!passed && this.results.overall !== 'fail') {
      this.results.overall = 'fail';
    }
  }

  addIssue(issue) {
    this.results.issues.push(issue);
  }

  addRecommendation(recommendation) {
    this.results.recommendations.push(recommendation);
  }

  // Test 1: Environment Variables
  async testEnvironmentVariables() {
    printSection('Test 1: Environment Variables');
    
    // Check URL
    const hasUrl = Boolean(this.config.SUPABASE_URL);
    this.addTest('SUPABASE_URL is set', hasUrl);
    
    if (hasUrl) {
      const isValidUrl = this.config.SUPABASE_URL.startsWith('https://') &&
                         this.config.SUPABASE_URL.includes('.supabase.co');
      this.addTest('SUPABASE_URL format is valid', isValidUrl);
      
      if (!isValidUrl) {
        this.addIssue('Invalid Supabase URL format');
        this.addRecommendation('URL should be: https://YOUR_PROJECT.supabase.co');
      }
    }
    
    // Check anon key
    const hasAnonKey = Boolean(this.config.SUPABASE_ANON_KEY);
    this.addTest('SUPABASE_ANON_KEY is set', hasAnonKey);
    
    if (hasAnonKey) {
      const isJWT = this.config.SUPABASE_ANON_KEY.startsWith('eyJ');
      const isNewKey = this.config.SUPABASE_ANON_KEY.startsWith('sb_publishable_');
      const validFormat = isJWT || isNewKey;
      
      this.addTest('SUPABASE_ANON_KEY format is valid', validFormat, 
        isJWT ? 'Legacy JWT' : isNewKey ? 'New publishable key' : 'Unknown format');
      
      if (isJWT) {
        const decoded = decodeJWT(this.config.SUPABASE_ANON_KEY);
        if (decoded) {
          const hasRole = decoded.role === 'anon';
          this.addTest('Anon key has correct role', hasRole, decoded.role || 'no role');
          
          if (decoded.exp) {
            const expiresAt = new Date(decoded.exp * 1000);
            const isExpired = expiresAt < new Date();
            this.addTest('Anon key is not expired', !isExpired, 
              `Expires: ${expiresAt.toISOString()}`);
            
            if (isExpired) {
              this.addIssue('Anon key is expired');
              this.addRecommendation('Generate new keys from Supabase Dashboard → Settings → API');
            }
          }
        }
      }
    } else {
      this.addIssue('Missing SUPABASE_ANON_KEY');
      this.addRecommendation('Add SUPABASE_ANON_KEY to environment variables');
    }
    
    // Check service role key
    const hasServiceKey = Boolean(this.config.SUPABASE_SERVICE_ROLE_KEY);
    this.addTest('SUPABASE_SERVICE_ROLE_KEY is set', hasServiceKey, 
      hasServiceKey ? '(optional)' : 'not required for basic testing');
    
    if (hasServiceKey) {
      const isJWT = this.config.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ');
      const isNewKey = this.config.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_');
      const validFormat = isJWT || isNewKey;
      
      this.addTest('SUPABASE_SERVICE_ROLE_KEY format is valid', validFormat,
        isJWT ? 'Legacy JWT' : isNewKey ? 'New secret key' : 'Unknown format');
    }
  }

  // Test 2: Project Reachability
  async testProjectReachability() {
    printSection('Test 2: Project Reachability');
    
    try {
      const response = await fetchWithTimeout(
        this.config.SUPABASE_URL,
        { method: 'GET' },
        CONFIG.REQUEST_TIMEOUT
      );
      
      this.addTest('Project URL is reachable', response.ok, 
        `Status: ${response.status}`);
      
      if (response.status === 540) {
        this.addIssue('Project is paused (Status 540)');
        this.addRecommendation('Restore project from Supabase Dashboard');
        return;
      }
      
      if (!response.ok) {
        this.addIssue(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      this.addTest('Project URL is reachable', false, error.message);
      this.addIssue(`Network error: ${error.message}`);
      
      if (error.message.includes('timeout')) {
        this.addRecommendation('Check internet connection and firewall settings');
      }
    }
  }

  // Test 3: Anon Key Authentication
  async testAnonKey() {
    printSection('Test 3: Anon Key Authentication');
    
    if (!this.config.SUPABASE_ANON_KEY) {
      printTest('Anon key test', 'warn', 'Skipped (no key provided)');
      return;
    }
    
    try {
      const response = await fetchWithTimeout(
        `${this.config.SUPABASE_URL}/rest/v1/`,
        {
          method: 'GET',
          headers: {
            'apikey': this.config.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${this.config.SUPABASE_ANON_KEY}`,
          },
        },
        CONFIG.REQUEST_TIMEOUT
      );
      
      const body = await response.text();
      
      if (response.status === 401) {
        this.addTest('Anon key is valid', false, 'Status 401: Invalid API key');
        this.addIssue('Anon key is invalid or expired');
        this.addRecommendation('Copy the correct anon key from Dashboard → Settings → API');
        
        if (body.includes('Invalid API key')) {
          this.addRecommendation('Verify you copied the entire key without spaces');
        }
        return;
      }
      
      if (response.status === 540) {
        this.addTest('Anon key is valid', false, 'Status 540: Project paused');
        this.addIssue('Project is paused');
        this.addRecommendation('Check billing status and restore project');
        return;
      }
      
      this.addTest('Anon key is valid', response.ok, 
        `Status: ${response.status}`);
      
    } catch (error) {
      this.addTest('Anon key is valid', false, error.message);
      this.addIssue(`Anon key test failed: ${error.message}`);
    }
  }

  // Test 4: Service Role Key Authentication
  async testServiceRoleKey() {
    printSection('Test 4: Service Role Key Authentication');
    
    if (!this.config.SUPABASE_SERVICE_ROLE_KEY) {
      printTest('Service role key test', 'warn', 'Skipped (no key provided)');
      return;
    }
    
    try {
      const response = await fetchWithTimeout(
        `${this.config.SUPABASE_URL}/rest/v1/`,
        {
          method: 'GET',
          headers: {
            'apikey': this.config.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${this.config.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        },
        CONFIG.REQUEST_TIMEOUT
      );
      
      if (response.status === 401) {
        this.addTest('Service role key is valid', false, 'Status 401: Invalid API key');
        this.addIssue('Service role key is invalid or expired');
        this.addRecommendation('Copy the correct service_role key from Dashboard');
        return;
      }
      
      this.addTest('Service role key is valid', response.ok, 
        `Status: ${response.status}`);
      
      if (response.ok) {
        printTest('Service role key has admin access', 'info', 
          'Can bypass RLS policies');
      }
      
    } catch (error) {
      this.addTest('Service role key is valid', false, error.message);
      this.addIssue(`Service role key test failed: ${error.message}`);
    }
  }

  // Test 5: Check if Tables Exist
  async testTablesExist() {
    printSection('Test 5: Table Accessibility');
    
    if (!this.config.SUPABASE_ANON_KEY) {
      printTest('Table checks', 'warn', 'Skipped (no anon key)');
      return;
    }
    
    for (const table of this.config.TABLES_TO_CHECK) {
      try {
        const response = await fetchWithTimeout(
          `${this.config.SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
          {
            method: 'GET',
            headers: {
              'apikey': this.config.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${this.config.SUPABASE_ANON_KEY}`,
            },
          },
          CONFIG.REQUEST_TIMEOUT
        );
        
        const body = await response.text();
        let jsonBody;
        try {
          jsonBody = JSON.parse(body);
        } catch {
          jsonBody = {};
        }
        
        if (response.status === 404 || body.includes('not found')) {
          this.addTest(`Table '${table}' exists`, false, 'Table not found');
          this.addRecommendation(`Create table '${table}' or check table name spelling`);
        } else if (response.status === 401) {
          this.addTest(`Table '${table}' exists`, false, 'Unauthorized');
        } else if (response.status === 200) {
          this.addTest(`Table '${table}' exists`, true, 
            `Found (${Array.isArray(jsonBody) ? jsonBody.length : 0} rows visible)`);
        } else if (response.status === 406 && body.includes('permission denied')) {
          this.addTest(`Table '${table}' exists`, true, 
            'Exists but RLS blocks access');
        } else {
          this.addTest(`Table '${table}' exists`, 'warn', 
            `Uncertain (Status ${response.status})`);
        }
        
      } catch (error) {
        this.addTest(`Table '${table}' exists`, false, error.message);
      }
    }
  }

  // Test 6: RLS Policy Check
  async testRLSPolicies() {
    printSection('Test 6: Row Level Security (RLS) Analysis');
    
    if (!this.config.SUPABASE_ANON_KEY || !this.config.SUPABASE_SERVICE_ROLE_KEY) {
      printTest('RLS comparison test', 'warn', 
        'Skipped (need both keys for comparison)');
      return;
    }
    
    // Test with anon key (respects RLS)
    const anonResults = {};
    for (const table of this.config.TABLES_TO_CHECK) {
      try {
        const response = await fetchWithTimeout(
          `${this.config.SUPABASE_URL}/rest/v1/${table}?select=count`,
          {
            method: 'GET',
            headers: {
              'apikey': this.config.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${this.config.SUPABASE_ANON_KEY}`,
              'Prefer': 'count=exact',
            },
          },
          CONFIG.REQUEST_TIMEOUT
        );
        
        const contentRange = response.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        anonResults[table] = { status: response.status, count };
      } catch (error) {
        anonResults[table] = { status: 'error', count: 0 };
      }
    }
    
    // Test with service role (bypasses RLS)
    const serviceResults = {};
    for (const table of this.config.TABLES_TO_CHECK) {
      try {
        const response = await fetchWithTimeout(
          `${this.config.SUPABASE_URL}/rest/v1/${table}?select=count`,
          {
            method: 'GET',
            headers: {
              'apikey': this.config.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${this.config.SUPABASE_SERVICE_ROLE_KEY}`,
              'Prefer': 'count=exact',
            },
          },
          CONFIG.REQUEST_TIMEOUT
        );
        
        const contentRange = response.headers.get('content-range');
        const count = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
        serviceResults[table] = { status: response.status, count };
      } catch (error) {
        serviceResults[table] = { status: 'error', count: 0 };
      }
    }
    
    // Compare results
    console.log('\nRLS Impact Analysis:');
    console.log(colorize('─'.repeat(60), 'cyan'));
    console.log(`${colorize('Table', 'bright').padEnd(30)} ${'Anon'.padEnd(15)} Service Role`);
    console.log(colorize('─'.repeat(60), 'cyan'));
    
    for (const table of this.config.TABLES_TO_CHECK) {
      const anonCount = anonResults[table]?.count || 0;
      const serviceCount = serviceResults[table]?.count || 0;
      
      const rlsBlocking = anonCount === 0 && serviceCount > 0;
      const status = rlsBlocking ? colorize('⚠ RLS Blocking', 'yellow') : 
                     anonCount > 0 ? colorize('✓ Access OK', 'green') : 
                     colorize('✗ No Data', 'red');
      
      console.log(`${table.padEnd(30)} ${String(anonCount).padEnd(15)} ${serviceCount}`);
      
      if (rlsBlocking) {
        this.addIssue(`RLS is blocking access to '${table}' table`);
        this.addRecommendation(`Review RLS policies for '${table}' table`);
      }
    }
    
    console.log(colorize('─'.repeat(60), 'cyan'));
    console.log('\nNote: 0 rows could mean either empty table or RLS blocking access\n');
  }

  // Summary Report
  printSummary() {
    printSection('Diagnostic Summary');
    
    const passed = this.results.tests.filter(t => t.status === 'pass').length;
    const failed = this.results.tests.filter(t => t.status === 'fail').length;
    const total = this.results.tests.length;
    
    console.log(`\nTests: ${colorize(passed, 'green')} passed, ${colorize(failed, 'red')} failed, ${total} total`);
    
    if (this.results.issues.length > 0) {
      console.log(`\n${colorize('Issues Found:', 'red')}`);
      this.results.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n${colorize('Recommendations:', 'yellow')}`);
      this.results.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    if (failed === 0) {
      console.log(`\n${colorize('✓ All tests passed! Your Supabase connection is working correctly.', 'green')}`);
    } else {
      console.log(`\n${colorize('✗ Some tests failed. Review the issues and recommendations above.', 'red')}`);
    }
    
    // Common diagnostics
    console.log(`\n${colorize('Common Issues Quick Reference:', 'cyan')}`);
    console.log('  • 401 Invalid API key → Copy fresh keys from Dashboard');
    console.log('  • 540 Project paused → Restore project or check billing');
    console.log('  • 0 rows with anon key → RLS policy blocking access');
    console.log('  • Table not found → Check table name spelling in database');
    console.log('  • Timeout errors → Check network/firewall settings');
    
    console.log(`\n${colorize('Next Steps:', 'cyan')}`);
    console.log('  1. Fix any failed tests from highest to lowest priority');
    console.log('  2. Copy fresh API keys from: Dashboard → Settings → API');
    console.log('  3. Check project status: Dashboard → Your Project');
    console.log('  4. Review RLS policies: Dashboard → Authentication → Policies');
    console.log('  5. Monitor logs: Dashboard → Logs → API\n');
  }
}

// ============================================
// Main Execution
// ============================================

async function main() {
  // Check Node.js version
  const nodeVersion = process.versions.node.split('.')[0];
  if (parseInt(nodeVersion) < 18) {
    console.error(colorize('Error: Node.js 18 or higher required (for built-in fetch)', 'red'));
    console.error('Your version:', process.version);
    process.exit(1);
  }
  
  // Run diagnostic
  const diagnostic = new SupabaseDiagnostic(CONFIG);
  await diagnostic.run();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(colorize('\nFatal Error:', 'red'), error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { SupabaseDiagnostic };
