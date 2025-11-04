# Supabase + Next.js Integration Patterns: Complete Technical Reference

## Overview

This document provides comprehensive patterns for integrating Supabase with Next.js 15 in the Georgian Distribution System. It covers Server Components, Client Components, Server Actions, API Routes, Middleware, and advanced patterns for optimal performance and security.

### Key Integration Points

The Georgian Distribution System uses:
- **Next.js 15.5.4** with App Router (RSC architecture)
- **React 19** with Server Components as default
- **Supabase SSR** package (@supabase/ssr) for cookie-based auth
- **TypeScript** with auto-generated types
- **Server Actions** for mutations
- **Middleware** for route protection

### Architecture Overview

```
Frontend (greenland77.ge)
├── Server Components (default)
│   ├── Data fetching from Supabase
│   ├── Auth checks with getUser()
│   └── RLS-protected queries
├── Client Components ('use client')
│   ├── Real-time subscriptions
│   ├── Interactive UI with state
│   └── Browser-side Supabase client
├── Server Actions ('use server')
│   ├── Mutations (INSERT, UPDATE, DELETE)
│   ├── Form submissions
│   └── Background jobs
├── API Routes (app/api/*)
│   ├── Webhooks
│   ├── External integrations
│   └── Custom endpoints
└── Middleware (middleware.ts)
    ├── Auth validation
    ├── Role-based routing
    └── Session refresh
```

---

## Core Concepts

### 1. Server vs Client Components

**Server Components (Default)**:
- Render on server
- Direct database access
- No JavaScript sent to client
- Cannot use useState, useEffect, event handlers
- Ideal for: Data fetching, auth checks, static content

**Client Components ('use client')**:
- Render in browser
- Use Supabase browser client
- Support React hooks and interactivity
- Ideal for: Forms, real-time subscriptions, interactive UI

### 2. Cookie-Based Authentication

Supabase SSR uses cookies instead of localStorage:
- **Server Components**: Read cookies via `createServerClient()`
- **Client Components**: Read cookies via `createBrowserClient()`
- **Middleware**: Refresh sessions automatically
- **Benefits**: Works with SSR, more secure, enables Server Components

### 3. Supabase Client Factory Pattern

```typescript
// Different clients for different contexts
createServerClient()       // Server Components
createBrowserClient()       // Client Components
createServerActionClient()  // Server Actions
createRouteHandlerClient()  // API Routes
createMiddlewareClient()    // Middleware
```

---

## Setup: Supabase Client Utilities

### File: lib/supabase/server.ts

```typescript
import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function createServerClient() {
  const cookieStore = cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle error in Server Actions
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle error in Server Actions
          }
        },
      },
    }
  )
}

export function createServerActionClient() {
  const cookieStore = cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export function createRouteHandlerClient() {
  const cookieStore = cookies()

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### File: lib/supabase/client.ts

```typescript
import { createBrowserClient as createClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### File: lib/supabase/middleware.ts

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if needed
  await supabase.auth.getUser()

  return response
}
```

---

## Pattern 1: Server Component Data Fetching

### Use Case: Restaurant Dashboard (Server Component)

**When to use**:
- Initial page load data
- SEO-friendly content
- No interactivity needed
- Direct database access

**Implementation:**

```typescript
// app/dashboard/restaurant/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrdersList } from '@/components/orders-list'

