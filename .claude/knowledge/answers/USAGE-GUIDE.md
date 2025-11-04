# Supabase Connection Test Scripts - Usage Guide

## Overview

Two Node.js scripts to diagnose Supabase connection issues without external dependencies:
- **quick-test.js** - Fast basic connectivity test (30 seconds)
- **supabase-diagnostic.js** - Comprehensive diagnostic tool (2-3 minutes)

Both require **Node.js 18+** (uses built-in `fetch`)

---

## Quick Test Script (Recommended First)

### Usage

```bash
# Set your credentials
export SUPABASE_URL="https://akxmacfsltzhbnunoepb.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGc..."

# Run the test
node quick-test.js
```

### What It Tests
✓ Environment variables are set  
✓ API endpoint is reachable  
✓ API key is valid  
✓ Basic table access works  

### Example Output

**✅ Success:**
```
🔍 Quick Supabase Connection Test

URL: https://akxmacfsltzhbnunoepb.supabase.co
Key: eyJhbGciOiJIUzI1NiIs...

✓ Environment variables set
✓ API Response: 200 OK
✓ Table access works (profiles: 42 rows)

✅ CONNECTION SUCCESSFUL!
Your Supabase connection is working correctly.
```

**❌ Invalid Key:**
```
✓ Environment variables set
✓ API Response: 401 Unauthorized

❌ ISSUE: Invalid API key (401)
   → Copy the correct anon key from: Dashboard → Settings → API
   → Make sure you copied the entire key
```

**❌ Project Paused:**
```
✓ Environment variables set
✓ API Response: 540

❌ ISSUE: Project is paused (540)
   → Go to Supabase Dashboard
   → Click "Restore Project"
   → Check billing status
```

---

## Full Diagnostic Script (For Deep Analysis)

### Usage

```bash
# Set your credentials (including service role for full analysis)
export SUPABASE_URL="https://akxmacfsltzhbnunoepb.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGc..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Run the diagnostic
node supabase-diagnostic.js
```

### What It Tests

**Test 1: Environment Variables**
- Checks if all variables are set
- Validates key formats (JWT vs new keys)
- Decodes JWTs to check expiration
- Verifies key roles

**Test 2: Project Reachability**
- Tests if project URL is accessible
- Detects paused projects (540)
- Identifies network issues

**Test 3: Anon Key Authentication**
- Verifies anon key is valid
- Tests client-side access
- Identifies auth errors vs RLS blocks

**Test 4: Service Role Key Authentication**
- Verifies admin key is valid
- Tests server-side access
- Confirms bypass RLS capability

**Test 5: Table Accessibility**
- Tests access to: `profiles`, `products`, `orders`
- Identifies missing tables
- Detects RLS blocking

**Test 6: RLS Policy Analysis**
- Compares anon vs service role access
- Shows which tables RLS is blocking
- Provides visibility comparison

### Example Output

```
============================================================
Supabase Connection Diagnostic Tool
============================================================
Project URL: https://akxmacfsltzhbnunoepb.supabase.co
Timestamp: 2025-11-03T14:30:00.000Z

============================================================
Test 1: Environment Variables
============================================================
✓ SUPABASE_URL is set
✓ SUPABASE_URL format is valid
✓ SUPABASE_ANON_KEY is set
✓ SUPABASE_ANON_KEY format is valid: Legacy JWT
✓ Anon key has correct role: anon
✓ Anon key is not expired: Expires: 2035-01-01T00:00:00.000Z
✓ SUPABASE_SERVICE_ROLE_KEY is set: (optional)
✓ SUPABASE_SERVICE_ROLE_KEY format is valid: Legacy JWT

============================================================
Test 2: Project Reachability
============================================================
✓ Project URL is reachable: Status: 200

============================================================
Test 3: Anon Key Authentication
============================================================
✓ Anon key is valid: Status: 200

============================================================
Test 4: Service Role Key Authentication
============================================================
✓ Service role key is valid: Status: 200
ℹ Service role key has admin access: Can bypass RLS policies

============================================================
Test 5: Table Accessibility
============================================================
✓ Table 'profiles' exists: Found (25 rows visible)
✓ Table 'products' exists: Found (0 rows visible)
✗ Table 'orders' exists: Table not found

============================================================
Test 6: Row Level Security (RLS) Analysis
============================================================

RLS Impact Analysis:
────────────────────────────────────────────────────────────
Table                          Anon            Service Role
────────────────────────────────────────────────────────────
profiles                       25              25
products                       0               150
orders                         0               0
────────────────────────────────────────────────────────────

Note: 0 rows could mean either empty table or RLS blocking access

============================================================
Diagnostic Summary
============================================================

Tests: 14 passed, 1 failed, 15 total

Issues Found:
  1. Table 'orders' not found

Recommendations:
  1. Create table 'orders' or check table name spelling
  2. RLS is blocking access to 'products' table
  3. Review RLS policies for 'products' table

Common Issues Quick Reference:
  • 401 Invalid API key → Copy fresh keys from Dashboard
  • 540 Project paused → Restore project or check billing
  • 0 rows with anon key → RLS policy blocking access
  • Table not found → Check table name spelling in database
  • Timeout errors → Check network/firewall settings

Next Steps:
  1. Fix any failed tests from highest to lowest priority
  2. Copy fresh API keys from: Dashboard → Settings → API
  3. Check project status: Dashboard → Your Project
  4. Review RLS policies: Dashboard → Authentication → Policies
  5. Monitor logs: Dashboard → Logs → API
```

---

## Configuration

### Method 1: Environment Variables (Recommended)

