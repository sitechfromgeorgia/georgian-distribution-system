# Deployment Workflow

> **განლაგების პროცესი** | Production deployment procedures

---

## 🚀 Deployment Overview

### Environments

1. **Development** - localhost:3000 (Official Supabase hosted)
2. **Staging** - [Coming soon] (VPS staging environment)
3. **Production** - greenland77.ge (Self-hosted VPS)

---

## 📋 Pre-Deployment Checklist

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
- [ ] Security headers configured

### Database
- [ ] Migration scripts tested
- [ ] Backup taken
- [ ] Rollback plan ready
- [ ] RLS policies verified
- [ ] Indexes created

### Documentation
- [ ] Changelog updated
- [ ] README updated (if needed)
- [ ] API documentation current
- [ ] Migration guide written (if breaking changes)

---

## 🔄 Deployment Process

### Option 1: Standard Deployment (Dockploy)

```bash
# 1. Merge to main
git checkout main
git pull origin main

# 2. Tag release
git tag -a v1.2.0 -m "Release v1.2.0: Restaurant Order Management"
git push origin v1.2.0

# 3. Dockploy auto-deploys from main branch
# Monitor deployment at: https://dockploy.greenland77.ge

# 4. Run database migrations (if needed)
ssh user@data.greenland77.ge
psql -U postgres -d georgian_distribution -f migrations/00X_migration.sql

# 5. Verify deployment
curl https://greenland77.ge/api/health
```

### Option 2: Manual Deployment

```bash
# 1. SSH to VPS
ssh user@greenland77.ge

# 2. Navigate to application directory
cd /app/georgian-distribution

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
cd frontend
npm install

# 5. Build production bundle
npm run build

# 6. Restart application
pm2 restart georgian-distribution

# 7. Verify
curl http://localhost:3000/api/health
```

---

## 🗄️ Database Migration

### Production Migration Process

```bash
# 1. Backup database
ssh user@data.greenland77.ge
pg_dump -U postgres georgian_distribution > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration on backup
createdb georgian_distribution_test
psql -U postgres georgian_distribution_test < backup_20251103_120000.sql
psql -U postgres georgian_distribution_test -f migrations/005_new_feature.sql

# 3. If successful, apply to production
psql -U postgres georgian_distribution -f migrations/005_new_feature.sql

# 4. Verify migration
psql -U postgres georgian_distribution -c "\d orders"
psql -U postgres georgian_distribution -c "SELECT * FROM pg_policies WHERE tablename = 'orders';"
```

---

## ✅ Post-Deployment Verification

### Health Checks

```bash
# 1. Application health
curl https://greenland77.ge/api/health

# 2. Database connectivity
curl https://greenland77.ge/api/health/db

# 3. Authentication working
# Login to application and verify

# 4. Real-time updates
# Create order and verify real-time update
```

### Smoke Tests

- [ ] Home page loads
- [ ] Login works for all roles
- [ ] Admin dashboard accessible
- [ ] Restaurant can place order
- [ ] Driver sees deliveries
- [ ] Real-time updates working
- [ ] Database queries performant

### Monitoring

- [ ] Check Sentry for new errors
- [ ] Monitor server resources (CPU, RAM, disk)
- [ ] Check database performance
- [ ] Verify real-time connections stable

---

## 🔙 Rollback Procedure

### If Deployment Fails

```bash
# 1. Quick rollback via Dockploy
# Go to Dockploy dashboard → Deployments → Rollback to previous

# 2. Manual rollback
ssh user@greenland77.ge
cd /app/georgian-distribution
git revert HEAD
npm run build
pm2 restart georgian-distribution

# 3. Database rollback (if needed)
psql -U postgres georgian_distribution < backup_20251103_120000.sql

# 4. Verify rollback successful
curl https://greenland77.ge/api/health
```

---

## 🚨 Hotfix Deployment

### Critical Bug in Production

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Fix the bug
# [Make minimal changes to fix critical issue]

# 3. Test fix
npm test
npm run build

# 4. Commit and push
git add .
git commit -m "hotfix: critical issue description"
git push origin hotfix/critical-issue

# 5. Create PR and get quick approval
gh pr create --title "hotfix: critical issue" --base main

# 6. Merge and deploy immediately
gh pr merge --squash
# Dockploy auto-deploys

# 7. Monitor closely
# Watch Sentry, server logs, user reports
```

---

## 📊 Deployment Metrics

### Track These Metrics

- **Deployment frequency:** How often we deploy
- **Lead time:** Time from commit to production
- **MTTR:** Mean time to recovery from incidents
- **Change failure rate:** % of deployments causing issues

### Current Targets

- Deploy frequency: Weekly
- Lead time: < 1 day
- MTTR: < 2 hours
- Change failure rate: < 5%

---

## 🔐 Environment Variables

### Production Environment

```bash
# Frontend (.env.production)
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_SENTRY_DSN=[sentry-dsn]
NODE_ENV=production

# Backend (Supabase)
DATABASE_URL=postgresql://postgres:[password]@localhost:5432/georgian_distribution
JWT_SECRET=[jwt-secret]
SITE_URL=https://greenland77.ge
```

**Security:**
- Never commit `.env` files
- Store secrets in Dockploy environment variables
- Rotate keys regularly

---

## 📞 Emergency Contacts

### If Something Goes Wrong

1. **Check Sentry:** https://sentry.io/organizations/sitech-bg/
2. **Check Server Status:** SSH to VPS and check logs
3. **Check Database:** Verify database is accessible
4. **Rollback:** Follow rollback procedure above
5. **Notify Team:** Update team on status

---

**Last Updated:** 2025-11-03
**Deployment Platform:** Dockploy on Contabo VPS
