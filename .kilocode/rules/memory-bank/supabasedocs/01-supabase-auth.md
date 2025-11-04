# Supabase Auth: Complete Technical Reference

## Overview

Supabase Auth (GoTrue) is a JWT-based authentication system that provides comprehensive user management and role-based access control (RBAC) for the Georgian Distribution System. It handles authentication for four distinct user roles: **Admin**, **Restaurant**, **Driver**, and **Demo**, each with specific permissions and access levels.

### Key Capabilities

Supabase Auth provides:
- **Email/Password Authentication** - Secure password-based login with customizable policies
- **JWT Token Management** - Automatic token refresh and session management
- **Role-Based Access Control** - Custom roles stored in JWT claims for fine-grained permissions
- **Multi-Factor Authentication** - Optional TOTP-based 2FA for enhanced security
- **Row-Level Security Integration** - Seamless integration with PostgreSQL RLS policies
- **Session Management** - Automatic token refresh, expiry handling, and revocation

### Architecture

Auth integrates with the Georgian Distribution System through:
1. **Frontend (greenland77.ge)** - Next.js 15 client-side authentication
2. **Backend (data.greenland77.ge)** - Self-hosted Supabase Auth service
3. **PostgreSQL** - User data stored in `auth.users` schema
4. **Kong API Gateway** - JWT validation and request routing

---

## Core Concepts

### 1. Authentication vs Authorization

**Authentication** verifies user identity:
- User logs in with email/password
- Auth service validates credentials
- JWT access token issued with user metadata
- Token used for subsequent requests

**Authorization** determines access permissions:
- JWT contains `role` claim (admin, restaurant, driver, demo)
- RLS policies check role from JWT
- Database enforces row-level permissions
- API endpoints validate role before operations

### 2. JWT Token Structure

Supabase Auth issues JSON Web Tokens with three parts:

```typescript
// Header
{
  "alg": "RS256",  // Algorithm (asymmetric key)
  "typ": "JWT",
  "kid": "key_id"  // Key identifier
}

// Payload (Claims)
{
  "iss": "https://data.greenland77.ge/auth/v1",
  "sub": "user_uuid",
  "aud": "authenticated",
  "exp": 1735689600,  // Expiration timestamp
  "iat": 1735686000,  // Issued at timestamp
  "email": "restaurant@greenland77.ge",
  "phone": "+995555123456",
  "app_metadata": {
    "role": "restaurant",
    "restaurant_id": "uuid",
    "provider": "email"
  },
  "user_metadata": {
    "full_name": "Restaurant Owner",
    "avatar_url": "https://..."
  },
  "role": "authenticated",  // Postgres role
  "aal": "aal1",  // Authenticator assurance level
  "amr": [{"method": "password", "timestamp": 1735686000}]
}

// Signature
// RS256 signature verifying authenticity
```

### 3. Token Lifecycle

1. **Login** - User authenticates, receives access token (1 hour) + refresh token (7 days)
2. **Usage** - Access token sent in `Authorization: Bearer <token>` header
3. **Refresh** - Before expiry, client exchanges refresh token for new access token
4. **Revocation** - Logout or security breach triggers token revocation

### 4. Session Management

Sessions are managed automatically by the Supabase client:
- **localStorage** - Tokens stored in browser (default)
- **Cookies** - Server-side rendering (Next.js App Router)
- **Memory** - Admin operations (service_role key)

---

## API Reference

### Method 1: signUp()

**Purpose**: Register a new user with email and password

**When to use**:
- Admin creating restaurant accounts
- New user self-registration
- Driver account creation

**Syntax:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: string,
  password: string,
  options?: {
    data?: object,          // user_metadata
    emailRedirectTo?: string,
    captchaToken?: string
  }
})
```

**Parameters:**
- `email` (string, required): Valid email address
- `password` (string, required): Minimum 6 characters (customizable)
- `options.data` (object, optional): Custom user_metadata (full_name, avatar_url, etc.)
- `options.emailRedirectTo` (string, optional): Redirect URL after email confirmation

**Returns:**
```typescript
{
  data: {
    user: User | null,
    session: Session | null
  },
  error: AuthError | null
}
```

**Example (Admin Creating Restaurant Account):**
```typescript
// app/admin/restaurants/actions.ts
'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { z } from 'zod'

const restaurantSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  restaurantName: z.string().min(2),
  phoneNumber: z.string().regex(/^\+995\d{9}$/, 'Invalid Georgian phone number')
})

export async function createRestaurantAccount(formData: FormData) {
  // Validate input
  const parsed = restaurantSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    restaurantName: formData.get('restaurantName'),
    phoneNumber: formData.get('phoneNumber')
  })

  if (!parsed.success) {
    return { error: 'Invalid input data' }
  }

  const supabase = createServerActionClient()

  // Create user account
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.restaurantName,
        phone: parsed.data.phoneNumber,
        role: 'restaurant'  // Custom role
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  })

  if (error) {
    console.error('Failed to create restaurant account:', error)
    return { error: error.message }
  }

  // Create restaurant profile in public.restaurants table
  const { error: profileError } = await supabase
    .from('restaurants')
    .insert({
      id: data.user!.id,
      name: parsed.data.restaurantName,
      email: parsed.data.email,
      phone: parsed.data.phoneNumber,
      created_at: new Date().toISOString()
    })

  if (profileError) {
    console.error('Failed to create restaurant profile:', profileError)
    return { error: 'Account created but profile setup failed' }
  }

  return { 
    success: true,
    userId: data.user!.id,
    message: 'Restaurant account created. Confirmation email sent.'
  }
}
```

**Common Errors:**
- `User already registered` - Email exists. Use password reset flow.
- `Password is too weak` - Enforce stronger password policy.
- `Invalid email format` - Validate email format client-side.
- `Email not allowed` - Check email domain whitelist settings.

**Security Notes:**
- Never expose `service_role` key for user signups
- Use CAPTCHA to prevent bot registrations
- Implement rate limiting on signup endpoint
- Validate all user inputs server-side
- Hash passwords automatically (handled by Auth)

---

### Method 2: signInWithPassword()

**Purpose**: Authenticate user with email and password

**When to use**:
- Restaurant user login
- Driver app authentication
- Admin dashboard access
- Demo account login

**Syntax:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: string,
  password: string
})
```

**Parameters:**
- `email` (string, required): User's email address
- `password` (string, required): User's password

**Returns:**
```typescript
{
  data: {
    user: User,
    session: Session
  },
  error: AuthError | null
}
```

**Example (Restaurant Login with Role-Based Redirect):**
```typescript
// app/login/actions.ts
'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password required')
})

export async function loginAction(formData: FormData) {
  // Validate input
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  })

  if (!parsed.success) {
    return { error: 'Invalid email or password' }
  }

  const supabase = createServerActionClient()

  // Attempt login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  })

  if (error) {
    console.error('Login failed:', error.message)
    // Generic error message to prevent user enumeration
    return { error: 'Invalid email or password' }
  }

  // Extract role from JWT claims
  const role = data.user.app_metadata.role as string

  // Redirect based on role
  if (role === 'admin') {
    redirect('/dashboard/admin')
  } else if (role === 'restaurant') {
    redirect('/dashboard/restaurant')
  } else if (role === 'driver') {
    redirect('/dashboard/driver')
  } else if (role === 'demo') {
    redirect('/demo')
  }

  // Fallback
  redirect('/dashboard')
}
```

**Common Errors:**
- `Invalid login credentials` - Wrong email/password. Show generic error.
- `Email not confirmed` - User hasn't verified email. Show confirmation prompt.
- `User is suspended` - Account banned. Show contact support message.
- `Too many requests` - Rate limit hit. Implement exponential backoff.

