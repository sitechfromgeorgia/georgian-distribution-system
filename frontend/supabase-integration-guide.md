# Georgian Distribution System - Frontend ↔ VPS Backend Integration Guide

## 🎯 Overview

This guide shows how to properly connect your Next.js frontend to your VPS-hosted Supabase backend at `data.greenland77.ge`.

## 🏗️ Architecture

```
┌─────────────────┐    HTTPS    ┌─────────────────┐
│   Frontend      │ ◄────────► │   VPS Backend   │
│  (greenland77)  │   HTTP API  │ (data.greenland)│
│                 │             │                 │
│ Next.js 15      │             │ Supabase Stack  │
│ React 18        │             │ PostgreSQL      │
│ TypeScript      │             │ Auth, Storage   │
└─────────────────┘             └─────────────────┘
```

## 🔧 Environment Configuration

### 1. Frontend Environment (.env.local)
```bash
# Supabase VPS Backend Configuration
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYxNzMzODk2LCJleHAiOjE4OTM0NTYwMDB9.8_RBpPhjnSsvDY4GMDddZW9K53yIdWGsiUHp6jM-vA8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjE3MzM4OTYsImV4cCI6MTg5MzQ1NjAwMH0.abYfCA4Iibh89d9TJMcPsLuBScfUpwJvgL9mH-SZkm8

# Application Configuration
NEXT_PUBLIC_APP_NAME="Georgian Distribution System"
NEXT_PUBLIC_APP_VERSION="2.0"
NODE_ENV=development
```

### 2. VPS Backend Configuration
- **Domain**: `data.greenland77.ge`
- **Services**: PostgreSQL, Auth, Storage, Realtime
- **Container Prefix**: `distribution-supabase-yzoh2u-supabase`
- **Database**: PostgreSQL with custom schema
- **Authentication**: JWT-based with role support

## 🚀 Supabase Client Setup

### Browser Client (Client Components)
```typescript
// frontend/src/lib/supabase/client.ts
import { createBrowserClient as createClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,        // Auto-refresh tokens
        persistSession: true,          // Save session in localStorage
        detectSessionInUrl: true,      // Handle OAuth callbacks
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce'               // PKCE flow for security
      }
    }
  )
}

// Named export for convenience
export const supabase = createBrowserClient()
```

### Server Client (Server Components & API Routes)
```typescript
// frontend/src/lib/supabase/server.ts
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        }
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    }
  )
}

// Admin client (server-side only, for admin operations)
export function createAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NEVER expose in browser
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
```

## 🔐 Authentication Flow

### 1. Login Implementation
```typescript
// frontend/src/app/login/actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const supabase = await createServerClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: 'Invalid credentials' }
  }

  // Role-based redirect
  const role = data.user.app_metadata.role
  
  switch (role) {
    case 'admin':
      redirect('/dashboard/admin')
      break
    case 'restaurant':
      redirect('/dashboard/restaurant')
      break
    case 'driver':
      redirect('/dashboard/driver')
      break
    case 'demo':
      redirect('/demo')
      break
    default:
      redirect('/dashboard')
  }
}
```

### 2. Protected Server Component
```typescript
// frontend/src/app/dashboard/admin/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createServerClient()
  
  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Verify admin role
  if (user.app_metadata.role !== 'admin') {
    redirect('/unauthorized')
  }
  
  // Fetch admin data
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user.user_metadata.full_name}</p>
      <p>Total Users: {users?.length || 0}</p>
    </div>
  )
}
```

### 3. Client-Side Authentication Check
```typescript
// frontend/src/components/auth-check.tsx
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [router, supabase])

  if (loading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}
```

## 📊 Database Operations

### 1. Query with Role-Based Access
```typescript
// Get user's orders (filtered by RLS)
const { data: orders } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (
      quantity,
      product:products(name, price)
    )
  `)
  .eq('restaurant_id', user.id)  // RLS enforces this
  .order('created_at', { ascending: false })
