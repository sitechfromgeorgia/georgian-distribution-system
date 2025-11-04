# Programmatic Supabase Project Health Check Guide

## Overview
This guide provides multiple methods to programmatically verify your Supabase project status, database connectivity, API key validity, and RLS policies without using the Supabase MCP server.

**Your Project Details:**
- Project Ref: `akxmacfsltzhbnunoepb`
- Base URL: `https://akxmacfsltzhbnunoepb.supabase.co`

---

## Available Health Check Endpoints

### 1. Auth Service Health Check
**Endpoint:** `/auth/v1/health`  
**Purpose:** Check if Auth (GoTrue) service is running  
**Authentication:** Requires `apikey` header  
**Status:** ✅ Official endpoint

```bash
curl -X GET 'https://akxmacfsltzhbnunoepb.supabase.co/auth/v1/health' \
  -H 'apikey: YOUR_ANON_KEY'
```

**Expected Response:**
```json
{
  "version": "v2.60.7",
  "name": "GoTrue",
  "description": "GoTrue is a user registration and authentication API"
}
```

**Interpretation:**
- ✅ 200 OK + JSON → Auth service is healthy
- ❌ 401 → Invalid API key
- ❌ 540 → Project paused
- ❌ 503/504 → Service unavailable

---

### 2. REST API Health Check
**Endpoint:** `/rest/v1/`  
**Purpose:** Check if REST API (PostgREST) is running  
**Authentication:** Requires `apikey` header  
**Status:** ✅ Official endpoint

```bash
curl -X GET 'https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

**Expected Response:**
```json
{
  "message": "ok"
}
```
Or a JSON object describing available endpoints.

**Interpretation:**
- ✅ 200 OK → REST API is healthy
- ❌ 401 → Invalid API key
- ❌ 540 → Project paused
- ❌ 404 → Endpoint not found (rare)

---

### 3. Storage Health Check
**Endpoint:** `/storage/v1/bucket`  
**Purpose:** Check if Storage service is running  
**Authentication:** Requires `apikey` header  
**Status:** ✅ Works for basic health check

```bash
curl -X GET 'https://akxmacfsltzhbnunoepb.supabase.co/storage/v1/bucket' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

**Expected Response:**
```json
[]
```
Or list of buckets if any exist.

**Interpretation:**
- ✅ 200 OK → Storage service is healthy
- ❌ 401 → Invalid API key
- ❌ 403 → Permission denied (but service is up)

---

### 4. Realtime Health Check
**Endpoint:** WebSocket connection test  
**Purpose:** Check if Realtime service is running  
**Status:** ⚠️ Requires WebSocket client

Basic HTTP test (limited):
```bash
curl -I 'https://akxmacfsltzhbnunoepb.supabase.co/realtime/v1/'
```

---

### 5. Metrics Endpoint (Advanced)
**Endpoint:** `/customer/v1/privileged/metrics`  
**Purpose:** Prometheus-compatible metrics  
**Authentication:** HTTP Basic Auth with service role key  
**Status:** ⚠️ Beta, requires service role key

```bash
curl -X GET 'https://akxmacfsltzhbnunoepb.supabase.co/customer/v1/privileged/metrics' \
  -u "service_role:YOUR_SERVICE_ROLE_KEY"
```

---

## Complete Health Check Scripts

### Method 1: Bash Script (Complete Check)