**Security Notes:**
- Use generic error messages (don't reveal if email exists)
- Implement rate limiting (max 5 attempts per 15 minutes)
- Add CAPTCHA after 3 failed attempts
- Log failed login attempts for security monitoring
- Use HTTPS only for login endpoints

---

### Method 3: signOut()

**Purpose**: Terminate user session and revoke tokens

**When to use**:
- User clicks logout button
- Session timeout
- Security breach (force logout)
- Role change (re-authentication required)

**Syntax:**
```typescript
const { error } = await supabase.auth.signOut()
```

**Returns:**
```typescript
{
  error: AuthError | null
}
```

**Example (Logout with Cleanup):**
```typescript
// components/logout-button.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)

    // Close any realtime subscriptions
    supabase.removeAllChannels()

    // Sign out
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout failed:', error)
      alert('Failed to logout. Please try again.')
      setIsLoading(false)
      return
    }

    // Clear any local storage cache
    localStorage.removeItem('order_cache')
    localStorage.removeItem('product_cache')

    // Redirect to login
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="btn-danger"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  )
}
```

**Common Errors:**
- `Session not found` - User already logged out. Safe to ignore.
- `Network error` - Retry logout or clear localStorage manually.

**Security Notes:**
- Always close realtime subscriptions before logout
- Clear sensitive data from localStorage
- Revoke refresh tokens on logout
- Redirect to login page immediately
- Clear server-side session cookies (Next.js App Router)

---

### Method 4: getUser()

**Purpose**: Get currently authenticated user's data

**When to use**:
- Verify user is logged in
- Get user metadata (role, email, name)
- Check authentication status
- Validate JWT token

**Syntax:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
```

**Returns:**
```typescript
{
  data: {
    user: User | null
  },
  error: AuthError | null
}
```

**Example (Protected Page with Role Check):**
```typescript
// app/dashboard/restaurant/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RestaurantDashboard() {
  const supabase = createServerClient()

  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser()

  // Check if user is authenticated
  if (error || !user) {
    redirect('/login')
  }

  // Check if user has restaurant role
  const role = user.app_metadata.role

  if (role !== 'restaurant') {
    redirect('/unauthorized')
  }

  // Fetch restaurant-specific data
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h1>Welcome, {user.user_metadata.full_name}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {role}</p>
      
      <h2>Recent Orders</h2>
      {/* Render orders */}
    </div>
  )
}
```

**Common Errors:**
- `Invalid JWT` - Token expired or malformed. Redirect to login.
- `User not found` - User deleted from database. Clear session.

**Security Notes:**
- **CRITICAL**: Use `getUser()` instead of `getSession()` for security
- `getSession()` only checks localStorage (can be spoofed)
- `getUser()` validates JWT with Auth server (secure)
- Always validate user role from `app_metadata`, not `user_metadata`
- `user_metadata` can be modified by users - NOT secure for authorization

---

### Method 5: getSession()

**Purpose**: Get session from localStorage (client-side only)

**When to use**:
- Quick session check without API call
- Get access token for API requests
- Check if user is logged in (client-side)

⚠️ **WARNING**: Do NOT use `getSession()` for security checks! It only reads from localStorage and doesn't validate the JWT. Use `getUser()` instead.

**Syntax:**
```typescript
const { data: { session }, error } = await supabase.auth.getSession()
```

**Returns:**
```typescript
{
  data: {
    session: Session | null
  },
  error: AuthError | null
}
```

**Example (Get Access Token for API Call):**
```typescript
// lib/api-client.ts
import { createBrowserClient } from '@/lib/supabase/client'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const supabase = createBrowserClient()
  
  // Get session from localStorage
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  // Add auth token to request
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    }
  })

  return response
}
```

**Security Notes:**
- Never use for authentication checks (use `getUser()`)
- Session can be tampered with in localStorage
- Only use to get access token for API calls
- Always validate JWT on backend

---

### Method 6: updateUser()

**Purpose**: Update user profile data (email, password, metadata)

**When to use**:
- User changes email or password
- Update profile information (name, phone, avatar)
- Admin modifies user metadata
- Change user role

**Syntax:**
```typescript
const { data, error } = await supabase.auth.updateUser({
  email?: string,
  password?: string,
  data?: object  // user_metadata
})
```

**Parameters:**
- `email` (string, optional): New email address (requires confirmation)
- `password` (string, optional): New password
- `data` (object, optional): Update user_metadata fields

**Returns:**
```typescript
{
  data: {
    user: User
  },
  error: AuthError | null
}
```

**Example (Restaurant Profile Update):**
```typescript
// app/profile/actions.ts
'use server'

import { createServerActionClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = createServerActionClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  // Update user metadata
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name,
      phone
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Also update restaurant profile table
  await supabase
    .from('restaurants')
    .update({
      name: full_name,
      phone: phone,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  return { success: true }
}
```

**Common Errors:**
- `Email already in use` - Choose different email
- `New password is too weak` - Enforce password policy
- `User not found` - Session expired

**Security Notes:**
- Email change requires confirmation (sends verification email)
- Password change requires current session
- Never allow users to modify `app_metadata` (admin-only)
- Validate phone numbers server-side

---

### Method 7: resetPasswordForEmail()

**Purpose**: Send password reset email to user

**When to use**:
- User forgot password
- Admin forces password reset
- Security breach requires password change

**Syntax:**
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo?: string
})
```

**Parameters:**
- `email` (string, required): User's email address
- `redirectTo` (string, optional): URL to redirect after reset

**Example (Password Reset Flow):**
```typescript
// app/forgot-password/actions.ts
'use server'

import { createServerActionClient } from '@/lib/supabase/server'

export async function requestPasswordReset(formData: FormData) {
  const supabase = createServerActionClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
  })

  if (error) {
    console.error('Password reset failed:', error)
    // Don't reveal if email exists
    return { 
      success: true, 
      message: 'If account exists, reset email sent' 
    }
  }

  return { 
    success: true, 
    message: 'Password reset email sent. Check your inbox.' 
  }
}
```

**Security Notes:**
- Don't reveal if email exists (prevent user enumeration)
- Rate limit password reset requests
- Token expires after 1 hour (configurable)
- Use CAPTCHA to prevent abuse

---

### Method 8: onAuthStateChange()

**Purpose**: Subscribe to authentication state changes

**When to use**:
- Detect login/logout events
- Update UI when user state changes
- Sync authentication state across tabs
- Handle token refresh events

**Syntax:**
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // Handle auth event
  }
)
```

**Events:**
- `SIGNED_IN` - User logged in
- `SIGNED_OUT` - User logged out
- `TOKEN_REFRESHED` - Access token refreshed
- `USER_UPDATED` - User profile updated
- `PASSWORD_RECOVERY` - Password reset link clicked

**Example (Global Auth Listener):**
```typescript
// providers/auth-provider.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_IN') {
          // User logged in
          const role = session?.user.app_metadata.role
          console.log('User logged in with role:', role)
          
          // Refresh router to update server components
          router.refresh()
        }

        if (event === 'SIGNED_OUT') {
          // User logged out
          console.log('User logged out')
          router.push('/login')
          router.refresh()
        }

        if (event === 'TOKEN_REFRESHED') {
          // Access token refreshed automatically
          console.log('Token refreshed')
        }

        if (event === 'USER_UPDATED') {
          // User profile updated
          console.log('User profile updated')
          router.refresh()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return <>{children}</>
}
```

**Best Practices:**
- Always unsubscribe when component unmounts
- Use for UI updates, not security checks
- Events fire across tabs (keep UI in sync)
- Don't make API calls in every event (debounce)

---

### Method 9: Admin API - createUser()

**Purpose**: Create user account with admin privileges (service_role)

**When to use**:
- Admin bulk-creates accounts
- Automated user provisioning
- Bypass email confirmation
- Set custom user metadata

⚠️ **CRITICAL**: Requires `service_role` key. Never expose in browser!

**Syntax:**
```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email: string,
  password: string,
  email_confirm?: boolean,
  user_metadata?: object,
  app_metadata?: object
})
```

**Parameters:**
- `email` (string, required): User's email
- `password` (string, required): User's password
- `email_confirm` (boolean, optional): Skip email confirmation (default: false)
- `user_metadata` (object, optional): User-modifiable metadata
- `app_metadata` (object, optional): Admin-only metadata (role, permissions)

**Example (Admin Creates Driver Account - Server-Only):**
```typescript
// app/api/admin/create-driver/route.ts
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // NEVER expose this
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient()

  // Verify requester is admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { email, password, fullName, phone, vehicleType } = body

  // Create driver account with admin API
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // Skip email confirmation
    user_metadata: {
      full_name: fullName,
      phone
    },
    app_metadata: {
      role: 'driver',
      vehicle_type: vehicleType
    }
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Create driver profile
  await supabaseAdmin
    .from('drivers')
    .insert({
      id: data.user.id,
      full_name: fullName,
      email,
      phone,
      vehicle_type: vehicleType,
      status: 'active'
    })

  return NextResponse.json({
    success: true,
    driverId: data.user.id
  })
}
```

**Security Notes:**
- NEVER expose service_role key in client
- Use only in API routes or server actions
- Validate admin permissions before use
- Log all admin operations
- Rotate service_role key regularly

---

### Method 10: Admin API - deleteUser()

**Purpose**: Delete user account (hard delete or soft delete)

**When to use**:
- Remove suspended accounts
- GDPR data deletion requests
- Clean up test accounts

**Syntax:**
```typescript
const { data, error } = await supabase.auth.admin.deleteUser(
  userId: string,
  shouldSoftDelete?: boolean
)
```

**Parameters:**
- `userId` (string, required): UUID of user to delete
- `shouldSoftDelete` (boolean, optional): Soft delete (preserve data) vs hard delete

**Example (Soft Delete with Cleanup):**
```typescript
// app/api/admin/delete-user/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    )
  }

  // Soft delete user (sets deleted_at timestamp)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(
    userId,
    true  // Soft delete
  )

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Mark related data as deleted
  await supabaseAdmin
    .from('restaurants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId)

  return NextResponse.json({ success: true })
}
```

---

## Use Cases for Georgian Distribution System

### Use Case 1: Multi-Role Login Flow

**Scenario**: Users login and are redirected based on their role (Admin, Restaurant, Driver, Demo)

**Implementation**:
```typescript
// app/login/page.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (loginError) {
      setError('Invalid email or password')
      return
    }

    // Get role from JWT
    const role = data.user.app_metadata.role

    // Role-based redirect
    switch (role) {
      case 'admin':
        router.push('/dashboard/admin')
        break
      case 'restaurant':
        router.push('/dashboard/restaurant')
        break
      case 'driver':
        router.push('/dashboard/driver')
        break
      case 'demo':
        router.push('/demo')
        break
      default:
        router.push('/dashboard')
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}
      
      <input 
        type="email" 
        name="email" 
        placeholder="Email" 
        required 
      />
      <input 
        type="password" 
        name="password" 
        placeholder="Password" 
        required 
      />
      <button type="submit">Login</button>
    </form>
  )
}
```

---

### Use Case 2: Protected Routes with RLS Integration

**Scenario**: Restaurant can only see their own orders, enforced by RLS

**Implementation**:
```typescript
// app/dashboard/restaurant/orders/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function RestaurantOrders() {
  const supabase = createServerClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify role
  if (user.app_metadata.role !== 'restaurant') {
    redirect('/unauthorized')
  }

  // RLS automatically filters orders by restaurant_id
  // Policy: (auth.uid() = restaurant_id)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      driver:drivers(full_name, phone),
      items:order_items(
        *,
        product:products(name, price)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch orders:', error)
    return <div>Error loading orders</div>
  }

  return (
    <div>
      <h1>Your Orders ({orders.length})</h1>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
```

---

### Use Case 3: Admin User Management

**Scenario**: Admin creates and manages restaurant accounts

**Implementation**:
```typescript
// app/admin/restaurants/create/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createRestaurant(formData: FormData) {
  const supabase = createServerClient()

  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const restaurantName = formData.get('restaurantName') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string

  // Create user with admin API
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,  // Skip email confirmation
    user_metadata: {
      full_name: restaurantName,
      phone
    },
    app_metadata: {
      role: 'restaurant'
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Create restaurant profile
  const { error: profileError } = await supabaseAdmin
    .from('restaurants')
    .insert({
      id: data.user.id,
      name: restaurantName,
      email,
      phone,
      address,
      status: 'active',
      created_at: new Date().toISOString()
    })

  if (profileError) {
    // Rollback: delete user
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    return { error: 'Failed to create restaurant profile' }
  }

  return { 
    success: true, 
    restaurantId: data.user.id 
  }
}
```

---

## Security Considerations

### 1. JWT Token Security

**Risk**: Stolen JWT tokens can impersonate users

**Mitigation**:
- Use short token expiry (1 hour default)
- Implement refresh token rotation
- Store tokens in httpOnly cookies (not localStorage)
- Validate JWT on every API request
- Use RS256 (asymmetric keys) instead of HS256

**Example (Secure Token Storage with Cookies):**
```typescript
// middleware.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient()

  // Refresh session if needed
  await supabase.auth.getSession()

  return response
}
```

---

### 2. Role-Based Access Control

**Risk**: Users accessing unauthorized resources

**Mitigation**:
- Store roles in `app_metadata` (admin-only)
- Never trust client-side role checks
- Validate role in RLS policies
- Check role in API routes/server actions

**Example (RLS Policy for Restaurant Orders):**
```sql
-- Only restaurant can see their own orders
CREATE POLICY "Restaurants can view their orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = restaurant_id
    OR 
    (auth.jwt() ->> 'role') = 'admin'
  );
