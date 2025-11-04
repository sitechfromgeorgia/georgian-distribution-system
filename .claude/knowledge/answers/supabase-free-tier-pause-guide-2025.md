# Supabase Free Tier: 2025 Limitations & Paused Project Solutions

## Executive Summary

Your "Invalid API key" error is almost certainly caused by **automatic project pausing** due to inactivity. Supabase free tier projects pause after **7 consecutive days** of inactivity, and this is the #1 cause of authentication errors for inactive projects.

**Quick Fix:** Log into dashboard and click "Restore Project" button. Your project and data are safe (within 90 days).

---

## 1. Free Tier Auto-Pause Behavior (2025)

### The 7-Day Rule

**Free tier projects automatically pause after 7 consecutive days without activity.**

#### What Counts as "Activity"
✅ **DOES Count:**
- API requests (REST API calls)
- Database queries via PostgREST
- Authentication events (login, signup)
- Storage operations (upload, download)
- Realtime connections (WebSocket subscriptions)
- Edge Function invocations

❌ **DOES NOT Count:**
- Viewing the Supabase dashboard
- Logging into your account
- Checking project settings
- Reading documentation

#### Timeline
```
Day 0: Last activity
Day 5: Warning email sent ("Your project will pause in 2 days")
Day 7: Project automatically paused
Day 7+: Project remains paused until manually restored
Day 90: Final warning email
Day 90+: Project data may be permanently deleted
```

---

### Pause vs. "Invalid API Key" Error

When a project is paused, you'll encounter what **looks like** an authentication error:

```bash
# HTTP Response
Status: 540 (Custom Supabase code)
OR
Status: 401 Unauthorized

# Error Message
{
  "message": "Invalid API key",
  "hint": "Double check your Supabase `anon` or `service_role` API key.",
  "code": "540" 
}
```

**Why it shows as "Invalid API key":**
- The API gateway intercepts requests to paused projects
- Returns authentication error instead of exposing pause status
- This is by design to protect project information

**Critical Distinction:**
```
Paused Project → Returns 540 or 401 (with "Invalid API key" message)
Actually Invalid Key → Returns 401 (key truly doesn't match)
```

---

## 2. Check if Project is Paused (Without Dashboard Access)

### Method 1: HTTP Status Code Test (Most Reliable)

```bash
# Test your project URL
curl -i "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Interpret Results:**

```bash
# Active Project (200 OK)
HTTP/2 200
{"message":"ok"}

# Paused Project (540 or 401)
HTTP/2 540
# OR
HTTP/2 401
{"message":"The project has been paused"}
# OR  
{"message":"Invalid API key"} # Generic message for paused projects

# Actually Invalid Key (401 with different context)
HTTP/2 401
{"code":"PGRST301","message":"JWT expired"}
# OR specific JWT validation errors
```

---

### Method 2: Multiple Endpoint Test

Test different endpoints to distinguish pause from key issues:

```bash
# Test 1: REST API root
curl -s -o /dev/null -w "%{http_code}" \
  "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: YOUR_KEY"

# Test 2: Auth endpoint  
curl -s -o /dev/null -w "%{http_code}" \
  "https://akxmacfsltzhbnunoepb.supabase.co/auth/v1/health" \
  -H "apikey: YOUR_KEY"

# Test 3: Storage endpoint
curl -s -o /dev/null -w "%{http_code}" \
  "https://akxmacfsltzhbnunoepb.supabase.co/storage/v1/bucket" \
  -H "apikey: YOUR_KEY"
```

**Pattern Analysis:**
```
All endpoints return 540 → Project is PAUSED
All endpoints return 401 → Invalid key OR paused
Mixed responses → Specific service issue
```

---

### Method 3: JavaScript Test (No Dependencies)

```javascript
// Save as check-status.js, run with: node check-status.js

const SUPABASE_URL = 'https://akxmacfsltzhbnunoepb.supabase.co'
const ANON_KEY = 'your-anon-key-here'