export default async function RestaurantDashboard() {
  const supabase = createServerClient()

  // Verify authentication (runs on server)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check role
  const role = user.app_metadata.role

  if (role !== 'restaurant') {
    redirect('/unauthorized')
  }

  // Fetch orders (RLS automatically filters by restaurant_id)
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      driver:drivers(full_name, phone),
      items:order_items(
        quantity,
        price,
        product:products(name, image_url)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch today's statistics
  const { data: todayStats } = await supabase
    .rpc('get_today_stats', {
      restaurant_id: user.id
    })

  return (
    <div>
      <h1>Welcome, {user.user_metadata.full_name}</h1>
      
      <div className="stats">
        <StatCard title="Today's Orders" value={todayStats?.total_orders} />
        <StatCard title="Revenue" value={`₾${todayStats?.total_revenue}`} />
        <StatCard title="Pending" value={todayStats?.pending_orders} />
      </div>

      <OrdersList orders={orders} />
    </div>
  )
}

// This runs on the server
// No JavaScript sent to client
// Data fetched securely with RLS
// SEO-friendly
```

**Benefits**:
- ✅ Fast initial load
- ✅ SEO-friendly
- ✅ Secure (server-side auth)
- ✅ Type-safe queries
- ✅ No client-side JavaScript for data fetching

**Limitations**:
- ❌ No interactivity (use Client Components for that)
- ❌ No real-time updates (use Client Components with subscriptions)

---

## Pattern 2: Client Component with Real-Time

### Use Case: Live Order Tracking

**When to use**:
- Real-time data updates
- Interactive UI
- Browser events (clicks, form inputs)
- Supabase Realtime subscriptions

**Implementation:**

```typescript
// components/live-orders.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row']

export function LiveOrders({ restaurantId }: { restaurantId: string }) {
  const supabase = createBrowserClient()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    // Initial fetch
    fetchOrders()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          console.log('Order change:', payload)

          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
          }

          if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(order =>
                order.id === payload.new.id ? payload.new as Order : order
              )
            )
          }

          if (payload.eventType === 'DELETE') {
            setOrders(prev =>
              prev.filter(order => order.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, supabase])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data)
    }
  }

  return (
    <div>
      <h2>Live Orders ({orders.length})</h2>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
```

**Parent Server Component:**

```typescript
// app/dashboard/restaurant/orders/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { LiveOrders } from '@/components/live-orders'
import { redirect } from 'next/navigation'

export default async function OrdersPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Orders</h1>
      {/* Pass user ID to client component */}
      <LiveOrders restaurantId={user.id} />
    </div>
  )
}
```

**Benefits**:
- ✅ Real-time updates
- ✅ Interactive UI
- ✅ Optimistic updates possible
- ✅ Client-side state management

---

## Pattern 3: Server Actions for Mutations

### Use Case: Create New Order

**When to use**:
- Form submissions
- Data mutations (INSERT, UPDATE, DELETE)
- Server-side validation
- Direct from forms (no API route needed)

**Implementation:**

```typescript
// app/orders/actions.ts
'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().min(1),
    price: z.number().positive()
  })).min(1),
  delivery_address: z.string().min(5),
  delivery_notes: z.string().optional(),
  total_price: z.number().positive()
})

export async function createOrder(formData: FormData) {
  const supabase = createServerActionClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify role
  if (user.app_metadata.role !== 'restaurant') {
    return { error: 'Unauthorized' }
  }

  // Parse and validate input
  const items = JSON.parse(formData.get('items') as string)
  const delivery_address = formData.get('delivery_address') as string
  const delivery_notes = formData.get('delivery_notes') as string
  const total_price = parseFloat(formData.get('total_price') as string)

  const parsed = createOrderSchema.safeParse({
    items,
    delivery_address,
    delivery_notes,
    total_price
  })

  if (!parsed.success) {
    return { error: 'Invalid input', details: parsed.error.format() }
  }

  // Create order (transaction)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: user.id,
      status: 'pending',
      total_price: parsed.data.total_price,
      delivery_address: parsed.data.delivery_address,
      delivery_notes: parsed.data.delivery_notes
    })
    .select()
    .single()

  if (orderError) {
    console.error('Failed to create order:', orderError)
    return { error: 'Failed to create order' }
  }

  // Create order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      parsed.data.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))
    )

  if (itemsError) {
    // Rollback: delete order
    await supabase.from('orders').delete().eq('id', order.id)
    console.error('Failed to create order items:', itemsError)
    return { error: 'Failed to create order items' }
  }

  // Revalidate cache
  revalidatePath('/dashboard/restaurant/orders')

  return {
    success: true,
    orderId: order.id
  }
}
```

**Client Component (Form):**

```typescript
// components/create-order-form.tsx
'use client'