```

---

### 3. Password Security

**Risk**: Weak passwords lead to account compromise

**Mitigation**:
- Enforce minimum 8 characters
- Require mix of uppercase, lowercase, numbers, symbols
- Implement password strength meter
- Use HIBP API to check for breached passwords
- Hash passwords with bcrypt (automatic)

**Example (Password Policy Configuration):**
```typescript
// Supabase Dashboard > Authentication > Policies
// Or via SQL:
ALTER ROLE authenticator 
SET password_min_length = 8;

ALTER ROLE authenticator 
SET password_required_characters = 'upper:1,lower:1,digit:1,special:1';
```

---

### 4. Rate Limiting

**Risk**: Brute force attacks on login/signup

**Mitigation**:
- Limit login attempts (5 per 15 minutes)
- Limit signups (10 per hour per IP)
- Use CAPTCHA after failed attempts
- Implement exponential backoff

**Example (Rate Limit with Redis):**
```typescript
// app/api/login/route.ts
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Check rate limit (5 attempts per 15 minutes)
  const { success } = await rateLimit.check(ip, 5, 900)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  // Proceed with login...
}
```

---

### 5. Multi-Factor Authentication (MFA)

**Risk**: Password-only authentication is vulnerable

**Mitigation**:
- Enable TOTP-based MFA for admin accounts
- Optional MFA for restaurant/driver accounts
- Enforce MFA for sensitive operations

**Example (MFA Enrollment):**
```typescript
// app/settings/mfa/actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'