```bash
# Linux/Mac
export SUPABASE_URL="https://akxmacfsltzhbnunoepb.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Windows (PowerShell)
$env:SUPABASE_URL="https://akxmacfsltzhbnunoepb.supabase.co"
$env:SUPABASE_ANON_KEY="eyJ..."
$env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Windows (CMD)
set SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
set SUPABASE_ANON_KEY=eyJ...
set SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Method 2: Edit Script Directly

Edit the CONFIG section at the top of the script:

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://akxmacfsltzhbnunoepb.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ...',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJ...',
  // ...
};
```

### Method 3: One-Line Execution

```bash
SUPABASE_URL="https://xxx.supabase.co" \
SUPABASE_ANON_KEY="eyJ..." \
node quick-test.js
```

---

## Customizing Table Checks

Edit the `TABLES_TO_CHECK` array in `supabase-diagnostic.js`:

```javascript
const CONFIG = {
  // ... other config
  TABLES_TO_CHECK: ['profiles', 'products', 'orders', 'custom_table'],
};
```

---

## Common Issues Diagnosed

### ❌ Issue: Invalid API Key (401)

**Diagnosis:**
```
✗ Anon key is valid: Status 401: Invalid API key
```

**Causes:**
- Key is expired (legacy JWT)
- Key was regenerated/rotated
- Wrong project keys used
- Key copied incorrectly (spaces, truncation)

**Solution:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the **anon** key (or **publishable** key for new format)
3. Ensure entire key is copied (200+ characters)
4. Update environment variables
5. Restart script

---

### ⚠️ Issue: Project Paused (540)

**Diagnosis:**
```
✗ Project URL is reachable: Status 540
```

**Causes:**
- Inactivity (Free Plan: 7+ days no activity)
- Billing issues (overdue invoices)
- Manual pause by owner

**Solution:**
1. Login to Supabase Dashboard
2. Select your project
3. Click **Restore Project** button
4. Check billing status if auto-pause persists
5. Wait 2-5 minutes for restoration

---

### ⚠️ Issue: RLS Blocking Access

**Diagnosis:**
```
RLS Impact Analysis:
products: Anon=0, Service Role=150

Issues Found:
  RLS is blocking access to 'products' table
```

**Explanation:**
- Service role sees 150 rows (bypasses RLS)
- Anon key sees 0 rows (RLS blocking)
- This is NOT an invalid key issue!

**Solution:**
1. Dashboard → Authentication → Policies
2. Select `products` table
3. Add a policy for anonymous access:
   ```sql
   CREATE POLICY "Allow public read access"
   ON products FOR SELECT
   USING (true);
   ```
4. Or require authentication:
   ```sql
   CREATE POLICY "Allow authenticated read"
   ON products FOR SELECT
   USING (auth.role() = 'authenticated');
   ```

---

### ❌ Issue: Table Not Found (404)

**Diagnosis:**
```
✗ Table 'orders' exists: Table not found
```

**Causes:**
- Table doesn't exist in database
- Typo in table name
- Table is in a different schema (not `public`)

**Solution:**
1. Check table exists: Dashboard → Table Editor
2. Verify spelling matches exactly
3. Run SQL to check:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
4. Create table if needed

---

## Troubleshooting the Scripts

### Error: "fetch is not defined"

**Cause:** Node.js version < 18

**Solution:**
```bash
# Check version
node --version

# Upgrade to Node 18+
# Using nvm:
nvm install 18
nvm use 18

# Or download from: https://nodejs.org
```

---

### Error: "ECONNREFUSED"

**Cause:** Network/firewall blocking

**Solution:**
1. Check internet connection
2. Try from different network
3. Check firewall settings
4. Verify URL is correct
5. Test with: `curl https://akxmacfsltzhbnunoepb.supabase.co`

---

### Script Hangs/Timeout

**Cause:** Slow network or project issues

**Solution:**
1. Increase timeout in script
2. Check Supabase status: https://status.supabase.com
3. Try again in a few minutes
4. Contact support if persists

---

## Integration with CI/CD

### GitHub Actions

```yaml
name: Test Supabase Connection

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Test Supabase Connection
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: node quick-test.js
```

### npm Script

Add to `package.json`:

```json
{
  "scripts": {
    "test:db": "node quick-test.js",
    "diagnose:db": "node supabase-diagnostic.js"
  }
}
```

Then run:
```bash
npm run test:db
npm run diagnose:db
```

---

## When to Use Which Script

### Use **quick-test.js** when:
- ✓ You need a fast yes/no answer
- ✓ Basic connectivity check
- ✓ Validating environment setup
- ✓ CI/CD integration
- ✓ Quick troubleshooting

### Use **supabase-diagnostic.js** when:
- ✓ Detailed issue analysis needed
- ✓ Comparing anon vs service role access
- ✓ RLS policy debugging
- ✓ Multiple table checks
- ✓ Preparing support ticket
- ✓ Comprehensive audit

---

## Support

If issues persist after running diagnostics:

1. **Collect Information:**
   - Full diagnostic output
   - Project ref: `akxmacfsltzhbnunoepb`
   - Error messages
   - Screenshots

2. **Check Resources:**
   - [Status Page](https://status.supabase.com)
   - [Documentation](https://supabase.com/docs)
   - [GitHub Discussions](https://github.com/orgs/supabase/discussions)

3. **Contact Support:**
   - Dashboard → Help → Contact Support
   - Include diagnostic output
   - Specify urgency level

---

## License

These scripts are provided as-is for diagnostic purposes.
Free to use, modify, and distribute.
