# Supabase API Key Troubleshooting - Complete Guide Index
## Georgian Distribution Management System with Next.js 15

## 🎯 Quick Start

**If you're seeing "Invalid API key" errors, start here:**

1. **Immediate Fix (5 minutes):** [Step-by-Step Troubleshooting Guide](./06-troubleshooting-invalid-api-key.md)
2. **Verify Setup:** [Check if keys match dashboard](./02-verify-api-keys-validity.md)
3. **Test Connection:** [Schema verification scripts](./07-schema-verification-methods.md)

---

## 📚 Complete Documentation

### Core Guides

#### 1. [Common Invalid API Key Errors](./01-supabase-invalid-api-key-errors.md)
**When to read:** Understanding why you're getting 401 errors

**Contents:**
- 10 most common causes of "Invalid API key" errors
- Legacy vs. new keys (2025 migration info)
- Project pause and billing issues
- RLS vs. invalid key distinction
- Quick debugging checklist

**Time to read:** 10 minutes  
**Complexity:** ⭐⭐ Beginner-friendly

---

#### 2. [How to Verify API Keys are Valid](./02-verify-api-keys-validity.md)
**When to read:** Testing if your keys actually work

**Contents:**
- 10 different validation methods
- cURL tests (no code required)
- Postman setup and testing
- Browser console tests
- JWT decoder inspection
- Automated health checks

**Time to read:** 15 minutes  
**Complexity:** ⭐⭐ Practical examples

---

#### 3. [Retrieve API Keys from Dashboard](./03-retrieve-api-keys-dashboard.md)
**When to read:** Getting fresh keys from Supabase

**Contents:**
- Step-by-step dashboard navigation
- Legacy API keys (anon, service_role)
- New API keys (publishable, secret)
- Command menu shortcuts
- Migration path to new keys
- Security best practices

**Time to read:** 12 minutes  
**Complexity:** ⭐ Very beginner-friendly

---

#### 4. [Check Project Pause & Billing Issues](./04-check-project-pause-billing.md)
**When to read:** Project won't respond or shows paused

**Contents:**
- How to check project status
- Free Plan inactivity pause (7 days)
- Billing-related suspensions
- 90-day restoration window
- Prevention strategies (keep-alive scripts)
- Fair Use Policy restrictions

**Time to read:** 15 minutes  
**Complexity:** ⭐⭐ Intermediate

---

#### 5. [2025 Best Practices for API Key Management](./05-supabase-2025-best-practices.md)
**When to read:** Setting up production-grade configuration

**Contents:**
- Next.js 15 environment variable setup
- Client-side vs. server-side configuration
- TypeScript type validation
- Security best practices
- Key rotation strategies
- Production deployment checklist
- Testing strategies

**Time to read:** 25 minutes  
**Complexity:** ⭐⭐⭐ Advanced

---

### Practical Guides

#### 6. [Step-by-Step Troubleshooting: Invalid API Key](./06-troubleshooting-invalid-api-key.md)
**When to read:** FIRST guide to read when you have issues

**Contents:**
- 7 phases of troubleshooting (45 minutes total)
- Phase 1: Immediate diagnosis (5 min)
- Phase 2: Retrieve fresh keys (3 min)
- Phase 3: Update .env.local correctly (2 min)
- Phase 4: Test connection (5 min)
- Phase 5: Verify schema sync (10 min)
- Phase 6: Safe key regeneration (15 min)
- Phase 7: Environment verification (5 min)

**Includes:**
- cURL tests
- Next.js API route tests
- Browser console tests
- Schema verification scripts
- Troubleshooting flowchart

**Time to read:** 30 minutes (follow along)  
**Complexity:** ⭐⭐ Step-by-step instructions

---

#### 7. [Schema Verification Without Admin Access](./07-schema-verification-methods.md)
**When to read:** Verifying your 10 tables exist in Supabase Cloud

**Contents:**
- 5 verification methods using anon key only
- Table existence checks
- Column comparison (type-safe)
- Migration status verification
- Connection health checks
- Interactive schema explorer
- CI/CD integration examples

**Includes:**
- Ready-to-use TypeScript scripts
- package.json script examples
- Expected outputs for healthy/unhealthy systems
- Georgian-friendly (works with bilingual data)

**Time to read:** 20 minutes  
**Complexity:** ⭐⭐⭐ Requires TypeScript knowledge

---

#### 8. [Next.js 15 + Supabase Best Practices 2025](./08-nextjs15-supabase-best-practices-2025.md)
**When to read:** Setting up Georgian Distribution System properly

**Contents:**
- Complete project structure
- Environment variable configuration
- Supabase client setup (browser, server, admin)
- Type-safe database operations
- Safe key regeneration process
- Testing and deployment
- Maintenance checklists
- Quick reference card

**Includes:**
- Complete code examples
- .env.local templates
- Test suites
- Deployment guides (Vercel, Netlify, Railway)