```bash
#!/bin/bash

# Configuration
PROJECT_REF="akxmacfsltzhbnunoepb"
BASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY="${SUPABASE_ANON_KEY}"  # Set this environment variable

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "Supabase Project Health Check"
echo "Project: ${PROJECT_REF}"
echo "================================================"
echo ""

# Check if API key is set
if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}❌ ERROR: SUPABASE_ANON_KEY environment variable not set${NC}"
    exit 1
fi

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing ${name}... "
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "apikey: ${ANON_KEY}" \
        -H "Authorization: Bearer ${ANON_KEY}" \
        "${url}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP ${http_code})"
        if [ -n "$body" ] && [ "$body" != "[]" ]; then
            echo "   Response: ${body}" | head -c 100
            echo ""
        fi
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP ${http_code})"
        if [ -n "$body" ]; then
            echo "   Error: ${body}"
        fi
        return 1
    fi
}

# Run health checks
echo "1. Project Connectivity Check"
echo "------------------------------"
check_endpoint "REST API" "${BASE_URL}/rest/v1/" "200"
rest_status=$?

echo ""
echo "2. Auth Service Check"
echo "---------------------"
check_endpoint "Auth Health" "${BASE_URL}/auth/v1/health" "200"
auth_status=$?

echo ""
echo "3. Storage Service Check"
echo "------------------------"
check_endpoint "Storage" "${BASE_URL}/storage/v1/bucket" "200"
storage_status=$?

echo ""
echo "4. Database Connectivity Test"
echo "------------------------------"
echo -n "Testing database query... "

db_response=$(curl -s -w "\n%{http_code}" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    "${BASE_URL}/rest/v1/rpc/version" 2>/dev/null)

db_http_code=$(echo "$db_response" | tail -n1)
db_body=$(echo "$db_response" | head -n-1)

if [ "$db_http_code" = "200" ] || [ "$db_http_code" = "404" ]; then
    # 404 means function doesn't exist, but database is accessible
    echo -e "${GREEN}✅ PASS${NC} (Database accessible)"
    db_status=0
else
    echo -e "${RED}❌ FAIL${NC} (HTTP ${db_http_code})"
    echo "   Response: ${db_body}"
    db_status=1
fi

echo ""
echo "================================================"
echo "SUMMARY"
echo "================================================"

total_tests=4
passed_tests=0

[ $rest_status -eq 0 ] && ((passed_tests++))
[ $auth_status -eq 0 ] && ((passed_tests++))
[ $storage_status -eq 0 ] && ((passed_tests++))
[ $db_status -eq 0 ] && ((passed_tests++))

echo "Tests Passed: ${passed_tests}/${total_tests}"
echo ""

if [ $rest_status -ne 0 ]; then
    echo -e "${RED}⚠️  REST API is DOWN - Project may be paused or API key invalid${NC}"
fi

if [ $auth_status -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Auth service is DOWN - Authentication will not work${NC}"
fi

if [ $storage_status -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Storage service is DOWN - File operations will fail${NC}"
fi

if [ $db_status -ne 0 ]; then
    echo -e "${RED}⚠️  Database is inaccessible - All queries will fail${NC}"
fi

echo ""

if [ $passed_tests -eq $total_tests ]; then
    echo -e "${GREEN}✅ All systems operational!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some systems are down. Check details above.${NC}"
    exit 1
fi
```

**Usage:**
```bash
# Set your API key
export SUPABASE_ANON_KEY="eyJ..."

# Make script executable
chmod +x health-check.sh

# Run
./health-check.sh
```

---

### Method 2: Node.js Script (Comprehensive)