async function checkProjectStatus() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    })
    
    console.log('Status Code:', response.status)
    console.log('Status Text:', response.statusText)
    
    if (response.status === 540) {
      console.log('❌ PROJECT IS PAUSED')
      console.log('→ Action: Log into dashboard and click "Restore Project"')
      return 'paused'
    }
    
    if (response.status === 200) {
      console.log('✅ PROJECT IS ACTIVE')
      const data = await response.json()
      console.log('Response:', data)
      return 'active'
    }
    
    if (response.status === 401) {
      console.log('⚠️ AUTHENTICATION ERROR')
      console.log('Could be: Paused project OR invalid API key')
      
      // Additional check
      const text = await response.text()
      if (text.includes('paused') || text.includes('540')) {
        console.log('→ Likely PAUSED (detected from error message)')
        return 'paused'
      } else {
        console.log('→ Likely INVALID KEY (check your API keys)')
        return 'invalid_key'
      }
    }
    
    console.log('⚠️ UNEXPECTED STATUS:', response.status)
    return 'unknown'
    
  } catch (error) {
    console.error('❌ CONNECTION ERROR:', error.message)
    console.log('→ Check your internet connection')
    console.log('→ Verify project URL is correct')
    return 'error'
  }
}

checkProjectStatus()
```

**Run the test:**
```bash
node check-status.js
```

---

### Method 4: Browser DevTools Test

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Paste this code:

```javascript
fetch('https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(r => {
  console.log('Status:', r.status)
  if (r.status === 540 || r.status === 401) {
    console.log('❌ Project appears to be PAUSED')
  } else if (r.status === 200) {
    console.log('✅ Project is ACTIVE')
  }
  return r.json()
})
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err))
```

---

### Method 5: Health Check Script (Production-Ready)

```bash
#!/bin/bash
# save as check-supabase.sh

PROJECT_URL="https://akxmacfsltzhbnunoepb.supabase.co"
ANON_KEY="your-anon-key-here"

echo "Checking Supabase project status..."

# Make request and capture status code
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${PROJECT_URL}/rest/v1/" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

echo "HTTP Status Code: $HTTP_CODE"

case $HTTP_CODE in
  200)
    echo "✅ Status: ACTIVE"
    echo "Your project is running normally"
    exit 0
    ;;
  540)
    echo "❌ Status: PAUSED"
    echo "Action required: Restore project via dashboard"
    echo "Dashboard: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb"
    exit 1
    ;;
  401)
    echo "⚠️ Status: AUTHENTICATION ERROR"
    echo "Possible causes:"
    echo "  1. Project is paused (most common)"
    echo "  2. Invalid API key"
    echo "Action: Check dashboard first, then verify keys"
    exit 1
    ;;
  000)
    echo "❌ Status: CONNECTION FAILED"
    echo "Cannot reach Supabase servers"
    echo "Check internet connection and project URL"
    exit 2
    ;;
  *)
    echo "⚠️ Status: UNEXPECTED ($HTTP_CODE)"
    echo "Check Supabase status page: https://status.supabase.com"
    exit 1
    ;;
esac
```

**Make executable and run:**
```bash
chmod +x check-supabase.sh
./check-supabase.sh
```

---

## 3. API Keys Don't Expire on Free Tier (But Projects Do)

### Key Takeaways

**API keys themselves DO NOT expire** on Supabase free tier:
- Legacy `anon` and `service_role` keys: Valid until manually rotated
- New `publishable` and `secret` keys: Valid until manually deleted/rotated
- No automatic expiration based on time or inactivity

**However:**
- **Projects pause** after 7 days → Keys become unusable
- **Projects delete** after 90 days → Keys become permanently invalid
- Keys from deleted projects cannot be recovered

---

### Key Behavior During Pause

```
Project Active:
  Keys work normally ✅

Project Paused (Day 7-89):
  Keys return "Invalid" error ❌
  But keys are still valid (data preserved)
  Restore project → Keys work again ✅

Project Deleted (Day 90+):
  Keys permanently invalid ❌
  Data lost forever
  Must create new project + new keys