import { createOrder } from '@/app/orders/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CreateOrderForm({ products }) {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('items', JSON.stringify(items))

    const result = await createOrder(formData)

    if (result.error) {
      alert(result.error)
      setLoading(false)
      return
    }

    // Success
    router.push(`/orders/${result.orderId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <ProductSelector
        products={products}
        items={items}
        setItems={setItems}
      />

      <input
        name="delivery_address"
        placeholder="Delivery Address"
        required
      />

      <textarea
        name="delivery_notes"
        placeholder="Delivery Notes (optional)"
      />

      <input
        type="hidden"
        name="total_price"
        value={items.reduce((sum, item) => sum + item.price * item.quantity, 0)}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Order'}
      </button>
    </form>
  )
}
```

**Benefits**:
- ✅ Server-side validation
- ✅ Type-safe with Zod
- ✅ Progressive enhancement
- ✅ No API route needed
- ✅ Automatic revalidation

---

## Pattern 4: API Routes for Webhooks

### Use Case: Stripe Webhook Handler

**When to use**:
- External webhooks (Stripe, Twilio, etc.)
- Custom API endpoints
- Third-party integrations
- Background jobs

**Implementation:**

```typescript
// app/api/webhooks/stripe/route.ts
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createRouteHandlerClient()

  // Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session

      // Update order payment status
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: 'stripe',
          paid_at: new Date().toISOString()
        })
        .eq('id', session.metadata?.order_id)

      break

    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Mark payment as failed
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed'
        })
        .eq('id', paymentIntent.metadata?.order_id)

      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

**Benefits**:
- ✅ Handles external webhooks
- ✅ Server-side only (secure)
- ✅ Can use service_role key
- ✅ Background processing

---

## Pattern 5: Middleware for Route Protection

### Use Case: Role-Based Route Guard

**When to use**:
- Protect multiple routes
- Session refresh
- Role-based redirects
- Authentication checks before page load

**Implementation:**

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Update session (refresh if needed)
  let response = await updateSession(request)

  // Create Supabase client for auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based access control
  if (user) {
    const role = user.app_metadata.role

    // Admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Restaurant routes
    if (pathname.startsWith('/dashboard/restaurant') && role !== 'restaurant') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Driver routes
    if (pathname.startsWith('/dashboard/driver') && role !== 'driver') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Benefits**:
- ✅ Centralized auth logic
- ✅ Runs before page renders
- ✅ Automatic session refresh
- ✅ Role-based routing

---

## Pattern 6: Parallel Data Fetching

### Use Case: Dashboard with Multiple Queries

**When to use**:
- Multiple independent queries
- Optimize page load time
- Fetch data concurrently

**Implementation:**

```typescript
// app/dashboard/admin/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = createServerClient()

  // Parallel fetching (all queries run simultaneously)
  const [
    { data: { user } },
    { data: restaurants },
    { data: orders },
    { data: drivers },
    { data: products },
    { data: stats }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('restaurants').select('*').limit(10),
    supabase.from('orders').select('*').eq('status', 'pending'),
    supabase.from('drivers').select('*').eq('status', 'active'),
    supabase.from('products').select('*').limit(20),
    supabase.rpc('get_admin_stats')
  ])

  if (!user || user.app_metadata.role !== 'admin') {
    redirect('/unauthorized')
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <StatsGrid stats={stats} />
      <RestaurantsList restaurants={restaurants} />
      <PendingOrders orders={orders} />
      <ActiveDrivers drivers={drivers} />
      <ProductsGrid products={products} />
    </div>
  )
}

