# Testing Guide - Georgian Distribution System 🧪

Testing სტრატეგია და გზამკვლევი Phase 3-ის ფარგლებში.

---

## 📋 Testing Stack

- **Test Runner:** Vitest v2
- **Test Environment:** happy-dom (React DOM simulation)
- **Testing Library:** @testing-library/react
- **Coverage:** v8 (80% target)
- **Mocking:** Vitest native mocks

---

## 🎯 Coverage Targets

### Global Thresholds:
```typescript
{
  branches: 70%,
  functions: 80%,
  lines: 80%,
  statements: 80%
}
```

### Component Thresholds (lower, UI is harder to test):
```typescript
{
  branches: 60%,
  functions: 70%,
  lines: 70%,
  statements: 70%
}
```

---

## 📁 Test File Structure

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx          # Component tests
├── lib/
│   └── logger/
│       ├── logger.ts
│       └── logger.test.ts           # Utility tests
├── hooks/
│   └── useAuth/
│       ├── useAuth.ts
│       └── useAuth.test.ts          # Hook tests
└── services/
    └── api/
        ├── api.service.ts
        └── api.service.test.ts      # Service tests
```

---

## 🧪 Test Categories

### 1. Unit Tests (70%)
პირველადი ფოკუსი - individual functions and utilities

**მაგალითი:**
```typescript
// logger.test.ts
import { describe, it, expect, vi } from 'vitest'
import { logger } from '@/lib/logger'

describe('logger', () => {
  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'log')
    logger.info('Test message', { context: 'test' })
    expect(consoleSpy).toHaveBeenCalled()
  })
})
```

### 2. Integration Tests (20%)
Multiple components/services working together

**მაგალითი:**
```typescript
// auth-flow.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/LoginForm'

describe('Auth Flow', () => {
  it('should login user and redirect', async () => {
    render(<LoginForm />)
    // Test full login flow
  })
})
```

### 3. E2E Tests (10%)
Full user workflows (future - Playwright)

---

## 🔧 Running Tests

### Basic Commands:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- logger.test.ts

# Run with UI
npm run test:ui
```

### CI/CD:
```bash
# Run in CI mode (single thread)
CI=true npm run test:coverage
```

---

## 📝 Writing Tests

### Test Structure (AAA Pattern):
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Component/Function Name', () => {
  // Setup
  beforeEach(() => {
    // Arrange: Setup test data
  })

  afterEach(() => {
    // Cleanup
  })

  it('should do something specific', () => {
    // Arrange: Prepare test data
    const input = 'test'

    // Act: Execute the function
    const result = myFunction(input)

    // Assert: Verify the result
    expect(result).toBe('expected')
  })
})
```

### Component Testing:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)

    fireEvent.click(screen.getByText('Click'))

    await waitFor(() => {
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  it('should be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})
```

### Hook Testing:
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('should return user when authenticated', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toBeDefined()
    })
  })
})
```

### API Mocking (Supabase):
```typescript
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{ id: '1', name: 'Test' }],
          error: null
        }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { user: { id: '1' } } },
        error: null
      }))
    }
  }))
}))
```

---

## ✅ Testing Checklist

### Before Writing Tests:
- [ ] პროექტის test ფოლდერში ნახე მსგავსი ტესტები
- [ ] განსაზღვრე რა უნდა დატესტო (happy path + edge cases)
- [ ] მოამზადე test data და mocks

### Writing Tests:
- [ ] გამოიყენე `describe` blocks ლოგიკური დაჯგუფებისთვის
- [ ] თითოეული test უნდა იყოს independent
- [ ] გამოიყენე meaningful test names (should/when/given)
- [ ] Test both success და error scenarios
- [ ] დაამატე comments complex tests-ში

### After Writing Tests:
- [ ] გაუშვი tests locally: `npm test`
- [ ] შეამოწმე coverage: `npm run test:coverage`
- [ ] დარწმუნდი რომ არ არის flaky tests
- [ ] Update documentation თუ საჭიროა

---

## 🚫 What NOT to Test

❌ **არ დატესტო:**
- Third-party libraries (Supabase, Next.js)
- Simple type definitions
- Configuration files
- Generated code
- Trivial getters/setters

✅ **დატესტე:**
- Business logic
- Complex calculations
- User interactions
- Error handling
- Edge cases
- Critical paths (auth, orders, payments)

---

## 📊 Coverage Reports

Coverage reports იქმნება `coverage/` დირექტორიაში:

```
coverage/
├── index.html          # Visual coverage report
├── lcov.info           # CI/CD coverage data
└── coverage-final.json # Detailed coverage data
```

**ნახე coverage:**
```bash
npm run test:coverage
open coverage/index.html  # macOS
start coverage/index.html # Windows
```

---

## 🔍 Debugging Tests

### VS Code Debug:
1. დაამატე breakpoint
2. Press F5 (Debug: Vitest)
3. Tests გაშვება debug mode-ში

### Console Logs:
```typescript
it('should debug', () => {
  console.log('Debug info:', data)
  // test logic
})
```

### Verbose Output:
```bash
npm test -- --reporter=verbose
```

---

## 🎯 Testing Priorities

### High Priority (Must Test):
1. **Auth flows** - login, logout, session
2. **Order creation** - full workflow
3. **User role permissions** - RBAC
4. **Data validation** - Zod schemas
5. **Error boundaries** - error handling

### Medium Priority:
6. Critical components (forms, modals)
7. Complex hooks (useAuth, useOrders)
8. Business logic utilities
9. API services

### Low Priority:
10. UI components (buttons, cards)
11. Layout components
12. Static pages

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🚀 Next Steps

1. **რუნდ 1:** Critical path tests (auth, orders)
2. **რუნდ 2:** Component tests (forms, tables)
3. **რუნდ 3:** Utility tests (logger, validators)
4. **რუნდ 4:** Integration tests
5. **რუნდ 5:** Coverage improvement to 80%+

---

**მზად ვართ testing-ისთვის!** 🧪

იხილე example tests `src/components/` და `src/lib/` ფოლდერებში.