**Time to read:** 40 minutes  
**Complexity:** ⭐⭐⭐⭐ Comprehensive setup

---

## 🚀 Quick Solutions by Scenario

### Scenario 1: "Invalid API key" - First Time Setup
```
1. Read: Guide #3 (Retrieve Keys)
2. Read: Guide #6 (Step-by-Step Troubleshooting)
3. Test: Use cURL from Guide #2
4. Verify: Run scripts from Guide #7
```

---

### Scenario 2: Keys Worked Yesterday, Broken Today
```
1. Check: Guide #4 (Project Pause)
2. Test: Guide #2 Method 2 (cURL)
3. Verify: Guide #6 Phase 2 (Fresh Keys)
4. If still broken: Guide #6 Phase 6 (Regenerate)
```

---

### Scenario 3: Cannot Verify Schema Sync
```
1. Read: Guide #7 (Schema Verification)
2. Run: check-tables.ts script
3. If tables missing: npx supabase db push
4. Verify: run verify-schema.ts script
```

---

### Scenario 4: Production Deployment Issues
```
1. Read: Guide #5 (Best Practices)
2. Setup: Guide #8 Section 6 (Production Deployment)
3. Test: Guide #6 Phase 4 (Connection Tests)
4. Monitor: Guide #8 Section 7 (Maintenance)
```

---

### Scenario 5: Need to Regenerate Keys
```
1. Read: Guide #6 Phase 6 (Safe Regeneration)
2. Read: Guide #8 Section 4 (Regeneration Process)
3. Backup: cp .env.local .env.local.backup
4. Follow: Zero-downtime rotation process
5. Test: All verification methods
```

---

## 🎓 Learning Path

### Beginner Path (1-2 hours)
```
1. Start: Guide #3 - Get keys from dashboard (12 min)
2. Setup: Guide #6 - Complete troubleshooting (30 min)
3. Test: Guide #2 - Verify keys work (15 min)
4. Check: Guide #4 - Ensure project active (15 min)
```

**Goal:** Get your local development working

---

### Intermediate Path (2-3 hours)
```
1. Foundation: Complete Beginner Path
2. Schema: Guide #7 - Verify all 10 tables exist (20 min)
3. Practice: Guide #5 - Learn best practices (25 min)
4. Advanced: Guide #8 - Full Next.js 15 setup (40 min)
```

**Goal:** Production-ready configuration

---

### Expert Path (4-5 hours)
```
1. Master: All previous guides
2. Implement: All scripts from Guide #7
3. Setup: Complete CI/CD from Guide #8
4. Document: Create team runbook
5. Automate: Daily/weekly checks
```

**Goal:** Maintainable, scalable system

---

## 🛠️ Practical Scripts

### Quick Health Check
```bash
# Test everything in 30 seconds
curl https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/ \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

curl http://localhost:3000/api/health

npm run check-tables
```

---

### Daily Developer Workflow
```bash
# Morning routine (2 minutes)
git pull
npm install
npm run daily-check

# Development
npm run dev

# Before pushing
npm run supabase:sync
npm run test
git push
```

---

### Emergency Troubleshooting
```bash
# When everything breaks (5 minutes)
# 1. Test connection
curl https://akxmacfsltzhbnunoepb.supabase.co/rest/v1/ \
  -H "apikey: YOUR_KEY"

# 2. Check environment
npm run verify-env

# 3. Restore backup if needed
cp .env.local.backup.LATEST .env.local

# 4. Restart
rm -rf .next && npm run dev

# 5. Test
npm run check-tables
```

---

## 📊 Complexity Matrix

| Guide | Time | Complexity | Prerequisites |
|-------|------|------------|---------------|
| #1 Common Errors | 10m | ⭐⭐ | None |
| #2 Verify Keys | 15m | ⭐⭐ | Basic terminal |
| #3 Retrieve Keys | 12m | ⭐ | Supabase account |
| #4 Project Pause | 15m | ⭐⭐ | Dashboard access |
| #5 Best Practices | 25m | ⭐⭐⭐ | Next.js knowledge |
| #6 Troubleshooting | 30m | ⭐⭐ | None (step-by-step) |
| #7 Schema Verify | 20m | ⭐⭐⭐ | TypeScript basics |
| #8 Next.js Setup | 40m | ⭐⭐⭐⭐ | Advanced Next.js |

---

## 🎯 Goal-Based Navigation

### Goal: Get development working TODAY
**Path:** Guides #3 → #6 → #2  
**Time:** 60 minutes  
**Result:** Local dev environment functional

---

### Goal: Verify schema matches cloud
**Path:** Guides #7 → #6 (Phase 5)  
**Time:** 30 minutes  
**Result:** Confidence that all 10 tables exist

---

### Goal: Production deployment
**Path:** Guides #5 → #8 → #2 (validation)  
**Time:** 2-3 hours  
**Result:** Production-ready setup

---

