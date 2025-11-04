# Testing Workflow

> **ტესტირების პროცესი** | Comprehensive testing strategy

---

## 🧪 Testing Strategy

### Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Critical user journeys
     /      \
    /________\   Integration Tests (20%)
   /          \  - Component + API interactions
  /____________\
 /              \ Unit Tests (70%)
/________________\ - Functions, utilities, hooks
```

---

## 🏃 Quick Testing Commands

```bash
# Run all tests
npm test

# Watch mode (development)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific test file
npm test -- order-utils.test.ts

# Run tests matching pattern
npm test -- --grep "OrderCard"

# UI mode (interactive)
npm test -- --ui
```

---

## 📝 Writing Tests

### 1. Unit Tests (Utilities & Functions)

```typescript
// src/lib/order-utils.test.ts
import { describe, it, expect } from 'vitest'
import { calculateOrderTotal, formatOrderStatus } from './order-utils'

describe('calculateOrderTotal', () => {
  it('calculates total correctly', () => {
    const items = [
      { quantity: 2, unit_price: 10 },
      { quantity: 3, unit_price: 15 },
    ]
    expect(calculateOrderTotal(items)).toBe(65)
  })

  it('handles empty array', () => {
    expect(calculateOrderTotal([])).toBe(0)
  })

  it('handles decimal precision', () => {
    const items = [{ quantity: 3, unit_price: 10.99 }]
    expect(calculateOrderTotal(items)).toBeCloseTo(32.97, 2)
  })
})
```

### 2. Component Tests

```typescript
// src/components/orders/OrderCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderCard } from './OrderCard'
import { createWrapper } from '@/test-utils'

describe('OrderCard', () => {
  const mockOrder = {
    id: '123',
    restaurant_id: 'rest-1',
    status: 'pending',
    total_amount: 150,
    created_at: '2025-11-03T10:00:00Z',
  }

  it('renders order information', () => {
    render(<OrderCard order={mockOrder} />, { wrapper: createWrapper() })

    expect(screen.getByText('Order #123')).toBeInTheDocument()
    expect(screen.getByText('150 ₾')).toBeInTheDocument()
  })

  it('handles status update', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()

    render(
      <OrderCard order={mockOrder} onUpdate={onUpdate} />,
      { wrapper: createWrapper() }
    )

    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(onUpdate).toHaveBeenCalledWith('123', 'confirmed')
  })
})
```

### 3. Hook Tests

```typescript
// src/hooks/useOrders.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useOrders } from './useOrders'
import { createWrapper } from '@/test-utils'

describe('useOrders', () => {
  it('fetches orders successfully', async () => {
    const { result } = renderHook(() => useOrders('rest-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('handles error state', async () => {
    vi.mocked(fetchOrders).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useOrders('rest-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
```

### 4. API Route Tests

```typescript
// src/app/api/orders/route.test.ts
import { POST } from './route'
import { NextRequest } from 'next/server'

describe('POST /api/orders', () => {
  it('creates order with valid data', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        restaurant_id: 'rest-1',
        items: [{ product_id: 'p1', quantity: 2 }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('returns 400 for invalid data', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

---

## 🎯 Testing Checklist

### Before Committing

- [ ] All tests pass
- [ ] New features have tests
- [ ] Coverage meets minimum (70%)
- [ ] No skipped tests (.skip)
- [ ] No focused tests (.only)
- [ ] Tests are deterministic
- [ ] Mock data is realistic

### Test Coverage Requirements

- **Overall:** 70% minimum
- **Critical paths:** 90% (auth, orders, payments)
- **Utilities:** 80%
- **Components:** 60%

---

## 🔍 Manual Testing

### Role-Based Testing

**Admin Testing:**
- [ ] Login as admin
- [ ] View all orders
- [ ] Create/edit/delete orders
- [ ] Manage users
- [ ] View analytics
- [ ] Assign drivers

**Restaurant Testing:**
- [ ] Login as restaurant
- [ ] Place new order
- [ ] View order history
- [ ] Cannot access admin features
- [ ] Real-time updates work

**Driver Testing:**
- [ ] Login as driver
- [ ] See assigned deliveries
- [ ] Update delivery status
- [ ] Cannot modify orders
- [ ] Mobile-responsive UI

**Demo Testing:**
- [ ] Login as demo user
- [ ] Read-only access
- [ ] Limited data visible
- [ ] Cannot perform mutations

---

## 🚀 CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run type check
        run: npm run type-check

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
```

---

## 📊 Viewing Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/index.html

# Check coverage summary
npm test -- --coverage --reporter=text-summary
```

---

**Last Updated:** 2025-11-03
**Testing Framework:** Vitest v2.1.8
**Target Coverage:** 70% overall, 90% critical paths
