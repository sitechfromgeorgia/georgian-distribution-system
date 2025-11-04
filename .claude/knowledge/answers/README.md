# Supabase Connection Diagnostic Toolkit

Comprehensive diagnostic tools to troubleshoot Supabase API key and connection issues in 2025.

## 📦 What's Included

### 🔧 Diagnostic Scripts
1. **[quick-test.js](computer:///mnt/user-data/outputs/quick-test.js)** - Fast 30-second connectivity test
2. **[supabase-diagnostic.js](computer:///mnt/user-data/outputs/supabase-diagnostic.js)** - Full diagnostic suite (2-3 min)

### 📚 Documentation
3. **[USAGE-GUIDE.md](computer:///mnt/user-data/outputs/USAGE-GUIDE.md)** - Complete usage instructions and troubleshooting
4. **[01-supabase-invalid-api-key-errors.md](computer:///mnt/user-data/outputs/01-supabase-invalid-api-key-errors.md)** - Common "Invalid API key" errors explained
5. **[02-verify-api-keys-validity.md](computer:///mnt/user-data/outputs/02-verify-api-keys-validity.md)** - How to verify keys are valid
6. **[03-retrieve-api-keys-dashboard.md](computer:///mnt/user-data/outputs/03-retrieve-api-keys-dashboard.md)** - Getting keys from dashboard
7. **[04-check-project-pause-billing.md](computer:///mnt/user-data/outputs/04-check-project-pause-billing.md)** - Project pause and billing issues
8. **[05-supabase-2025-best-practices.md](computer:///mnt/user-data/outputs/05-supabase-2025-best-practices.md)** - 2025 best practices for API key management

### ⚙️ Configuration
9. **[.env.example](computer:///mnt/user-data/outputs/.env.example)** - Environment variable template

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (uses built-in `fetch`)
- Your Supabase project credentials

### Installation

```bash
# No installation needed! Just download the scripts
# Verify Node.js version
node --version  # Should be 18.0.0 or higher
```

### Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard
   - Select your project: `akxmacfsltzhbnunoepb`
   - Navigate to: Settings → API
   - Copy your URL and anon key

3. **Edit `.env.local` with your actual values:**
   ```bash
   SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Optional
   ```

4. **Run the quick test:**
   ```bash
   # Load environment variables
   export $(cat .env.local | xargs)
   
   # Or on Windows PowerShell:
   Get-Content .env.local | ForEach-Object {
     $name, $value = $_.split('=')
     Set-Content env:\$name $value
   }
   
   # Run test
   node quick-test.js
   ```

---

## 🔍 Usage

### Quick Test (Recommended First)

```bash
node quick-test.js
```

**What it checks:**
- ✓ Environment variables set correctly
- ✓ API endpoint reachable
- ✓ API key valid
- ✓ Basic database access works

**Output:**
```
🔍 Quick Supabase Connection Test

URL: https://akxmacfsltzhbnunoepb.supabase.co
Key: eyJhbGciOiJIUzI1NiIs...

✓ Environment variables set
✓ API Response: 200 OK
✓ Table access works (profiles: 42 rows)

✅ CONNECTION SUCCESSFUL!
```

---

### Full Diagnostic (For Deep Analysis)

```bash
node supabase-diagnostic.js
```

**What it checks:**
- ✓ All environment variables
- ✓ JWT token validity and expiration
- ✓ Project reachability and status
- ✓ Both anon and service role keys
- ✓ Specific table accessibility
- ✓ RLS policy impact analysis

**Output:** Comprehensive report with:
- Test results for 15+ checks
- Issues found with explanations
- Specific recommendations
- RLS policy comparison
- Next steps guidance

---

## 📊 Common Scenarios

### ✅ Scenario 1: Everything Works
```bash
$ node quick-test.js

✅ CONNECTION SUCCESSFUL!
Your Supabase connection is working correctly.
```
**Action:** None needed. You're all set!

---

### ❌ Scenario 2: Invalid API Key (401)
```bash
$ node quick-test.js

❌ ISSUE: Invalid API key (401)
   → Copy the correct anon key from: Dashboard → Settings → API
```

**Actions:**
1. Go to [Dashboard → Settings → API](https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/settings/api)
2. Copy the **anon** key (entire key, 200+ characters)
3. Update `SUPABASE_ANON_KEY` in `.env.local`
4. Re-run test

**Read more:** [01-supabase-invalid-api-key-errors.md](computer:///mnt/user-data/outputs/01-supabase-invalid-api-key-errors.md)

---

### ⏸️ Scenario 3: Project Paused (540)
```bash
$ node quick-test.js

❌ ISSUE: Project is paused (540)
   → Go to Supabase Dashboard
   → Click "Restore Project"
```

**Actions:**
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Restore Project** button
4. Wait 2-5 minutes
5. Re-run test

**Read more:** [04-check-project-pause-billing.md](computer:///mnt/user-data/outputs/04-check-project-pause-billing.md)

---

### 🔒 Scenario 4: RLS Blocking Access
```bash
$ node supabase-diagnostic.js

RLS Impact Analysis:
products: Anon=0, Service Role=150

Issues Found:
  RLS is blocking access to 'products' table
```

**Explanation:** Your API key is valid! Row Level Security (RLS) policies are preventing access (this is expected behavior).

**Actions:**
1. Dashboard → Authentication → Policies
2. Select `products` table
3. Add policy for anonymous/authenticated access
4. Or use service role key for admin operations

**Read more:** [05-supabase-2025-best-practices.md](computer:///mnt/user-data/outputs/05-supabase-2025-best-practices.md) (Part 3: Security)

---

## 🎯 Which Script Should I Use?

| Situation | Use Script | Time |
|-----------|-----------|------|
| Quick check before deployment | `quick-test.js` | 30 sec |
| CI/CD integration | `quick-test.js` | 30 sec |
| "Invalid API key" error | `quick-test.js` first, then `supabase-diagnostic.js` | 3 min |
| RLS policy debugging | `supabase-diagnostic.js` | 2-3 min |
| Comprehensive audit | `supabase-diagnostic.js` | 2-3 min |
| New project setup verification | `quick-test.js` | 30 sec |
| Preparing support ticket | `supabase-diagnostic.js` | 2-3 min |

---

## 📖 Documentation Guide

### Start Here
1. **[USAGE-GUIDE.md](computer:///mnt/user-data/outputs/USAGE-GUIDE.md)** - Complete usage instructions

### Deep Dives
2. **[01-supabase-invalid-api-key-errors.md](computer:///mnt/user-data/outputs/01-supabase-invalid-api-key-errors.md)**
   - 10 common reasons for "Invalid API key" errors
   - Environment variable issues
   - Key types and formats
   - Migration from legacy to new keys

3. **[02-verify-api-keys-validity.md](computer:///mnt/user-data/outputs/02-verify-api-keys-validity.md)**
   - 10 methods to verify keys are valid
   - Dashboard checks
   - cURL tests
   - Postman integration
   - JWT decoding

4. **[03-retrieve-api-keys-dashboard.md](computer:///mnt/user-data/outputs/03-retrieve-api-keys-dashboard.md)**
   - Step-by-step dashboard navigation
   - Legacy vs new keys
   - Where to find each key type
   - Security best practices

5. **[04-check-project-pause-billing.md](computer:///mnt/user-data/outputs/04-check-project-pause-billing.md)**
   - Project status indicators
   - Billing issue diagnosis
   - 90-day restoration window
   - Prevention strategies

6. **[05-supabase-2025-best-practices.md](computer:///mnt/user-data/outputs/05-supabase-2025-best-practices.md)**
   - Next.js 15 integration
   - Environment configuration
   - Security practices
   - Production deployment
   - Error handling patterns

---

## 🐛 Troubleshooting

### Error: "fetch is not defined"

**Cause:** Node.js version too old

**Solution:**
```bash
# Check version
node --version

# Upgrade to 18+
# Using nvm:
nvm install 18
nvm use 18
```

---

### Error: "ECONNREFUSED" or "Network error"

**Possible causes:**
- No internet connection
- Firewall blocking
- Wrong URL
- Supabase service down

**Solutions:**
1. Check internet: `ping google.com`
2. Test URL directly: `curl https://akxmacfsltzhbnunoepb.supabase.co`
3. Check status: https://status.supabase.com
4. Verify URL in `.env.local`

---

### Keys work in browser but not in script

**Cause:** Different keys for different environments

**Solution:**
1. Make sure you're using the **same** keys
2. Check if you have multiple Supabase projects
3. Verify project ref matches: `akxmacfsltzhbnunoepb`
4. Double-check environment variables are loaded

---

## 🔐 Security Notes

### ⚠️ Important
- **NEVER** commit `.env.local` to Git
- **NEVER** expose service role key in client-side code
- **ALWAYS** enable RLS on all tables
- **ROTATE** keys annually or if compromised

### Safe Practices
```bash
# Good: Use environment variables
export SUPABASE_ANON_KEY="eyJ..."
node quick-test.js

# Bad: Hardcode in script
const key = "eyJ..."  // ❌ Never do this
```

---

## 🎓 Learning Resources

### Official Docs
- [Supabase API Keys Guide](https://supabase.com/docs/guides/api/api-keys)
- [Authentication Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Community
- [GitHub Discussions](https://github.com/orgs/supabase/discussions)
- [Discord](https://discord.supabase.com)
- [Status Page](https://status.supabase.com)

---

## 🤝 Support

If you've run the diagnostics and still have issues:

1. **Collect diagnostic output:**
   ```bash
   node supabase-diagnostic.js > diagnostic-report.txt
   ```

2. **Contact Supabase Support:**
   - Dashboard → Help → Contact Support
   - Include: diagnostic report, project ref, error messages

3. **Community Help:**
   - [GitHub Discussions](https://github.com/orgs/supabase/discussions)
   - Include diagnostic output and what you've tried

---

## 📝 License

These diagnostic tools are provided as-is for troubleshooting purposes.
Free to use, modify, and distribute.

---

## ✨ Summary

**Your project details:**
- Project ref: `akxmacfsltzhbnunoepb`
- URL: `https://akxmacfsltzhbnunoepb.supabase.co`

**Quick commands:**
```bash
# 1. Setup
cp .env.example .env.local
# Edit .env.local with your keys

# 2. Quick test
export $(cat .env.local | xargs)
node quick-test.js

# 3. Full diagnostic (if needed)
node supabase-diagnostic.js

# 4. Read specific documentation
cat 01-supabase-invalid-api-key-errors.md
```

**Need help?** Start with [USAGE-GUIDE.md](computer:///mnt/user-data/outputs/USAGE-GUIDE.md)

---

Made with ❤️ for debugging Supabase connections in 2025
