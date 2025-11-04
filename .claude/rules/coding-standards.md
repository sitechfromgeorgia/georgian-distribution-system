# Coding Standards

> **კოდის სტანდარტები** | Code quality and style guidelines

---

## 🎯 Core Principles

1. **Type Safety First** - TypeScript strict mode always enabled
2. **Readability Over Cleverness** - Write code for humans, not machines
3. **Consistency Matters** - Follow established patterns
4. **Security by Default** - Never trust user input
5. **Performance Conscious** - Optimize for real users, not benchmarks

---

## 📝 TypeScript Guidelines

### Strict Mode Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Type Definitions

✅ **DO:**
```typescript
// Explicit return types for functions
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Interface for objects
interface Order {
  id: string
  restaurant_id: string
  items: OrderItem[]
  status: OrderStatus
  created_at: string
}

// Discriminated unions for complex types
type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

// Generic types with constraints
function filterByStatus<T extends { status: string }>(
  items: T[],
  status: string
): T[] {
  return items.filter(item => item.status === status)
}
```

❌ **DON'T:**
```typescript
// No 'any' without justification
function processData(data: any) { // ❌
  return data.something
}

// No implicit returns
const calculate = (x, y) => x + y // ❌

// No loose types
let items: object[] // ❌ Use specific interface
```

### Type Safety Best Practices

```typescript
// ✅ Use Zod for runtime validation
import { z } from 'zod'

const OrderSchema = z.object({
  restaurant_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
  })),
  notes: z.string().optional(),
})

type OrderInput = z.infer<typeof OrderSchema>

// ✅ Database types from Supabase
import { Database } from '@/types/database'
type Order = Database['public']['Tables']['orders']['Row']

// ✅ Utility types for transformations
type OrderDTO = Omit<Order, 'created_at'> & {
  created_at: string
}
```

---

## ⚛️ React Best Practices

### Component Structure

✅ **DO:**
```typescript
// Server Component by default
export default async function OrdersPage() {
  const orders = await fetchOrders() // Data fetching in Server Component

  return (
    <div>
      <h1>Orders</h1>
      <OrderList orders={orders} />
    </div>
  )
}

// Client Component only when needed
'use client'

import { useState } from 'react'

export function OrderFilter() {
  const [status, setStatus] = useState<OrderStatus>('pending')

  return (
    <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
      <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
    </select>
  )
}
```

❌ **DON'T:**
```typescript
// Don't make everything a Client Component
'use client' // ❌ Unnecessary for static content

export default function StaticPage() {
  return <div>Static content</div>
}

// Don't use inline functions in JSX
<button onClick={() => handleClick(id)}> // ❌ Creates new function every render
```

### Hooks Best Practices

```typescript
// ✅ Custom hooks for reusable logic
function useOrders(restaurantId: string) {
  return useQuery({
    queryKey: ['orders', restaurantId],
    queryFn: () => fetchOrders(restaurantId),
  })
}

// ✅ Dependency array correctness
useEffect(() => {
  fetchData(userId)
}, [userId]) // Include all dependencies

// ✅ Cleanup functions
useEffect(() => {
  const channel = subscribeToOrders()
  return () => {
    channel.unsubscribe() // Always cleanup
  }
}, [])
```

---

## 🎨 Component Organization

### File Structure

```typescript
// ✅ Colocation - keep related files together
components/
  orders/
    OrderCard.tsx         // Component
    OrderCard.test.tsx    // Tests
    order-utils.ts        // Utilities
    types.ts              // Types
    index.ts              // Barrel export
```

### Component Naming

```typescript
// ✅ PascalCase for components
export function OrderCard() {}
export default function OrdersPage() {}

// ✅ camelCase for utilities
export function formatOrderDate() {}
export const calculateTotal = () => {}

// ✅ UPPER_CASE for constants
export const MAX_ORDERS_PER_PAGE = 50
export const ORDER_STATUSES = ['pending', 'confirmed'] as const
```

---

## 🎯 Next.js Specific Guidelines

### App Router Patterns

```typescript
// ✅ Loading states
// app/orders/loading.tsx
export default function Loading() {
  return <OrdersSkeleton />
}

// ✅ Error boundaries
// app/orders/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}

// ✅ Metadata for SEO
// app/orders/page.tsx
export const metadata = {
  title: 'Orders - Georgian Distribution',
  description: 'Manage your restaurant orders',
}
```

### API Routes

```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const OrderCreateSchema = z.object({
  restaurant_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
  })),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json()
    const validatedData = OrderCreateSchema.parse(body)

    // 2. Verify authentication
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Business logic
    const order = await createOrder(validatedData)

    // 4. Return response
    return NextResponse.json({ order }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Order creation failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Best Practices

```typescript
// ✅ Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Order #123</h2>
  <span className="text-sm text-gray-500">Pending</span>