export async function enrollMFA() {
  const supabase = createServerClient()

  // Generate TOTP secret
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Authenticator App'
  })

  if (error) {
    return { error: error.message }
  }

  return {
    qrCode: data.totp.qr_code,  // Show to user
    secret: data.totp.secret,   // Backup secret
    factorId: data.id
  }
}

export async function verifyMFA(factorId: string, code: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code
  })

  if (error) {
    return { error: 'Invalid code' }
  }

  return { success: true }
}
```

---

## Performance Optimization

### 1. Token Refresh Strategy

**Problem**: Frequent token refreshes cause latency

**Solution**: Use background refresh before expiry

**Implementation**:
```typescript
// lib/supabase/client.ts
import { createBrowserClient as createClient } from '@supabase/ssr'

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,  // Auto-refresh before expiry
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    }
  )
}
```

---

### 2. Caching User Data

**Problem**: Repeated `getUser()` calls slow down app

**Solution**: Cache user data with React Context

**Implementation**:
```typescript
// providers/user-provider.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

const UserContext = createContext<User | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
```

---

### 3. Parallel Authentication Checks

**Problem**: Sequential auth + data fetching is slow

**Solution**: Use `Promise.all()` for parallel requests

**Implementation**:
```typescript
// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = createServerClient()

  // Parallel execution
  const [
    { data: { user } },
    { data: stats }
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('dashboard_stats').select('*').single()
  ])

  if (!user) {
    redirect('/login')
  }

  // Render dashboard...
}
```

---

## Best Practices

### 1. **Always Use getUser() for Authentication Checks**

**Why**: `getSession()` only checks localStorage (insecure)  
**How**: Use `getUser()` to validate JWT with Auth server

```typescript
// ❌ WRONG (insecure)
const { data: { session } } = await supabase.auth.getSession()
if (session) {
  // User could fake this!
}