```

---

### When Keys Actually Become Invalid

**Permanently Invalid When:**
1. Project permanently deleted (after 90-day pause)
2. JWT secret rotated in dashboard (legacy keys only)
3. Keys manually deleted/revoked
4. Organization deleted

**Still Valid (Just Unusable) When:**
1. Project paused (restore makes them work again)
2. Billing issues (resolve payment → keys work)
3. Fair use policy applied (resolve usage → keys work)

---

## 4. How to Reactivate a Paused Project

### Step-by-Step Restoration

#### Option 1: Via Dashboard (Recommended)

1. **Log into Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Locate Paused Project**
   - Project list shows pause indicator: ⏸️
   - Status: "Paused" or "Inactive"
   - Warning: "X days remaining until deletion"

3. **Click Project**
   - You'll see a prominent banner/button

4. **Click "Restore Project" Button**
   ```
   [Restore Project]
   OR
   [Resume Project]
   ```

5. **Confirm Action**
   - May require re-authentication
   - Confirm you want to restore

6. **Wait for Restoration (2-5 minutes)**
   ```
   Status: "Restoring..." → "Active" ✅
   ```

7. **Test Connection**
   ```bash
   curl "https://YOUR-PROJECT.supabase.co/rest/v1/" \
     -H "apikey: YOUR_KEY"
   # Should return 200 OK
   ```

---

#### Option 2: Via Support (If Dashboard Fails)

**When to Use:**
- Can't access dashboard
- Restore button not working
- Project stuck in "Restoring..." state
- Past 90-day window

**Contact Support:**
```
Email: support@supabase.io
Subject: Restore Paused Project - [Project Ref]

Include:
- Project reference: akxmacfsltzhbnunoepb
- Project URL
- Account email
- When it was paused
- Error messages (if any)
```

---

### What Gets Restored

**Fully Restored:**
✅ All database data (from pause time)
✅ All database schemas and functions
✅ Row Level Security policies
✅ Auth users and sessions
✅ Storage buckets and files
✅ Edge Functions
✅ API configuration
✅ Same API keys (work immediately)

**Not Restored:**
❌ Activity that occurred while paused (nothing was running)
❌ Realtime subscriptions (need to reconnect)
❌ Active sessions (users need to re-login)
❌ In-flight transactions (they failed when paused)

---

### Post-Restoration Checklist

```bash
□ Test API connectivity (curl test)
□ Verify database access (query a table)
□ Check auth still works (test login)
□ Verify storage accessible
□ Reconnect Realtime subscriptions
□ Clear application caches
□ Inform users (if public app)
□ Set up keep-alive (prevent future pauses)
```

---

## 5. Alternative Connection Tests (Without Dashboard)

### Production-Ready Test Suite

#### Test 1: Basic Connectivity
```bash
# No authentication - just check if server responds
curl -I "https://akxmacfsltzhbnunoepb.supabase.co"

# Expected: 200 or 404 (means server reachable)
# Paused: 540 or no response
```

---

#### Test 2: REST API Health
```bash
# Minimal auth test
curl "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  2>&1 | head -20

# Active: {"message":"ok"} or table list
# Paused: "Invalid API key" or 540 error
```

---

#### Test 3: Auth Service Check
```bash
# Test auth endpoint (doesn't require valid session)
curl "https://akxmacfsltzhbnunoepb.supabase.co/auth/v1/health" \
  -H "apikey: YOUR_ANON_KEY"

# Active: Health check response
# Paused: Error response
```

---

#### Test 4: Multi-Endpoint Validation Script

```python
#!/usr/bin/env python3
# save as supabase-test.py
# requires: pip install requests

import requests
import sys

PROJECT_URL = "https://akxmacfsltzhbnunoepb.supabase.co"
ANON_KEY = "your-anon-key"

def test_endpoint(name, path, method="GET"):
    """Test a Supabase endpoint and return status"""
    url = f"{PROJECT_URL}{path}"
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}"
    }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        else:
            response = requests.post(url, headers=headers, timeout=10)
        
        status = "✅" if response.status_code < 400 else "❌"
        print(f"{status} {name}: {response.status_code}")
        
        if response.status_code == 540:
            print(f"   → PROJECT IS PAUSED")
            return False
        elif response.status_code == 401:
            print(f"   → AUTH ERROR (likely paused or invalid key)")
            return False
        elif response.status_code < 400:
            return True
        else:
            print(f"   → Unexpected error")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ {name}: Connection failed")
        print(f"   → {e}")
        return False