</div>

// ✅ Extract repeated styles to components
// Use shadcn/ui components for consistency
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Order #123</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// ✅ Responsive design with Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

❌ **DON'T:**
```typescript
// Don't use inline styles
<div style={{ padding: '16px' }}> // ❌

// Don't create custom CSS files for one-off styles
// Use Tailwind utilities instead

// Don't ignore responsive design
<div className="w-96"> // ❌ Fixed width, not responsive
```

---

## 📊 State Management

### TanStack Query (React Query)

```typescript
// ✅ Server state with React Query
function OrdersList() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 1000 * 60, // 1 minute
  })

  const mutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (isLoading) return <Loading />
  if (error) return <Error error={error} />

  return <OrderTable orders={orders} onUpdate={mutation.mutate} />
}
```

### Zustand for UI State

```typescript
// ✅ Client state with Zustand
import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}))
```

---

## 🔒 Security Coding Standards

### Input Validation

```typescript
// ✅ Always validate with Zod
import { z } from 'zod'

const UserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2).max(100),
})

// Validate before processing
const result = UserInputSchema.safeParse(input)
if (!result.success) {
  throw new ValidationError(result.error)
}
```

### Database Queries

```typescript
// ✅ Use Supabase client with RLS
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', restaurantId) // RLS handles permissions

// ❌ Never build raw SQL with user input
const query = `SELECT * FROM orders WHERE id = '${userId}'` // ❌ SQL injection!
```

### Authentication Checks

```typescript
// ✅ Always verify auth in API routes
export async function GET(request: NextRequest) {
  const session = await getSession(request)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check role if needed
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceed with logic
}
```

---

## 🧪 Code Quality Tools

### ESLint Configuration

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Pre-commit Checklist

Before committing code:
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] No console.log statements (use console.error for errors)
- [ ] No commented-out code
- [ ] Imports are organized
- [ ] No unused variables or imports

---

## 📐 Code Organization

### Import Order

```typescript
// 1. External packages
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal modules (@/ aliases)
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

// 3. Relative imports
import { calculateTotal } from './utils'
import type { Order } from './types'

// 4. CSS/Styles (if any)
import './styles.css'
```

### Function Organization

```typescript
// 1. Type definitions
interface OrderCardProps {
  order: Order
  onUpdate: (id: string) => void
}

// 2. Constants
const STATUS_COLORS = {
  pending: 'yellow',
  confirmed: 'blue',
  delivered: 'green',
}

// 3. Helper functions
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ka-GE')
}

// 4. Component
export function OrderCard({ order, onUpdate }: OrderCardProps) {
  // Component logic
}
```

---

## 🎯 Performance Guidelines

### React Performance

```typescript
// ✅ Memoize expensive calculations
const totalAmount = useMemo(
  () => calculateTotal(orderItems),
  [orderItems]
)

// ✅ Memoize callbacks passed to children
const handleUpdate = useCallback(
  (id: string) => updateOrder(id),
  [updateOrder]
)

// ✅ Use React.memo for expensive components
export const OrderCard = React.memo(function OrderCard({ order }: Props) {
  return <div>{/* ... */}</div>
})
```

### Image Optimization

```typescript
// ✅ Use Next.js Image component
import Image from 'next/image'

<Image
  src="/products/apple.jpg"
  alt="Apple"
  width={200}
  height={200}
  loading="lazy"
/>
```

---

## 📝 Documentation Standards

### Component Documentation

```typescript
/**
 * OrderCard displays a single order with its details and actions.
 *
 * @param order - The order object to display
 * @param onUpdate - Callback when order is updated
 * @param showActions - Whether to show action buttons (default: true)
 *
 * @example
 * ```tsx
 * <OrderCard
 *   order={order}
 *   onUpdate={handleUpdate}
 *   showActions={true}
 * />
 * ```
 */
export function OrderCard({ order, onUpdate, showActions = true }: Props) {
  // ...
}
```

### Complex Logic Documentation

```typescript
// ✅ Explain WHY, not WHAT
// Calculate profitability based on order total and operational costs
// Admin markup is 15% + 100 GEL fixed fee per order
const profitability = (orderTotal * 0.15) + 100
```

---

## ✅ Code Review Checklist

Before requesting review:
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests written and passing
- [ ] No security vulnerabilities introduced
- [ ] Performance implications considered
- [ ] Accessibility standards met
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Mobile responsiveness verified

---

**Last Updated:** 2025-11-03
**Applies to:** Next.js 15, React 19, TypeScript 5+
