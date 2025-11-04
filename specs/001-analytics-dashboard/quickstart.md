# Quickstart Guide: Analytics Dashboard KPIs

**Feature**: Analytics Dashboard KPIs  
**Branch**: `001-analytics-dashboard`  
**Date**: 2025-11-01

## Overview

This guide provides step-by-step instructions for setting up, developing, and testing the Analytics Dashboard feature. Follow these steps to get the dashboard running locally and verify its functionality.

## Prerequisites

### Required Software

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher (comes with Node.js)
- **Git**: For version control
- **PostgreSQL Client**: For database migration (optional, Supabase CLI preferred)
- **Supabase CLI**: For local database management (recommended)

### Required Access

- **Supabase Project**: Access to development Supabase instance
- **Database Credentials**: Connection string and API keys
- **Admin Account**: Test account with admin role for dashboard access

### Knowledge Requirements

- Basic understanding of Next.js and React
- Familiarity with TypeScript
- Basic SQL for database queries (optional)

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Distribution-Managment
git checkout 001-analytics-dashboard
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create `.env.local` file in `frontend/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: For local Supabase (development)
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find values**:
- Log in to Supabase Dashboard → Settings → API
- Copy "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
- Copy "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Database Migration (Composite Index)

**Option A: Using Supabase CLI** (Recommended)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Create migration file
supabase migration new add_analytics_index

# Add SQL to migration file:
# migrations/XXXXXX_add_analytics_index.sql
```

Add this SQL to the migration file:

```sql
-- Create composite index for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_analytics 
ON orders(created_at, status, delivery_time)
WHERE status IN ('delivered', 'completed', 'cancelled');

-- Verify index creation
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'orders' 
AND indexname = 'idx_orders_analytics';
```

Apply migration:

```bash
supabase db push
```

**Option B: Using SQL Editor** (Alternative)

1. Open Supabase Dashboard → SQL Editor
2. Run the SQL above directly
3. Verify index exists in Database → Indexes section

### 5. Verify Database Setup

Run this query in Supabase SQL Editor to confirm setup:

```sql
-- Check if index exists
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname = 'idx_orders_analytics';

-- Check sample data
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN delivery_time IS NOT NULL THEN 1 END) as delivered_orders,
  MIN(created_at) as earliest_order,
  MAX(created_at) as latest_order
FROM orders;
```

**Expected Output**:
- Index exists with definition matching above
- At least a few orders for testing (if not, seed data needed)

## Development Server

### 1. Start Next.js Development Server

```bash
cd frontend
npm run dev
```

**Expected Output**:
```
 ▲ Next.js 15.1.6
 - Local:        http://localhost:3000
 - ready started server on [::]:3000, url: http://localhost:3000
```

### 2. Access Application

Open browser: `http://localhost:3000`

### 3. Login as Admin

1. Navigate to `/login`
2. Enter admin credentials (or create admin account if needed)
3. Verify authentication completes successfully
4. Check browser DevTools Console for any errors (should be clean)

### 4. Navigate to Analytics Dashboard

**URL**: `http://localhost:3000/analytics`

**Expected Behavior**:
- Dashboard loads within 2 seconds
- Three KPI cards display: Orders/Day, On-time Rate, Avg Delivery Time
- Date range filter shows default "Last 7 Days"
- Status filter shows "All Statuses" (no filter applied)
- Export CSV button is visible

### 5. Verify KPI Calculations

**Test Case 1: Default View (Last 7 Days)**

- **Expected**: KPIs display numeric values or "N/A" if no data
- **Verify**: Check browser DevTools Network tab for API call to `/api/analytics/kpis?from=...&to=...`
- **Response Time**: Should be <2 seconds

**Test Case 2: Apply Status Filter**

1. Click Status Filter dropdown
2. Select "Delivered" and "Completed"
3. Click Apply
4. **Expected**: KPIs recalculate and update within 2 seconds
5. **Verify**: Network request includes `&status=delivered,completed`

**Test Case 3: Change Date Range**

1. Click "Last 30 Days" preset button
2. **Expected**: KPIs update for new range
3. **Verify**: API request shows updated `from` and `to` parameters

**Test Case 4: Custom Date Range**

1. Click "Custom Range" dropdown
2. Select custom start and end dates
3. Click Apply
4. **Expected**: KPIs update for custom range
5. **Verify**: Timezone displayed as "UTC+4" or "Georgia Time"

**Test Case 5: CSV Export**

1. Apply filters (e.g., Last 7 Days, Delivered status)
2. Click "Export CSV" button
3. **Expected**: CSV file downloads with filename `analytics-export-YYYY-MM-DD.csv`
4. **Verify**: Open CSV in Excel/Sheets and check:
   - Headers match specification
   - Data matches on-screen filters
   - Currency formatted as "XX.XX GEL"

## Testing

### Unit Tests

Run unit tests for analytics logic:

```bash
cd frontend
npm run test:unit
```

**Expected Output**:
- All tests pass (green checkmarks)
- Zero failures or errors

**Coverage Areas**:
- KPI calculation functions
- Date range validation
- Status filter validation
- CSV formatting

### End-to-End Tests

Run E2E tests with Puppeteer:

```bash
cd frontend
npm run test:e2e
```