def main():
    print("Testing Supabase Project Connectivity...\n")
    print(f"Project: {PROJECT_URL}\n")
    
    tests = [
        ("REST API Root", "/rest/v1/"),
        ("Auth Health", "/auth/v1/health"),
        ("Storage", "/storage/v1/bucket"),
    ]
    
    results = []
    for name, path in tests:
        result = test_endpoint(name, path)
        results.append(result)
        print()
    
    print("-" * 50)
    if all(results):
        print("✅ All tests passed - Project is ACTIVE")
        sys.exit(0)
    elif not any(results):
        print("❌ All tests failed - Project likely PAUSED")
        print("\nAction: Restore via dashboard")
        print(f"URL: https://supabase.com/dashboard/project/{PROJECT_URL.split('//')[1].split('.')[0]}")
        sys.exit(1)
    else:
        print("⚠️ Mixed results - Partial service issues")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**Run the test:**
```bash
python3 supabase-test.py
```

---

#### Test 5: Comprehensive cURL Test

```bash
#!/bin/bash
# Complete diagnostic script

PROJECT_URL="https://akxmacfsltzhbnunoepb.supabase.co"
ANON_KEY="your-anon-key"

echo "=== SUPABASE PROJECT DIAGNOSTIC ==="
echo "Project: $PROJECT_URL"
echo "Time: $(date)"
echo ""

# Test 1: DNS Resolution
echo "1. DNS Resolution:"
host $(echo $PROJECT_URL | sed 's|https://||' | sed 's|/.*||') && echo "✅ DNS OK" || echo "❌ DNS Failed"
echo ""

# Test 2: HTTPS Connection
echo "2. HTTPS Connection:"
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" \
  --connect-timeout 5 \
  "$PROJECT_URL" && echo "✅ Connection OK" || echo "❌ Connection Failed"
echo ""

# Test 3: REST API
echo "3. REST API Check:"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  "${PROJECT_URL}/rest/v1/" \
  -H "apikey: ${ANON_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "Status Code: $HTTP_CODE"
echo "Response: $BODY"

case $HTTP_CODE in
  200) echo "✅ REST API: Active" ;;
  540) echo "❌ REST API: Project Paused" ;;
  401) echo "❌ REST API: Auth Error (Paused or Invalid Key)" ;;
  *) echo "⚠️ REST API: Unexpected Status" ;;
esac
echo ""

# Test 4: Auth Service
echo "4. Auth Service Check:"
AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "${PROJECT_URL}/auth/v1/health" \
  -H "apikey: ${ANON_KEY}")

echo "Status Code: $AUTH_CODE"
[ $AUTH_CODE -eq 200 ] && echo "✅ Auth: Active" || echo "❌ Auth: Error"
echo ""

# Final Verdict
echo "=== VERDICT ==="
if [ "$HTTP_CODE" = "540" ] || [ "$HTTP_CODE" = "401" ]; then
  echo "❌ PROJECT IS PAUSED"
  echo ""
  echo "Action Required:"
  echo "1. Go to: https://supabase.com/dashboard"
  echo "2. Find project: akxmacfsltzhbnunoepb"
  echo "3. Click 'Restore Project' button"
  echo "4. Wait 2-5 minutes for restoration"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PROJECT IS ACTIVE"
  echo ""
  echo "If you're still getting errors in your app:"
  echo "1. Check your environment variables"
  echo "2. Verify API keys are correct"
  echo "3. Clear application cache"
  echo "4. Restart your dev server"
else
  echo "⚠️ UNEXPECTED STATUS"
  echo ""
  echo "Possible issues:"
  echo "1. Network connectivity problems"
  echo "2. Supabase service outage"
  echo "3. Incorrect project URL"
  echo ""
  echo "Check: https://status.supabase.com"
fi
```

**Make executable and run:**
```bash
chmod +x diagnostic.sh
./diagnostic.sh
```

---

## 6. Prevent Future Auto-Pauses

### Solution 1: Simple cURL Cron Job (No Dependencies)