// ✅ CORRECT (secure)
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  // JWT validated by Auth server
}
```

---

### 2. **Store Roles in app_metadata, Not user_metadata**

**Why**: `user_metadata` can be modified by users  
**How**: Use `app_metadata` for authorization data

```typescript
// ❌ WRONG (insecure)
const { data } = await supabase.auth.updateUser({
  data: { role: 'admin' }  // User can set this!
})

// ✅ CORRECT (secure)
// Use admin API (server-side only)
await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'admin' }
})
```

---

### 3. **Implement Proper Error Handling**

**Why**: Expose minimal information to attackers  
**How**: Use generic error messages, log details server-side

```typescript
// ❌ WRONG (reveals info)
if (error) {
  return { error: error.message }  // "User not found"
}

// ✅ CORRECT (generic message)
if (error) {
  console.error('Login failed:', error)  // Log details
  return { error: 'Invalid email or password' }  // Generic to user
}
```

---

### 4. **Use Server Components for Auth Checks**

**Why**: Prevents hydration issues, faster performance  
**How**: Check auth in Server Components, not Client Components

```typescript
// ✅ Server Component (app/dashboard/page.tsx)
import { createServerClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <DashboardContent user={user} />
}
```

---

### 5. **Never Expose service_role Key**

**Why**: Full database access, bypasses RLS  
**How**: Use only in API routes/server actions

```typescript
// ❌ WRONG (client-side)
const supabase = createClient(
  url,
  process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY  // NEVER DO THIS!
)

// ✅ CORRECT (server-side only)
// app/api/admin/route.ts
const supabaseAdmin = createClient(
  url,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Environment variable
)
```

---

## Common Patterns

### Pattern 1: Role-Based Middleware

**When to use**: Protect multiple routes by role

```typescript
// middleware.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check role-based access
  if (user) {
    const role = user.app_metadata.role

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/dashboard/restaurant') && role !== 'restaurant') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/dashboard/driver') && role !== 'driver') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
```

---

### Pattern 2: Custom Hook for User Role

**When to use**: Client-side role checks for UI

```typescript
// hooks/use-user-role.ts
import { useUser } from '@/providers/user-provider'

export function useUserRole() {
  const user = useUser()

  return {
    user,
    role: user?.app_metadata.role as string | undefined,
    isAdmin: user?.app_metadata.role === 'admin',
    isRestaurant: user?.app_metadata.role === 'restaurant',
    isDriver: user?.app_metadata.role === 'driver',
    isDemo: user?.app_metadata.role === 'demo'
  }
}