**Test Scenarios**:
1. Login as admin
2. Navigate to analytics dashboard
3. Verify KPI cards render
4. Apply filters and verify updates
5. Export CSV and verify download

### Manual Quality Checks

**Browser Console Hygiene** (CRITICAL):
1. Open Chrome DevTools Console (`F12`)
2. Navigate to analytics dashboard
3. **Verify**: Zero errors, zero warnings
4. **Expected**: Only informational logs (if any)

**TypeScript Type Check**:

```bash
npm run type-check
```

**Expected**: No TypeScript errors

**ESLint Check**:

```bash
npm run lint -- --max-warnings=0
```

**Expected**: Zero warnings, zero errors

**Lighthouse Performance Audit**:
1. Open Chrome DevTools → Lighthouse tab
2. Run audit on `/analytics` page
3. **Target**: LCP <2.5s, FCP <1.8s

## Verification Checklist

Before considering feature complete, verify:

- [✅] Development server starts without errors
- [✅] Admin user can access `/analytics` route
- [✅] Non-admin user sees "Access Denied" message
- [✅] KPI cards display data for Last 7 Days (default)
- [✅] Date range presets (7/14/30 days) work correctly
- [✅] Custom date range selector works correctly
- [✅] Status filter updates KPIs correctly
- [✅] CSV export downloads with correct data
- [✅] No console errors in browser DevTools
- [✅] `npm run type-check` passes with 0 errors
- [✅] `npm run lint -- --max-warnings=0` passes
- [✅] Dashboard loads within 2 seconds (7-30 day range)
- [✅] Excluded orders count displays when data is incomplete
- [✅] Timezone displays as "UTC+4" or "Georgia Time"
- [✅] Currency displays as "GEL" with ₾ symbol

## Troubleshooting

### Issue: Dashboard shows "Access Denied"

**Cause**: User role is not `admin`

**Solution**:
1. Check user role in Supabase Dashboard → Authentication → Users
2. Update role in `profiles` table: `UPDATE profiles SET role = 'admin' WHERE id = '<user-id>';`
3. Logout and login again to refresh JWT token

### Issue: KPIs show "N/A" for all values

**Cause**: No orders in database matching date range/filters

**Solution**:
1. Check database: `SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days';`
2. If zero, seed test data or adjust date range to include existing data
3. Check console for API errors (401/403 = auth issue, 500 = server error)

### Issue: CSV export fails with 500 error

**Cause**: Server-side error during CSV generation

**Solution**:
1. Check terminal logs for error stack trace
2. Verify database connection is active
3. Check RLS policies allow admin to SELECT orders
4. Verify `profiles` table join is working (restaurant/driver names)

### Issue: Slow query times (>5 seconds)

**Cause**: Missing database index or large date range

**Solution**:
1. Verify composite index exists: `\d orders` in psql or check Supabase Dashboard
2. Check query plan: `EXPLAIN ANALYZE SELECT ... FROM orders WHERE ...;`
3. Narrow date range (suggest <90 days to user)
4. Monitor Supabase Dashboard → Database → Query Performance

### Issue: TypeScript errors during build

**Cause**: Type mismatch or missing type definitions

**Solution**:
1. Run `npm run type-check` to see specific errors
2. Regenerate Supabase types: `supabase gen types typescript --local > src/types/supabase.ts`
3. Fix type annotations in analytics components/services
4. Ensure all imports reference correct types

## Development Workflow

### Making Changes

1. **Edit Code**: Make changes to components, services, or API routes
2. **Type Check**: Run `npm run type-check` frequently
3. **Lint**: Run `npm run lint` to catch code quality issues
4. **Test**: Run `npm run test:unit` for relevant tests
5. **Manual Test**: Verify changes in browser with DevTools open
6. **Commit**: Use clear commit messages (e.g., "Add date range validation to analytics KPI API")

### Pre-Commit Checklist

Before committing code:

- [ ] `npm run type-check` passes
- [ ] `npm run lint -- --max-warnings=0` passes
- [ ] No console errors in browser
- [ ] Relevant unit tests pass
- [ ] Feature works as expected in manual testing

### Deployment to Production

1. **Merge to main**: After PR approval, merge feature branch
2. **Database Migration**: Apply composite index to production database (use `CONCURRENTLY`)
3. **Deploy Frontend**: Deploy Next.js app to Vercel/VPS
4. **Verify Production**: Test dashboard with production data
5. **Monitor**: Check Sentry/logs for errors in first 24 hours

## Next Steps

After completing quickstart and verification:

1. **Review Generated Artifacts**: Read `plan.md`, `research.md`, `data-model.md`, and contract files
2. **Run `/speckit.tasks` Command**: Break down implementation into granular tasks
3. **Begin Implementation**: Start with P1 user story (View KPIs by date range)
4. **Iterate**: Implement P2 (Filter by status), then P3 (CSV export)
5. **QA Review**: Full testing against acceptance criteria in `spec.md`

## Support

For questions or issues:

- **Documentation**: Refer to `plan.md` and `data-model.md` in this spec directory
- **Code Examples**: See API contract files in `contracts/` directory
- **Architecture**: Review `project-documentation/architecture/` in repo root
- **Team**: Reach out to tech lead or post in development channel

---

**Status**: ✅ Ready for Development  
**Last Updated**: 2025-11-01
