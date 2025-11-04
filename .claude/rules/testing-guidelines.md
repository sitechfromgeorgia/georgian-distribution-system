# Testing Guidelines

> **ტესტირების სახელმძღვანელო** | Comprehensive testing standards

---

## 🎯 Testing Philosophy

1. **Test Behavior, Not Implementation** - Focus on what users experience
2. **Write Tests That Give Confidence** - Not just for coverage metrics
3. **Test the Contract** - Verify public APIs and user interactions
4. **Fast Feedback Loop** - Tests should run quickly
5. **Maintainable Tests** - Tests should be easy to understand and update

---

## 🧪 Testing Stack

### Current Tools
- **Vitest v2.1.8** - Fast unit and integration testing
- **Testing Library** - React component testing
- **MSW (Mock Service Worker)** - API mocking
- **Puppeteer** - E2E testing (planned)

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## 📝 Testing Hierarchy

### 1. Unit Tests (70% of tests)
Test individual functions and utilities in isolation.

```typescript
// src/lib/order-utils.test.ts
import { describe, it, expect } from 'vitest'
import { calculateOrderTotal, formatOrderStatus } from './order-utils'

describe('calculateOrderTotal', () => {
  it('calculates total for single item', () => {
    const items = [{ product_id: '1', quantity: 2, unit_price: 10 }]
    expect(calculateOrderTotal(items)).toBe(20)
  })

  it('calculates total for multiple items', () => {
    const items = [
      { product_id: '1', quantity: 2, unit_price: 10 },
      { product_id: '2', quantity: 1, unit_price: 15 },
    ]
    expect(calculateOrderTotal(items)).toBe(35)
  })

  it('returns 0 for empty items', () => {
    expect(calculateOrderTotal([])).toBe(0)
  })

  it('handles decimal prices correctly', () => {
    const items = [{ product_id: '1', quantity: 3, unit_price: 10.99 }]
    expect(calculateOrderTotal(items)).toBeCloseTo(32.97, 2)
  })
})

describe('formatOrderStatus', () => {
  it('formats status in Georgian', () => {
    expect(formatOrderStatus('pending', 'ka')).toBe('მოლოდინში')
    expect(formatOrderStatus('confirmed', 'ka')).toBe('დადასტურებული')
    expect(formatOrderStatus('delivered', 'ka')).toBe('მიწოდებული')
  })

  it('formats status in English', () => {
    expect(formatOrderStatus('pending', 'en')).toBe('Pending')
    expect(formatOrderStatus('confirmed', 'en')).toBe('Confirmed')
  })
})
```

### 2. Integration Tests (20% of tests)
Test how components work together and with external services.

```typescript
// src/components/orders/OrderCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderCard } from './OrderCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('OrderCard', () => {
  const mockOrder = {
    id: '123',
    restaurant_id: 'rest-1',
    status: 'pending',
    total_amount: 150,
    created_at: '2025-11-03T10:00:00Z',
    items: [
      { product_id: 'p1', quantity: 2, unit_price: 50 },
      { product_id: 'p2', quantity: 1, unit_price: 50 },
    ],
  }

  it('renders order information', () => {
    renderWithProviders(<OrderCard order={mockOrder} />)

    expect(screen.getByText('Order #123')).toBeInTheDocument()
    expect(screen.getByText('150 ₾')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('calls onUpdate when status button clicked', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(
      <OrderCard order={mockOrder} onUpdate={onUpdate} />
    )

    const updateButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(updateButton)

    expect(onUpdate).toHaveBeenCalledWith('123', 'confirmed')
  })

  it('shows loading state during update', async () => {
    const onUpdate = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )
    const user = userEvent.setup()

    renderWithProviders(
      <OrderCard order={mockOrder} onUpdate={onUpdate} />
    )

    const updateButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(updateButton)

    expect(screen.getByText('Updating...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Updating...')).not.toBeInTheDocument()
    })
  })
})
```

### 3. E2E Tests (10% of tests)
Test complete user workflows from start to finish.

```typescript
// tests/e2e/order-workflow.test.ts
import { test, expect } from '@playwright/test'

test.describe('Order Workflow', () => {
  test('restaurant can create order and track status', async ({ page }) => {
    // 1. Login as restaurant
    await page.goto('/login')
    await page.fill('[name="email"]', 'restaurant@test.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 2. Navigate to order page
    await expect(page).toHaveURL('/dashboard/restaurant')
    await page.click('text=Place Order')

    // 3. Add items to order
    await page.click('[data-product-id="apple"]')
    await page.fill('[data-product-id="apple"] input[type="number"]', '5')
    await page.click('[data-product-id="banana"]')
    await page.fill('[data-product-id="banana"] input[type="number"]', '3')

    // 4. Submit order
    await page.click('button:has-text("Submit Order")')

    // 5. Verify success message
    await expect(page.locator('text=Order submitted successfully')).toBeVisible()

    // 6. Check order appears in history
    await page.click('text=Order History')
    await expect(page.locator('[data-order-status="pending"]')).toBeVisible()
  })
})
```

---

## 🎨 Component Testing Patterns

### Testing User Interactions

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('LoginForm', () => {
  it('submits form with valid credentials', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LoginForm onSubmit={onSubmit} />)

    // Type in fields
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // Submit form
    await user.click(screen.getByRole('button', { name: /login/i }))

    // Verify submission
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('shows validation errors for invalid input', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={vi.fn()} />)

    // Submit without filling fields
    await user.click(screen.getByRole('button', { name: /login/i }))

    // Expect validation errors
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })
})
```

### Testing Async Operations

```typescript
import { waitFor } from '@testing-library/react'