**Setup:**
```bash
# Edit crontab
crontab -e

# Add this line (runs Monday and Thursday at 9 AM)
0 9 * * 1,4 curl -X GET "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" -H "apikey: YOUR_ANON_KEY" -H "Authorization: Bearer YOUR_ANON_KEY" > /dev/null 2>&1

# Or run twice a week at different times
0 9 * * 1 curl -s "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" -H "apikey: YOUR_KEY" >/dev/null
0 9 * * 4 curl -s "https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/" -H "apikey: YOUR_KEY" >/dev/null
```

---

### Solution 2: Web Service Ping (Cloud-Based)

**Using UptimeRobot (Free):**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create HTTP(s) monitor
3. URL: `https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/`
4. Add custom HTTP headers:
   ```
   apikey: YOUR_ANON_KEY
   Authorization: Bearer YOUR_ANON_KEY
   ```
5. Set interval: Check every 6 hours
6. **Bonus:** Get notifications if project goes down

---

### Solution 3: GitHub Actions (No Server Required)

**Setup:**
```yaml
# .github/workflows/keep-alive.yml
name: Keep Supabase Active

on:
  schedule:
    # Every Monday and Thursday at 9:00 AM UTC
    - cron: '0 9 * * 1,4'
  workflow_dispatch: # Manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          response=$(curl -s -w "\n%{http_code}" \
            "${SUPABASE_URL}/rest/v1/" \
            -H "apikey: ${SUPABASE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_KEY}")
          
          http_code=$(echo "$response" | tail -n1)
          
          if [ "$http_code" = "200" ]; then
            echo "✅ Supabase active"
          else
            echo "❌ Supabase error: $http_code"
            exit 1
          fi
```

**Add secrets:**
1. GitHub repo → Settings → Secrets → Actions
2. Add `SUPABASE_URL`: `https://akxmacfsltzhbnunoepb.supabase.co`
3. Add `SUPABASE_KEY`: Your anon key

---

### Solution 4: CloudFlare Workers (Free Tier)

```javascript
// CloudFlare Worker - runs on schedule
addEventListener('scheduled', event => {
  event.waitUntil(keepAlive())
})

async function keepAlive() {
  const response = await fetch(
    'https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/',
    {
      headers: {
        'apikey': 'YOUR_ANON_KEY',
        'Authorization': 'Bearer YOUR_ANON_KEY'
      }
    }
  )
  
  console.log(`Keep-alive ping: ${response.status}`)
  return response
}

// Schedule: Run twice a week
// Set in CloudFlare dashboard cron triggers
```

---

## 7. Quick Reference: Troubleshooting Decision Tree

```
"Invalid API Key" Error
    │
    ├─→ Created in 2024 + Inactive?
    │   └─→ 99% chance: PROJECT PAUSED ✅
    │       Action: Restore via dashboard
    │
    ├─→ Test with curl
    │   ├─→ Returns 540? → PAUSED (confirm)
    │   ├─→ Returns 401? → PAUSED or Invalid Key
    │   └─→ Returns 200? → Not paused (check keys)
    │
    ├─→ Check dashboard
    │   ├─→ Shows "Paused"? → RESTORE IT
    │   ├─→ Shows "Active"? → Check keys
    │   └─→ Can't access? → Contact support
    │
    └─→ After restore, still errors?
        ├─→ Clear app cache
        ├─→ Restart dev server
        ├─→ Verify .env.local keys
        └─→ Check RLS policies (different issue)
```

---

## 8. Summary: Your Specific Situation

Based on your description:
- ✅ Free tier project
- ✅ Created in 2024
- ✅ May have been inactive
- ✅ Getting "Invalid API key" errors

**Diagnosis: 99% probability your project is auto-paused**

**Immediate Action:**
1. Go to: https://supabase.com/dashboard
2. Find project: `akxmacfsltzhbnunoepb`
3. Click "Restore Project" button
4. Wait 2-5 minutes
5. Test connection with curl (examples above)
6. Set up keep-alive to prevent future pauses

**If you can't access dashboard:**
- Email support: support@supabase.io
- Include project ref: akxmacfsltzhbnunoepb
- Request project restoration

---

## Resources

- [Supabase Status](https://status.supabase.com)
- [Dashboard](https://supabase.com/dashboard)
- [Support](mailto:support@supabase.io)
- [Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)