// All queries run in parallel - much faster!
```

**Benefits**:
- ✅ Faster page loads
- ✅ Optimal performance
- ✅ Type-safe

---

## Pattern 7: Optimistic Updates

### Use Case: Update Order Status

**When to use**:
- Instant UI feedback
- Better UX
- Client-side updates

**Implementation:**

```typescript
// components/order-status-button.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function OrderStatusButton({ order }) {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(order.status)

  async function updateStatus() {
    // Optimistic update (instant UI feedback)
    setOptimisticStatus('confirmed')

    // Actual database update
    const { error } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', order.id)

    if (error) {
      // Revert on error
      setOptimisticStatus(order.status)
      alert('Failed to update order')
      return
    }

    // Revalidate server data
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={updateStatus}
      disabled={isPending}
    >
      Status: {optimisticStatus}
      {isPending && ' (Saving...)'}
    </button>
  )
}
```

**Benefits**:
- ✅ Instant UI updates
- ✅ Better UX
- ✅ Graceful error handling

---

## Pattern 8: Suspense Boundaries

### Use Case: Loading States

**When to use**:
- Show loading UI
- Progressive rendering
- Better UX

**Implementation:**

```typescript
// app/dashboard/restaurant/orders/page.tsx
import { Suspense } from 'react'
import { OrdersList } from '@/components/orders-list'
import { OrdersListSkeleton } from '@/components/orders-list-skeleton'

export default function OrdersPage() {
  return (
    <div>
      <h1>Orders</h1>

      <Suspense fallback={<OrdersListSkeleton />}>
        <OrdersListAsync />
      </Suspense>
    </div>
  )
}

// Async component
async function OrdersListAsync() {
  const supabase = createServerClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  return <OrdersList orders={orders} />
}
```

**Benefits**:
- ✅ Progressive rendering
- ✅ Better perceived performance
- ✅ Cleaner code

---

## Security Best Practices

### 1. Always Validate Auth Server-Side

```typescript
// ❌ WRONG (client-side only)
'use client'
export function Dashboard() {
  const user = useUser()  // Client-side hook
  if (!user) return <div>Not logged in</div>
}

// ✅ CORRECT (server-side validation)
export default async function Dashboard() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
}
```

### 2. Use RLS for All Tables

```sql
-- Enable RLS on all public tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Restaurants view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = restaurant_id);
```

### 3. Never Expose service_role Key

```typescript
// ❌ WRONG
'use client'
const supabase = createClient(url, serviceRoleKey)  // NEVER!

// ✅ CORRECT (API route only)
// app/api/admin/route.ts
const supabaseAdmin = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Server-side only
)
```

---

## Performance Optimization

### 1. Use React Cache for Deduplication

```typescript
import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'

// Deduplicate identical requests
export const getUser = cache(async () => {
  const supabase = createServerClient()
  return await supabase.auth.getUser()
})

// Multiple components can call getUser() - only fetches once
```

### 2. Prefetch Data in Layouts

```typescript
// app/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
  const supabase = createServerClient()

  // Prefetch user data (cached for all child pages)
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <Header user={user} />
      {children}
    </div>
  )
}
```

### 3. Use Streaming for Large Lists

```typescript
import { Suspense } from 'react'

export default function ProductsPage() {
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        <ProductsList />
      </Suspense>
    </div>
  )
}
```

---

## Troubleshooting

### Issue 1: "Cookies can only be modified in a Server Action"

**Cause**: Trying to set cookies in Server Component

**Solution**: Use Server Action instead

```typescript
// ✅ CORRECT
'use server'
export async function loginAction() {
  const supabase = createServerActionClient()
  await supabase.auth.signInWithPassword(...)
}
```

### Issue 2: Real-time not working

**Cause**: Missing RLS policies for Realtime

**Solution**: Enable realtime in table settings

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

---

## Related Documentation

- [01-supabase-auth.md](./01-supabase-auth.md) - Auth implementation
- [02-supabase-realtime.md](./02-supabase-realtime.md) - Real-time patterns
- [08-supabase-cli.md](./08-supabase-cli.md) - Type generation

---

*Last Updated: October 29, 2025*  
*Next.js: 15.5.4 | React: 19 | Supabase: Latest*  
*Project: Georgian Distribution System*
