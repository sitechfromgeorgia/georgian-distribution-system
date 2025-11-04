# Bug Fixing Workflow

> **ბაგების გამოსწორება** | Systematic approach to fixing bugs

---

## 🐛 Bug Reporting

### 1. Create Bug Report

```markdown
**Bug Title:** Clear, concise description

**Environment:**
- Browser: Chrome 120
- Device: Desktop/Mobile
- User Role: Admin/Restaurant/Driver/Demo

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[Attach screenshots if applicable]

**Error Messages:**
```
Error log from console/Sentry
```

**Priority:** Critical/High/Medium/Low
```

### 2. Check Sentry

```bash
# Search for error in Sentry dashboard
https://sentry.io/organizations/sitech-bg/projects/georgian-distribution/

# Filter by:
- Time range
- User role
- Error type
- Browser/device
```

---

## 🔍 Investigation Phase

### 1. Reproduce the Bug

```bash
# Checkout main or affected branch
git checkout main

# Start development server
cd frontend
npm run dev

# Follow steps to reproduce
# Note any additional observations
```

### 2. Identify Root Cause

**Common bug categories:**

1. **RLS Policy Issues**
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'orders';

   -- Test as different roles
   SET request.jwt.claims TO '{"sub": "user-id", "role": "restaurant"}';
   SELECT * FROM orders; -- Should only see own orders
   ```

2. **Type Errors**
   ```bash
   npm run type-check
   # Fix TypeScript errors
   ```

3. **State Management**
   ```typescript
   // Check React Query cache
   // Check Zustand state
   // Verify real-time subscriptions
   ```

4. **API Errors**
   ```typescript
   // Check API route implementation
   // Verify input validation
   // Test error handling
   ```

---

## 🔧 Fix Implementation

### 1. Create Bug Fix Branch

```bash
git checkout main
git pull origin main
git checkout -b fix/bug-description
```

### 2. Write Failing Test First (TDD)

```typescript
// tests/bug-123.test.ts
describe('Bug #123: Order status not updating', () => {
  it('updates order status correctly', async () => {
    const { result } = renderHook(() => useUpdateOrder())

    await act(async () => {
      await result.current.mutate({ id: 'order-1', status: 'confirmed' })
    })

    expect(result.current.isSuccess).toBe(true)
    // This test should fail before fix
  })
})
```

### 3. Implement Fix

```typescript
// Example: Fix RLS policy
-- Before (broken)
CREATE POLICY "restaurant_update_orders" ON orders
  FOR UPDATE
  USING (true); -- ❌ Allows anyone to update

-- After (fixed)
CREATE POLICY "restaurant_update_orders" ON orders
  FOR UPDATE
  USING (restaurant_id = auth.uid())
  WITH CHECK (restaurant_id = auth.uid());
```

### 4. Verify Fix

```bash
# Run tests
npm test

# Manual testing
npm run dev
# Verify bug is fixed
```

---

## 🧪 Testing Phase

### 1. Regression Testing

- [ ] Original bug is fixed
- [ ] No new bugs introduced
- [ ] Related functionality still works
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes

### 2. Test All Roles

- [ ] Admin role unaffected
- [ ] Restaurant role works correctly
- [ ] Driver role works correctly
- [ ] Demo role works correctly

---

## 📝 Documentation

### 1. Update Changelog

```markdown
## [Version X.Y.Z] - 2025-11-03

### Fixed
- Order status update not reflecting for restaurant users (#123)
- RLS policy now correctly restricts updates to own orders
```

### 2. Add Regression Test

```typescript
// Prevent this bug from happening again
describe('Regression: Order status update bug #123', () => {
  it('restaurant can only update own orders', async () => {
    // Test implementation
  })
})
```

---

## 🚀 Deployment

### 1. Commit Fix

```bash
git add .
git commit -m "fix: restaurant order status update (#123)

- Update RLS policy to restrict order updates
- Add regression test
- Verify all roles work correctly

Fixes #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. Create PR

```bash
gh pr create \
  --title "fix: restaurant order status update (#123)" \
  --body "Fixes #123

## Root Cause
RLS policy was allowing any authenticated user to update orders.

## Solution
Updated policy to restrict updates to order owner only.

## Testing
- [x] Bug reproduced and fixed
- [x] Regression test added
- [x] All existing tests pass
- [x] Manual testing completed"
```

### 3. Deploy

- Priority determines deployment schedule:
  - **Critical:** Hotfix immediately
  - **High:** Next deployment cycle
  - **Medium/Low:** Next release

---

## 📊 Post-Fix Monitoring

### 1. Verify in Production

- [ ] Error no longer appears in Sentry
- [ ] User reports issue resolved
- [ ] No new related errors

### 2. Close Issue

```markdown
Fixed in #PR-number
Deployed to production on 2025-11-03
Verified working ✅
```

---

**Last Updated:** 2025-11-03