```javascript
#!/usr/bin/env node

const https = require('https');

// Configuration
const PROJECT_REF = 'akxmacfsltzhbnunoepb';
const BASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!ANON_KEY) {
  console.error('❌ ERROR: SUPABASE_ANON_KEY environment variable not set');
  process.exit(1);
}

// Helper function to make HTTP requests
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Health check functions
async function checkRestAPI() {
  try {
    const response = await makeRequest(`${BASE_URL}/rest/v1/`);
    return {
      name: 'REST API',
      status: response.statusCode === 200 ? 'healthy' : 'unhealthy',
      statusCode: response.statusCode,
      message: response.body ? JSON.parse(response.body) : null
    };
  } catch (error) {
    return {
      name: 'REST API',
      status: 'error',
      error: error.message
    };
  }
}

async function checkAuth() {
  try {
    const response = await makeRequest(`${BASE_URL}/auth/v1/health`);
    return {
      name: 'Auth Service',
      status: response.statusCode === 200 ? 'healthy' : 'unhealthy',
      statusCode: response.statusCode,
      message: response.body ? JSON.parse(response.body) : null
    };
  } catch (error) {
    return {
      name: 'Auth Service',
      status: 'error',
      error: error.message
    };
  }
}

async function checkStorage() {
  try {
    const response = await makeRequest(`${BASE_URL}/storage/v1/bucket`);
    return {
      name: 'Storage Service',
      status: response.statusCode === 200 ? 'healthy' : 'unhealthy',
      statusCode: response.statusCode,
      message: response.body ? JSON.parse(response.body) : null
    };
  } catch (error) {
    return {
      name: 'Storage Service',
      status: 'error',
      error: error.message
    };
  }
}

async function checkAPIKey() {
  try {
    // Try a simple query to verify key works
    const response = await makeRequest(`${BASE_URL}/rest/v1/`, {
      'Prefer': 'count=exact'
    });
    
    if (response.statusCode === 401) {
      return {
        name: 'API Key Validation',
        status: 'invalid',
        statusCode: 401,
        message: 'API key is invalid or revoked'
      };
    } else if (response.statusCode === 540) {
      return {
        name: 'API Key Validation',
        status: 'paused',
        statusCode: 540,
        message: 'Project is paused'
      };
    } else if (response.statusCode === 200) {
      return {
        name: 'API Key Validation',
        status: 'valid',
        statusCode: 200,
        message: 'API key is valid'
      };
    } else {
      return {
        name: 'API Key Validation',
        status: 'unknown',
        statusCode: response.statusCode,
        message: `Unexpected status: ${response.statusCode}`
      };
    }
  } catch (error) {
    return {
      name: 'API Key Validation',
      status: 'error',
      error: error.message
    };
  }
}

async function checkProjectStatus() {
  // This checks all HTTP codes to determine project status
  try {
    const response = await makeRequest(`${BASE_URL}/rest/v1/`);
    
    const statusMap = {
      200: { status: 'active', message: 'Project is active and operational' },
      401: { status: 'auth_error', message: 'Invalid API key' },
      403: { status: 'forbidden', message: 'Access forbidden (check RLS policies)' },
      429: { status: 'rate_limited', message: 'Rate limit exceeded' },
      540: { status: 'paused', message: 'Project is paused' },
      503: { status: 'degraded', message: 'Service temporarily unavailable' },
      504: { status: 'timeout', message: 'Gateway timeout' }
    };
    
    const result = statusMap[response.statusCode] || {
      status: 'unknown',
      message: `Unknown status code: ${response.statusCode}`
    };
    
    return {
      name: 'Project Status',
      ...result,
      statusCode: response.statusCode
    };
  } catch (error) {
    return {
      name: 'Project Status',
      status: 'unreachable',
      error: error.message,
      message: 'Cannot reach project (network error or DNS issue)'
    };
  }
}

// Main execution
async function main() {
  console.log('================================================');
  console.log('Supabase Project Health Check');
  console.log(`Project: ${PROJECT_REF}`);
  console.log(`URL: ${BASE_URL}`);
  console.log('================================================\n');

  const checks = [
    checkProjectStatus(),
    checkAPIKey(),
    checkRestAPI(),
    checkAuth(),
    checkStorage()
  ];

  const results = await Promise.all(checks);

  console.log('RESULTS:\n');
  
  results.forEach((result, index) => {
    const icon = result.status === 'healthy' || result.status === 'valid' || result.status === 'active' 
      ? '✅' 
      : result.status === 'error' || result.status === 'invalid' || result.status === 'paused'
      ? '❌'
      : '⚠️';
    
    console.log(`${index + 1}. ${icon} ${result.name}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    if (result.statusCode) {
      console.log(`   HTTP Code: ${result.statusCode}`);
    }
    if (result.message) {
      console.log(`   Message: ${typeof result.message === 'string' ? result.message : JSON.stringify(result.message, null, 2).substring(0, 100)}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  console.log('================================================');
  console.log('SUMMARY');
  console.log('================================================\n');

  const healthyCount = results.filter(r => 
    r.status === 'healthy' || r.status === 'valid' || r.status === 'active'
  ).length;

  console.log(`Healthy Services: ${healthyCount}/${results.length}`);
  
  const projectStatus = results[0];
  if (projectStatus.status === 'paused') {
    console.log('\n🛑 PROJECT IS PAUSED');
    console.log('Action: Restore project from Supabase Dashboard');
  } else if (projectStatus.status === 'active') {
    console.log('\n✅ PROJECT IS ACTIVE');
  } else {
    console.log(`\n⚠️  PROJECT STATUS: ${projectStatus.status.toUpperCase()}`);
  }

  const exitCode = healthyCount >= 3 ? 0 : 1;
  process.exit(exitCode);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Usage:**
```bash
# Set your API key
export SUPABASE_ANON_KEY="eyJ..."

# Run directly
node health-check.js

# Or make executable
chmod +x health-check.js
./health-check.js
```

---

### Method 3: cURL One-Liners (Quick Tests)

#### Test 1: Check if Project is Active
```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY"

# 200 = Active
# 401 = Invalid key
# 540 = Paused
```

#### Test 2: Validate API Key
```bash
curl -i "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Look for:
# HTTP/1.1 200 = Valid key
# HTTP/1.1 401 = Invalid key
```

#### Test 3: Check Auth Service
```bash
curl "https://akxmacfsltzhbnunoepb.supabase.co/auth/v1/health" \
  -H "apikey: YOUR_ANON_KEY"

# Expected: {"version":"v2.x.x","name":"GoTrue",...}
```

#### Test 4: Test Database Connectivity
```bash
curl "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/?select=*&limit=0" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# 200 = Database accessible
# 401 = Key issue
# 403 = RLS blocking (but DB is up)
```

#### Test 5: Check All Services (Multi-Request)
```bash
#!/bin/bash
BASE_URL="https://akxmacfsltzhbnunoepb.supabase.co"
KEY="YOUR_ANON_KEY"

echo "REST API: $(curl -s -o /dev/null -w '%{http_code}' $BASE_URL/rest/v1/ -H 'apikey: '$KEY)"
echo "Auth: $(curl -s -o /dev/null -w '%{http_code}' $BASE_URL/auth/v1/health -H 'apikey: '$KEY)"
echo "Storage: $(curl -s -o /dev/null -w '%{http_code}' $BASE_URL/storage/v1/bucket -H 'apikey: '$KEY)"
```

---

## Method 4: Test RLS Policies

### Approach 1: Query Without Auth (Should Respect RLS)
```bash
# This will respect RLS policies
curl "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/YOUR_TABLE?select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Expected outcomes:
# - 200 + [] = RLS is blocking (working correctly)
# - 200 + data = RLS allows public read
# - 401 = Invalid key (not RLS issue)
# - 404 = Table doesn't exist
```

### Approach 2: Query With Service Role (Bypasses RLS)
```bash
# This bypasses RLS policies
curl "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/YOUR_TABLE?select=*" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"

# If this returns data but anon key doesn't:
# ✅ RLS is working correctly
```

### RLS Test Script
```bash
#!/bin/bash

TABLE="users"  # Change to your table name
ANON_KEY="YOUR_ANON_KEY"
SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"
BASE_URL="https://akxmacfsltzhbnunoepb.supabase.co"

echo "Testing RLS on table: $TABLE"
echo ""

echo "1. Query with anon key (respects RLS):"
anon_response=$(curl -s "${BASE_URL}/rest/v1/${TABLE}?select=*&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")
echo "   Response: $anon_response"

echo ""
echo "2. Query with service_role key (bypasses RLS):"
service_response=$(curl -s "${BASE_URL}/rest/v1/${TABLE}?select=*&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")
echo "   Response: $service_response"

echo ""
echo "ANALYSIS:"
if [ "$anon_response" = "[]" ] && [ "$service_response" != "[]" ]; then
    echo "✅ RLS is ACTIVE and BLOCKING anon access"
elif [ "$anon_response" = "$service_response" ]; then
    echo "⚠️  RLS may be DISABLED or allows public access"
else
    echo "❓ Mixed results - check your RLS policies"
fi
```

---

## Interpretation Guide

### HTTP Status Codes

| Code | Meaning | Action Required |
|------|---------|----------------|
| 200 | ✅ Success | No action needed |
| 401 | ❌ Unauthorized | Check API key validity |
| 403 | ⚠️ Forbidden | Check RLS policies |
| 404 | ⚠️ Not Found | Check endpoint/table name |
| 429 | ⚠️ Rate Limited | Wait and retry |
| 500 | ❌ Server Error | Check Supabase status page |
| 503 | ❌ Service Unavailable | Temporary outage |
| 504 | ❌ Gateway Timeout | Network or service issue |
| 540 | ❌ **Project Paused** | **Restore from dashboard** |

---

### Decision Tree

```
HTTP 540?
  ├─ YES → Project is PAUSED
  │         Action: Restore from dashboard
  │
  └─ NO → Check HTTP code
           │
           ├─ 401 → API key INVALID
           │         Action: Verify key in dashboard
           │
           ├─ 200 + data → Everything works
           │
           ├─ 200 + [] → RLS blocking OR empty table
           │              Action: Test with service_role key
           │
           └─ 5xx → Service issue
                    Action: Check status.supabase.com
```

---

## Advanced: Project Management API

For detailed project information (requires Personal Access Token):

```bash
# Get Personal Access Token from:
# https://supabase.com/dashboard/account/tokens

# Get project details
curl "https://api.supabase.com/v1/projects/akxmacfsltzhbnunoepb" \
  -H "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN"

# Response includes:
# - status (ACTIVE_HEALTHY, PAUSED, etc.)
# - region
# - database details
# - organization info
```

---

## Monitoring Setup Examples

### 1. Cron Job (Linux/Mac)
```bash
# Add to crontab: Check every 5 minutes
*/5 * * * * /path/to/health-check.sh >> /var/log/supabase-health.log 2>&1
```

### 2. GitHub Actions
```yaml
name: Supabase Health Check
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Health Check
        env:
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          chmod +x health-check.sh
          ./health-check.sh
```

### 3. UptimeRobot / Pingdom
Configure HTTP(S) monitoring:
- URL: `https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/`
- Headers: `apikey: YOUR_ANON_KEY`
- Expected Status: 200

---

## Troubleshooting Common Issues

### Issue: "Connection Refused"
```bash
# Test DNS resolution
nslookup akxmacfsltzhbnunoepb.supabase.co

# Test basic connectivity
ping akxmacfsltzhbnunoepb.supabase.co

# Test TLS/SSL
openssl s_client -connect akxmacfsltzhbnunoepb.supabase.co:443
```

### Issue: "Timeout"
```bash
# Increase timeout in curl
curl --max-time 30 "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: YOUR_KEY"
```

### Issue: "SSL Certificate Error"
```bash
# Check certificate
curl -vI "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/"

# Bypass SSL verification (not recommended for production)
curl -k "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: YOUR_KEY"
```

---

## Resources

- [Supabase Status Page](https://status.supabase.com)
- [API Documentation](https://supabase.com/docs/guides/api)
- [Management API Reference](https://supabase.com/docs/reference/api)
- [Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting)