```

### 2. Admin Operations (Server-Side Only)
```typescript
// Admin creates new restaurant account
export async function createRestaurantAccount(formData: FormData) {
  const adminSupabase = createAdminClient()  // Server-side only
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  // Create user with admin API
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: formData.get('full_name') as string
    },
    app_metadata: {
      role: 'restaurant'
    }
  })
  
  if (error) {
    return { error: error.message }
  }
  
  // Create restaurant profile
  await adminSupabase
    .from('profiles')
    .insert({
      id: data.user.id,
      role: 'restaurant',
      full_name: formData.get('full_name') as string,
      restaurant_name: formData.get('restaurant_name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      is_active: true
    })
  
  return { success: true, userId: data.user.id }
}
```

## 🔄 Real-time Subscriptions

### Order Status Updates
```typescript
// frontend/src/hooks/use-realtime-orders.ts
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function useRealtimeOrders(userId: string) {
  const [orders, setOrders] = useState([])
  const supabase = createBrowserClient()

  useEffect(() => {
    // Initial data fetch
    supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', userId)
      .then(({ data }) => setOrders(data || []))

    // Subscribe to changes
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `restaurant_id=eq.${userId}`
        }, 
        (payload) => {
          // Update local state
          if (payload.eventType === 'INSERT') {
            setOrders(current => [...current, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(current => 
              current.map(order => 
                order.id === payload.new.id ? payload.new : order
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userId, supabase])

  return orders
}
```

## 🧪 Testing the Connection

### 1. Connection Test Component
```typescript
// frontend/src/components/test-connection.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export function TestConnection() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const supabase = createBrowserClient()

  const testConnection = async () => {
    setStatus('testing')
    setError('')

    try {
      // Test 1: Auth endpoint
      const { data: { user } } = await supabase.auth.getUser()
      
      // Test 2: Database connection
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (dbError) throw dbError

      setStatus('connected')
      console.log('✅ Connected to VPS Supabase backend!')
      console.log('User:', user)
      console.log('Database response:', data)
      
    } catch (err: any) {
      setStatus('error')
      setError(err.message)
      console.error('❌ Connection failed:', err)
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3>Supabase VPS Backend Connection Test</h3>
      <p>Status: <strong>{status}</strong></p>
      {error && <p className="text-red-500">Error: {error}</p>}
      <button onClick={testConnection} className="btn btn-primary">
        Test Connection
      </button>
    </div>
  )
}
```

### 2. Test Database Schema
```typescript
// Test if database tables exist
const testDatabase = async () => {
  const supabase = createBrowserClient()
  
  try {
    // Test main tables
    const tables = ['profiles', 'products', 'orders', 'order_items']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table ${table} error:`, error)
      } else {
        console.log(`✅ Table ${table} accessible`)
      }
    }
  } catch (error) {
    console.error('❌ Database test failed:', error)
  }
}
```

## 🔒 Security Best Practices

### 1. Environment Variables
```bash
# ✅ CORRECT - Server-side only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge

# ❌ WRONG - Never in client
NEXT_PUBLIC_SERVICE_ROLE_KEY=...    # NEVER DO THIS!
```

### 2. Role-Based Access Control
```sql
-- RLS Policy: Restaurants can only see their orders
CREATE POLICY "Restaurants see own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = restaurant_id
    OR (auth.jwt() ->> 'role') = 'admin'
  );
```

### 3. API Route Protection
```typescript
// frontend/src/app/api/orders/route.ts
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createRouteHandlerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch user-specific data (RLS enforces permissions)
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', user.id)
  
  return NextResponse.json(data)
}
```

## 🚀 Deployment

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check

# ESLint
npm run lint
```

### VPS Backend Requirements
Ensure your VPS Supabase instance has:
- ✅ PostgreSQL running
- ✅ Auth service configured
- ✅ RLS policies set up
- ✅ Database schema created
- ✅ SSL certificates (for HTTPS)
- ✅ Domain `data.greenland77.ge` pointing to VPS

## 📋 Next Steps

1. **Test Connection**: Use the TestConnection component
2. **Database Setup**: Ensure tables exist in VPS PostgreSQL
3. **RLS Policies**: Configure row-level security
4. **User Management**: Test authentication flows
5. **Real-time**: Test subscriptions work across domains
6. **Admin Operations**: Test service role functions

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure VPS allows your frontend domain
2. **SSL Issues**: Verify HTTPS on both domains
3. **JWT Errors**: Check token expiry and refresh
4. **Database Connection**: Verify PostgreSQL connectivity
5. **Auth Redirects**: Check redirect URLs in Supabase dashboard

---

**Integration Status**: ✅ Ready for testing  
**Backend**: `data.greenland77.ge` (VPS-hosted)  
**Frontend**: `greenland77.ge` (development)  
**Connection**: HTTPS + JWT authentication