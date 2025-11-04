# /test-feature - Test Current Feature

> Quick command to run comprehensive tests for the current feature

---

## 🧪 What This Command Does

Runs a complete test suite for your current feature branch including unit tests, integration tests, type checking, and linting.

---

## 📋 Test Execution

### 1. Run All Tests

```bash
cd frontend

# Run all tests
npm test

# Watch mode (for development)
npm test -- --watch

# With coverage
npm test -- --coverage
```

### 2. Type Checking

```bash
# Check TypeScript errors
npm run type-check
```

### 3. Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### 4. Build Verification

```bash
# Verify production build works
npm run build
```

---

## ✅ Test Categories

### Unit Tests
```bash
# Run unit tests only
npm test -- --grep "unit"

# Test specific file
npm test -- order-utils.test.ts
```

### Integration Tests
```bash
# Run integration tests
npm test -- --grep "integration"
```

### Component Tests
```bash
# Test React components
npm test -- --grep "Component"
```

---

## 📊 Coverage Report

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/index.html
```

### Coverage Requirements
- **Overall:** 70% minimum
- **Critical paths:** 90% (auth, orders, payments)
- **Utilities:** 80%
- **Components:** 60%

---

## 🎯 Role-Based Testing

### Test as Admin
```typescript
// Login as admin in tests
const adminUser = {
  id: 'admin-id',
  role: 'admin',
  email: 'admin@test.com'
}
```

### Test as Restaurant
```typescript
// Login as restaurant in tests
const restaurantUser = {
  id: 'restaurant-id',
  role: 'restaurant',
  email: 'restaurant@test.com'
}
```

### Test as Driver
```typescript
// Login as driver in tests
const driverUser = {
  id: 'driver-id',
  role: 'driver',
  email: 'driver@test.com'
}
```

---

## 🔍 Manual Testing Checklist

### Feature Testing
- [ ] Feature works as expected
- [ ] All user roles tested
- [ ] Error states handled
- [ ] Loading states displayed
- [ ] Success states shown
- [ ] Real-time updates working
- [ ] Mobile responsive
- [ ] Accessibility standards met

### Security Testing
- [ ] RLS policies enforced
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Input validation working
- [ ] CSRF protection active

### Performance Testing
- [ ] Page loads < 3 seconds
- [ ] No console errors
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] Efficient re-renders

---

## 🐛 Debug Failed Tests

### View Test Output
```bash
# Run tests with detailed output
npm test -- --reporter=verbose

# Run single test file
npm test -- failing-test.test.ts
```

### Debug in VS Code
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--inspect-brk"],
  "console": "integratedTerminal"
}
```

---

## 📝 Test Report

After running tests, check:
- [ ] All tests passing
- [ ] Coverage meets requirements
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Build succeeds
- [ ] Manual testing complete

---

## 🚀 Ready to Commit?

Before committing:
```bash
# Run full pre-commit check
npm run type-check && npm run lint && npm test && npm run build
```

If all pass ✅ you're ready to commit!

---

**Test Duration:** ~2-5 minutes
**Last Updated:** 2025-11-03
