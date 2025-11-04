# /deploy - Production Deployment

> Quick command to deploy to production

---

## 🚀 What This Command Does

Guides you through the production deployment process with all necessary checks.

---

## ⚠️ Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console.log statements
- [ ] No TODO comments for critical items

### Security
- [ ] Environment variables configured
- [ ] No secrets in code
- [ ] RLS policies tested
- [ ] Authentication working
- [ ] CSRF protection active

### Database
- [ ] Migration scripts tested
- [ ] Backup taken
- [ ] Rollback plan ready

### Documentation
- [ ] Changelog updated
- [ ] README updated (if needed)

---

## 📋 Deployment Steps

### 1. Prepare Release

```bash
# Ensure on main branch
git checkout main
git pull origin main

# Run final checks
npm test && npm run type-check && npm run lint && npm run build

# Tag release
git tag -a v1.X.X -m "Release v1.X.X: Feature Name"
git push origin v1.X.X
```

### 2. Database Migration (if needed)

```bash
# SSH to production server
ssh user@data.greenland77.ge

# Backup database
pg_dump -U postgres georgian_distribution > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
psql -U postgres georgian_distribution -f migrations/00X_migration.sql

# Verify migration
psql -U postgres georgian_distribution -c "\d orders"
```

### 3. Deploy Application

#### Option A: Dockploy (Automatic)
```bash
# Push to main triggers auto-deployment
git push origin main

# Monitor deployment at:
# https://dockploy.greenland77.ge
```

#### Option B: Manual Deployment
```bash
# SSH to production
ssh user@greenland77.ge

# Navigate to app directory
cd /app/georgian-distribution

# Pull latest
git pull origin main

# Install dependencies
cd frontend
npm install

# Build
npm run build

# Restart
pm2 restart georgian-distribution
```

### 4. Verify Deployment

```bash
# Health check
curl https://greenland77.ge/api/health

# Database connectivity
curl https://greenland77.ge/api/health/db

# Manual verification
# 1. Login to application
# 2. Test critical workflows
# 3. Check real-time updates
```

---

## ✅ Post-Deployment Checks

### Smoke Tests
- [ ] Home page loads
- [ ] Login works for all roles
- [ ] Admin dashboard accessible
- [ ] Restaurant can place order
- [ ] Driver sees deliveries
- [ ] Real-time updates working

### Monitoring
- [ ] Check Sentry for errors
- [ ] Monitor server resources
- [ ] Check database performance
- [ ] Verify WebSocket connections

---

## 🔙 Rollback Procedure

If deployment fails:

```bash
# Option 1: Dockploy rollback
# Go to Dockploy dashboard → Rollback to previous deployment

# Option 2: Manual rollback
ssh user@greenland77.ge
cd /app/georgian-distribution
git revert HEAD
npm run build
pm2 restart georgian-distribution

# Option 3: Database rollback
ssh user@data.greenland77.ge
psql -U postgres georgian_distribution < backup_20251103_120000.sql
```

---

## 🚨 Hotfix Deployment

For critical bugs:

```bash
# 1. Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Fix the bug (minimal changes)
# ...

# 3. Test fix
npm test && npm run build

# 4. Commit and deploy
git add .
git commit -m "hotfix: critical issue description"
git push origin hotfix/critical-issue

# 5. Create and merge PR
gh pr create --title "hotfix: critical issue" --base main
gh pr merge --squash

# 6. Monitor deployment
# Dockploy auto-deploys
# Watch Sentry closely
```

---

## 📊 Deployment Metrics

Track after deployment:
- **Deployment time:** Target < 10 minutes
- **Downtime:** Target 0 seconds (zero-downtime)
- **Error rate:** Monitor via Sentry
- **Performance:** Check response times

---

## 📞 Emergency Contacts

If something goes wrong:
1. Check Sentry: https://sentry.io/organizations/sitech-bg/
2. Check server: SSH and review logs
3. Check database: Verify connectivity
4. **Rollback if critical**
5. Notify team

---

## 🎉 Deployment Complete!

After successful deployment:
- [ ] Update `.claude/context.md` with deployment info
- [ ] Close related issues/PRs
- [ ] Announce to team
- [ ] Monitor for 1 hour post-deployment

---

**Deployment Time:** ~10-15 minutes
**Rollback Time:** ~5 minutes
**Last Updated:** 2025-11-03