// Usage in components
function Header() {
  const { isAdmin, role } = useUserRole()

  return (
    <nav>
      {isAdmin && <Link href="/admin">Admin Panel</Link>}
      <span>Role: {role}</span>
    </nav>
  )
}
```

---

## Troubleshooting

### Issue 1: "Invalid JWT" Error

**Symptoms**: API requests fail with 401 Unauthorized

**Cause**: Token expired or malformed

**Solution**:
```typescript
// Check token expiry
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  const expiresAt = new Date(session.expires_at! * 1000)
  console.log('Token expires at:', expiresAt)
  
  if (new Date() > expiresAt) {
    // Token expired, refresh it
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      // Refresh failed, redirect to login
      window.location.href = '/login'
    }
  }
}
```

---

### Issue 2: RLS Policies Not Working

**Symptoms**: Users see data they shouldn't access

**Cause**: Missing or incorrect RLS policies

**Solution**:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS if disabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Create correct policy
CREATE POLICY "Restaurants view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = restaurant_id
  );
```

---

### Issue 3: Token Refresh Loop

**Symptoms**: Infinite refresh requests

**Cause**: Token expiry misconfigured or clock skew

**Solution**:
```typescript
// Disable auto-refresh temporarily
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false
  }
})

// Manually refresh with exponential backoff
async function refreshWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase.auth.refreshSession()
    
    if (!error) {
      return data
    }
    
    // Wait before retry (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
  }
  
  throw new Error('Token refresh failed')
}
```

---

## TypeScript Types & Interfaces

```typescript
// Auto-generated types from Supabase
import { Database } from '@/types/supabase'

type User = Database['auth']['Tables']['users']['Row']
type UserInsert = Database['auth']['Tables']['users']['Insert']
type UserUpdate = Database['auth']['Tables']['users']['Update']

// Custom types for Auth
interface AuthUser {
  id: string
  email: string
  phone?: string
  app_metadata: {
    role: 'admin' | 'restaurant' | 'driver' | 'demo'
    [key: string]: any
  }
  user_metadata: {
    full_name?: string
    avatar_url?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
}

interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
  token_type: 'bearer'
  user: AuthUser
}

interface AuthResponse {
  data: {
    user: AuthUser | null
    session: AuthSession | null
  }
  error: AuthError | null
}

interface AuthError {
  name: string
  message: string
  status: number
}

// Role types
type UserRole = 'admin' | 'restaurant' | 'driver' | 'demo'

interface RolePermissions {
  canCreateOrders: boolean
  canManageUsers: boolean
  canViewAllOrders: boolean
  canManageProducts: boolean
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canCreateOrders: true,
    canManageUsers: true,
    canViewAllOrders: true,
    canManageProducts: true
  },
  restaurant: {
    canCreateOrders: true,
    canManageUsers: false,
    canViewAllOrders: false,
    canManageProducts: false
  },
  driver: {
    canCreateOrders: false,
    canManageUsers: false,
    canViewAllOrders: false,
    canManageProducts: false
  },
  demo: {
    canCreateOrders: false,
    canManageUsers: false,
    canViewAllOrders: false,
    canManageProducts: false
  }
}
```

---

## Integration with Next.js 15

### Server Components

```typescript
// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome, {user.user_metadata.full_name}</h1>
      <p>Role: {user.app_metadata.role}</p>
    </div>
  )
}
```

### Client Components

```typescript
// components/user-menu.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export function UserMenu() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!user) return null

  return (
    <div>
      <span>{user.email}</span>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
```

### API Routes

```typescript
// app/api/auth/callback/route.ts
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

---

## Related Documentation

- [02-supabase-realtime.md](./02-supabase-realtime.md) - Real-time authentication state updates
- [05-row-level-security.md](./05-row-level-security.md) - RLS policies for role-based access
- [09-integration-patterns.md](./09-integration-patterns.md) - Next.js + Auth integration patterns
- [10-security-best-practices.md](./10-security-best-practices.md) - Comprehensive security guidelines

---

## Official Resources

- **Official Docs**: https://supabase.com/docs/guides/auth
- **API Reference**: https://supabase.com/docs/reference/javascript/auth-api
- **GitHub**: https://github.com/supabase/auth
- **Community**: https://github.com/supabase/supabase/discussions

---

*Last Updated: October 29, 2025*  
*Supabase Auth Version: Latest (as of January 2025)*  
*Project: Georgian Distribution System*