describe('OrdersList', () => {
  it('loads and displays orders', async () => {
    // Mock API response
    const mockOrders = [
      { id: '1', status: 'pending', total: 100 },
      { id: '2', status: 'confirmed', total: 200 },
    ]

    vi.mocked(fetchOrders).mockResolvedValue(mockOrders)

    render(<OrdersList />)

    // Initially shows loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument()
      expect(screen.getByText('Order #2')).toBeInTheDocument()
    })
  })

  it('handles error state', async () => {
    vi.mocked(fetchOrders).mockRejectedValue(new Error('Network error'))

    render(<OrdersList />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load orders/i)).toBeInTheDocument()
    })
  })
})
```

### Testing Real-time Updates

```typescript
describe('RealtimeOrdersList', () => {
  it('updates when new order arrives via WebSocket', async () => {
    const { rerender } = render(<RealtimeOrdersList />)

    // Initial orders
    expect(screen.getByText('Order #1')).toBeInTheDocument()

    // Simulate WebSocket message
    act(() => {
      mockWebSocket.emit('new-order', {
        id: '2',
        status: 'pending',
        total: 150,
      })
    })

    // Verify new order appears
    await waitFor(() => {
      expect(screen.getByText('Order #2')).toBeInTheDocument()
    })
  })
})
```

---

## 🔧 API Testing

### Mocking Supabase Client

```typescript
// src/lib/testing/supabase-mock.ts
import { vi } from 'vitest'

export function createSupabaseMock() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  }
}
```

### Testing API Routes

```typescript
// src/app/api/orders/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates order with valid data', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: 'rest-1',
        items: [{ product_id: 'p1', quantity: 2 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.order).toBeDefined()
    expect(data.order.restaurant_id).toBe('rest-1')
  })

  it('returns 400 for invalid data', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: 'invalid',
        items: [], // Empty items array
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('returns 401 for unauthenticated request', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: 'rest-1',
        items: [{ product_id: 'p1', quantity: 2 }],
      }),
    })

    // Mock no session
    vi.mocked(getSession).mockResolvedValue(null)

    const response = await POST(request)

    expect(response.status).toBe(401)
  })
})
```

---

## 🎯 Testing Best Practices

### DO ✅

```typescript
// ✅ Arrange, Act, Assert pattern
it('calculates discount correctly', () => {
  // Arrange
  const order = { total: 1000, discountPercent: 10 }

  // Act
  const result = applyDiscount(order)

  // Assert
  expect(result).toBe(900)
})

// ✅ Test one thing per test
it('validates email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true)
})

it('rejects invalid email', () => {
  expect(isValidEmail('invalid')).toBe(false)
})

// ✅ Use descriptive test names
it('returns empty array when no orders match the filter', () => {
  // ...
})

// ✅ Test edge cases
it('handles null input gracefully', () => {
  expect(formatDate(null)).toBe('N/A')
})

// ✅ Clean up after tests
afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})
```

### DON'T ❌

```typescript
// ❌ Test implementation details
it('calls useState hook', () => { // Bad
  // Don't test internal React hooks
})

// ❌ Multiple assertions without clear purpose
it('does everything', () => { // Bad
  expect(foo()).toBe(1)
  expect(bar()).toBe(2)
  expect(baz()).toBe(3)
})

// ❌ Rely on test execution order
it('first test', () => {
  globalState = 'changed'
})

it('second test', () => {
  expect(globalState).toBe('changed') // Bad - depends on order
})
```

---

## 📊 Coverage Goals

### Minimum Coverage Requirements
- **Overall:** 70% coverage
- **Critical paths:** 90% coverage (auth, orders, payments)
- **Utilities:** 80% coverage
- **Components:** 60% coverage

### How to Check Coverage

```bash
# Run tests with coverage
cd frontend
npm test -- --coverage

# View coverage report
open coverage/index.html
```

### Exclude from Coverage
- Configuration files
- Type definitions
- Test utilities
- Generated code
- Third-party integrations

---

## 🚀 Running Tests

### Development

```bash
# Run all tests
npm test

# Watch mode (recommended during development)
npm test -- --watch

# Run specific test file
npm test -- order-utils.test.ts

# Run tests matching pattern
npm test -- --grep "OrderCard"
```

### CI/CD

```bash
# Run tests with coverage in CI
npm test -- --coverage --run

# Generate coverage reports
npm test -- --coverage --reporter=json --reporter=html
```

---

## 🎓 Testing Checklist

Before committing:
- [ ] All new features have tests
- [ ] All tests pass locally
- [ ] Coverage meets minimum requirements
- [ ] No console errors or warnings
- [ ] Tests are deterministic (no flaky tests)
- [ ] Mock data is realistic
- [ ] Edge cases are covered
- [ ] Error states are tested

---

## 📚 Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

### Testing Patterns
- Test user behavior, not implementation
- Use Testing Library queries in priority order:
  1. `getByRole` (most accessible)
  2. `getByLabelText`
  3. `getByPlaceholderText`
  4. `getByText`
  5. `getByTestId` (last resort)

---

**Last Updated:** 2025-11-03
**Testing Framework:** Vitest v2.1.8
**Coverage Target:** 70% overall, 90% critical paths