### Goal: Understand "Invalid API key" errors
**Path:** Guides #1 → #2 → #4  
**Time:** 40 minutes  
**Result:** Deep understanding of error causes

---

### Goal: Safe key regeneration
**Path:** Guides #6 (Phase 6) → #8 (Section 4)  
**Time:** 45 minutes  
**Result:** Zero-downtime key rotation

---

## 🔍 Search by Error Message

### "Invalid API key"
- **First check:** Guide #6 - Complete troubleshooting
- **Deep dive:** Guide #1 - All common causes
- **Verification:** Guide #2 - Test methods

---

### "Project paused"
- **Solution:** Guide #4 - Restore project
- **Prevention:** Guide #4 - Keep-alive scripts

---

### "Table does not exist"
- **Diagnosis:** Guide #7 - Schema verification
- **Fix:** Run `npx supabase db push`

---

### "Permission denied" / "42501"
- **Explanation:** Guide #1 (Section 1.9) - RLS vs Invalid Key
- **Not an error!** This means key is valid, RLS is blocking (expected)

---

### "Missing environment variables"
- **Setup:** Guide #8 - Complete environment config
- **Verification:** Guide #6 (Phase 7)

---

## 💡 Pro Tips

### Tip 1: Always Backup Before Changes
```bash
# Make this a habit
alias backup-env='cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)'
```

---

### Tip 2: Use Scripts from Guide #7
```bash
# Add to package.json
"scripts": {
  "check-tables": "tsx scripts/check-tables.ts",
  "verify-schema": "tsx scripts/verify-schema.ts",
  "daily-check": "npm run check-tables && npm run health"
}
```

---

### Tip 3: Bookmark These URLs
```
Dashboard: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb
API Settings: https://supabase.com/dashboard/project/akxmacfsltzhbnunoepb/settings/api
Status Page: https://status.supabase.com
```

---

### Tip 4: Create Team Runbook
Use these guides to create a custom runbook for your team:
```markdown
# Our Runbook (based on Supabase guides)

## Daily:
- [ ] Check health: curl localhost:3000/api/health
- [ ] Verify tables: npm run check-tables

## Weekly:
- [ ] Review dashboard "Last Used" for keys
- [ ] Check RLS policies
- [ ] Backup .env.local

## Emergency:
- [ ] Follow Guide #6 troubleshooting
- [ ] Contact: [team contact]
```

---

## 📞 Support Resources

### When to Use Each Guide
- **Quick fix needed:** Guide #6 (Step-by-step)
- **Learning mode:** Guides #1-5 (foundational knowledge)
- **Production setup:** Guides #5, #8 (comprehensive)
- **Schema issues:** Guide #7 (verification scripts)

---

### Additional Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Status](https://status.supabase.com)
- [Supabase Discord](https://discord.supabase.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

---

### Getting Help
If you're still stuck after reading relevant guides:

1. **Check Status Page:** https://status.supabase.com
2. **Enable Debug Mode:** `NEXT_PUBLIC_SUPABASE_DEBUG=true npm run dev`
3. **Collect Information:**
   ```bash
   # Create support request file
   cat > support-request.txt << EOF
   Project Ref: akxmacfsltzhbnunoepb
   Error: [paste error message]
   Guides followed: [list guide numbers]
   Test results: [paste output from npm run check-tables]
   Environment: [local/production]
   EOF
   ```
4. **Contact Support:** Dashboard → Help → Contact Support

---

## ✅ Success Checklist

Your setup is complete when:

```
□ All guides read (or bookmarked for reference)
□ .env.local configured correctly
□ Development server starts without errors
□ npm run check-tables shows 10/10 tables
□ curl localhost:3000/api/health returns "healthy"
□ Can query all tables successfully
□ Scripts from Guide #7 integrated
□ Team has access to this documentation
□ Backup procedures documented
□ Monitoring/alerts configured
```

---

## 📈 Maintenance Schedule

### Daily (2 minutes)
```bash
npm run daily-check
```

### Weekly (10 minutes)
```bash
npm run supabase:sync
# Review dashboard → Settings → API (check "Last Used")
# Verify RLS policies
```

### Monthly (30 minutes)
- Review all guides for updates
- Test key regeneration process (in dev)
- Update team documentation
- Review error logs

---

## 🎉 Success Stories

**After following these guides, you should be able to:**

✅ Diagnose any "Invalid API key" error in under 5 minutes  
✅ Safely regenerate keys without downtime  
✅ Verify schema sync without admin access  
✅ Deploy to production with confidence  
✅ Maintain a healthy Supabase connection  
✅ Troubleshoot issues independently  
✅ Help team members with setup

---

**Need something specific not covered?**
All guides include detailed troubleshooting sections. Start with Guide #6 for comprehensive step-by-step help.

**Quick navigation:** Use Ctrl+F to search across all guides for specific error messages or topics.

---

Last Updated: November 2025  
Version: 1.0  
Project: Georgian Distribution Management System  
Tech Stack: Next.js 15 + Supabase + TypeScript
