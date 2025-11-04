# Georgian Distribution System - Best Practices Implementation Guide

## 🎯 Project Overview
This guide implements Perplexity's recommended Next.js + Supabase best practices for the Georgian Distribution System project.

---

## 📁 Phase 1: Route Group Reorganization (High Priority)

### 1.1 Create Better Route Structure
```bash
# Current structure needs improvement
# app/dashboard/admin/page.tsx
# app/dashboard/restaurant/page.tsx  
# app/dashboard/driver/page.tsx
# app/dashboard/demo/page.tsx

# Target structure
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/register  
mkdir -p app/\(auth\)/reset-password
mkdir -p app/\(public\)/landing
mkdir -p app/\(public\)/demo-access
mkdir -p app/\(dashboard\)/admin/_components
mkdir -p app/\(dashboard\)/restaurant/_components
mkdir -p app/\(dashboard\)/driver/_components  
mkdir -p app/\(dashboard\)/demo/_components
```

### 1.2 Reorganize Dashboard Routes
```typescript
// app/\(auth\)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return <LoginForm />
}

// app/\(dashboard\)/admin/layout.tsx
import MainLayout from '@/components/layout/MainLayout'
import AdminNavigation from './_components/AdminNavigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      <AdminNavigation />
      {children}
    </MainLayout>
  )
}

// app/\(dashboard\)/admin/_components/AdminNavigation.tsx
'use client'
// Private admin navigation component
```

---

## 🏗️ Phase 2: Services Consolidation (High Priority)

### 2.1 Create Services Structure
```bash
mkdir -p src/services/auth
mkdir -p src/services/user
mkdir -p src/services/orders
mkdir -p src/services/admin
mkdir -p src/services/restaurant
mkdir -p src/services/driver
mkdir -p src/services/demo
```

### 2.2 Implement Auth Service
```typescript
// src/services/auth/auth.service.ts
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { z } from 'zod'
import { signInSchema } from '@/lib/validators/auth'

export class AuthService {
  private supabase = createClient()

  async signIn(email: string, password: string) {
    // Validate input
    const result = signInSchema.safeParse({ email, password })
    if (!result.success) {
      throw new Error('Invalid input: ' + result.error.message)
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data, error: null }
  }
  
  async signOut() {
    return await this.supabase.auth.signOut()
  }
  
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    return user
  }

  async getUserRole(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }
    
    return data?.role || null
  }
}

// Export singleton instance
export const authService = new AuthService()
```

### 2.3 Implement Order Service
```typescript
// src/services/orders/order.service.ts
import { createClient } from '@/lib/supabase/client'
import { orderSchema, OrderItem } from '@/lib/validators/orders'

export class OrderService {
  private supabase = createClient()

  async createOrder(orderData: {
    items: OrderItem[]
    delivery_address: string
    special_instructions?: string
    restaurant_id: string
  }) {
    // Validate order data
    const result = orderSchema.safeParse(orderData)
    if (!result.success) {
      throw new Error('Invalid order data: ' + result.error.message)
    }

    const { data, error } = await this.supabase
      .from('orders')
      .insert([
        {
          restaurant_id: orderData.restaurant_id,
          delivery_address: orderData.delivery_address,
          special_instructions: orderData.special_instructions,
          status: 'pending',
          items: orderData.items
        }
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`)
    }

    return data
  }

  async getOrdersForRole(userId: string, role: string) {
    let query = this.supabase
      .from('orders')
      .select('*, restaurants(name), drivers(name)')
      .order('created_at', { ascending: false })

    switch (role) {
      case 'restaurant':
        query = query.eq('restaurant_id', userId)
        break
      case 'driver':
        query = query.eq('driver_id', userId)
        break
      case 'admin':
        // Admin sees all orders
        break
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }

    return data || []
  }

  async updateOrderStatus(orderId: string, status: string, driverId?: string) {
    const updateData: any = { status }
    
    if (driverId) {
      updateData.driver_id = driverId
    }

    const { data, error } = await this.supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update order: ${error.message}`)
    }

    return data
  }
}

export const orderService = new OrderService()
```

### 2.4 Implement Admin Service
```typescript
// src/services/admin/admin.service.ts
import { createClient } from '@/lib/supabase/client'

export class AdminService {
  private supabase = createClient()

  async getDashboardAnalytics() {
    const { data: orders } = await this.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: restaurants } = await this.supabase
      .from('restaurants')
      .select('*')

    const { data: drivers } = await this.supabase
      .from('drivers')
      .select('*')

    // Calculate analytics
    const totalOrders = orders?.length || 0
    const activeRestaurants = restaurants?.length || 0
    const activeDrivers = drivers?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    return {
      totalOrders,
      activeRestaurants,
      activeDrivers,
      totalRevenue,
      ordersByStatus: this.groupOrdersByStatus(orders || []),
      revenueByDay: this.calculateRevenueByDay(orders || [])
    }
  }

  private groupOrdersByStatus(orders: any[]) {
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
  }

  private calculateRevenueByDay(orders: any[]) {
    const revenueByDay: { [key: string]: number } = {}
    
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      revenueByDay[date] = (revenueByDay[date] || 0) + (order.total_amount || 0)
    })
    
    return revenueByDay
  }

  async getAllUsers() {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return data || []
  }

  async updateUserRole(userId: string, role: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`)
    }

    return data
  }
}

export const adminService = new AdminService()
```

---

## ✅ Phase 3: Validation Centralization (High Priority)

### 3.1 Create Validators Structure
```bash
mkdir -p src/lib/validators/auth
mkdir -p src/lib/validators/orders
mkdir -p src/lib/validators/products
mkdir -p src/lib/validators/restaurant
mkdir -p src/lib/validators/driver
```

### 3.2 Implement Auth Validators
```typescript
// src/lib/validators/auth/auth.ts
import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['restaurant', 'driver', 'admin', 'demo']),
  restaurant_name: z.string().min(1, 'Restaurant name is required').optional(),
  full_name: z.string().min(1, 'Full name is required').optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatar_url: z.string().url().optional()
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
```

### 3.3 Implement Order Validators
```typescript
// src/lib/validators/orders/orders.ts
import { z } from 'zod'

export const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  special_instructions: z.string().optional()
})

export const orderCreateSchema = z.object({
  restaurant_id: z.string().uuid(),
  delivery_address: z.string().min(1, 'Delivery address is required'),
  special_instructions: z.string().optional(),
  delivery_date: z.date().min(new Date(), 'Delivery date must be in the future'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required')
})

export const orderUpdateSchema = z.object({
  status: z.enum([
    'pending', 'confirmed', 'preparing', 'out_for_delivery', 
    'delivered', 'cancelled'
  ]).optional(),
  driver_id: z.string().uuid().optional(),
  total_amount: z.number().min(0).optional(),
  special_instructions: z.string().optional()
})

export const orderPricingSchema = z.object({
  pricing_data: z.record(z.string(), z.object({
    unit_price: z.number().min(0),
    total_price: z.number().min(0)
  }))
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type OrderCreateInput = z.infer<typeof orderCreateSchema>
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>
export type OrderPricingInput = z.infer<typeof orderPricingSchema>
```

### 3.4 Implement Product Validators
```typescript
// src/lib/validators/products/products.ts
import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  cost_price: z.number().min(0, 'Cost price must be non-negative'),
  markup_percentage: z.number().min(0).max(100).optional(),
  is_active: z.boolean().default(true),
  image_url: z.string().url().optional()
})

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  cost_price: z.number().min(0).optional(),
  markup_percentage: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
  image_url: z.string().url().optional()
})

export const productSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductSearchInput = z.infer<typeof productSearchSchema>
```

### 3.5 Create Validators Index
```typescript
// src/lib/validators/index.ts
// Auth validators
export * from './auth/auth'

// Order validators  
export * from './orders/orders'

// Product validators
export * from './products/products'

// Restaurant validators
export * from './restaurant/restaurant'

// Driver validators
export * from './driver/driver'
```

---

## 🔧 Phase 4: Constants Consolidation

### 4.1 Create Centralized Constants
```typescript
// src/lib/constants.ts

export const USER_ROLES = {
  ADMIN: 'admin',
  RESTAURANT: 'restaurant',
  DRIVER: 'driver',
  DEMO: 'demo'
} as const

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const

export const PRODUCT_CATEGORIES = {
  MEAT: 'meat',
  VEGETABLES: 'vegetables',
  DAIRY: 'dairy',
  GRAINS: 'grains',
  BEVERAGES: 'beverages',
  CONDIMENTS: 'condiments',
  SPICES: 'spices',
  OTHER: 'other'
} as const

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  ORDERS: '/api/orders',
  PRODUCTS: '/api/products',
  ADMIN: '/api/admin',
  RESTAURANT: '/api/restaurant',
  DRIVER: '/api/driver',
  ANALYTICS: '/api/analytics',
  DEMO: '/api/demo'
} as const

export const UI_CONFIG = {
  SIDEBAR_WIDTH: 240,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  DESKTOP_BREAKPOINT: 1280,
  TOAST_DURATION: 5000,
  MODAL_ANIMATION_DURATION: 200
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const

export const DEMO_LIMITS = {
  MAX_ORDERS: 5,
  MAX_PRODUCTS: 10,
  MAX_USERS: 3
} as const

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_PHONE_LENGTH: 15,
  MAX_ADDRESS_LENGTH: 200
} as const

// Export as const for type safety
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
export type ProductCategory = typeof PRODUCT_CATEGORIES[keyof typeof PRODUCT_CATEGORIES]

// Create readonly arrays for dropdowns
export const USER_ROLE_OPTIONS = Object.values(USER_ROLES)
export const ORDER_STATUS_OPTIONS = Object.values(ORDER_STATUS)
export const PRODUCT_CATEGORY_OPTIONS = Object.values(PRODUCT_CATEGORIES)
```

---

## 🏗️ Phase 5: Enhanced Supabase Configuration

### 5.1 Create Supabase Configuration Structure
```bash
mkdir -p src/lib/supabase
mkdir -p supabase/migrations
mkdir -p supabase/functions
mkdir -p supabase/config
```

### 5.2 Enhanced Client Configuration
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Create and export client instance
export const supabase = createClient()

// Type helper for database operations
export type SupabaseClient = ReturnType<typeof createClient>
```

### 5.3 Enhanced Server Configuration
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // The `set` method was called from a Server Component
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // The `delete` method was called from a Server Component
          }
        },
      },
    }
  )
}

// Service role client for admin operations
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(supabaseUrl, serviceRoleKey)
}
```

### 5.4 Create Utility Functions
```typescript
// src/lib/supabase/utils.ts
import { User } from '@supabase/supabase-js'
import { createClient, createServerClient } from './client'
import { USER_ROLES } from '../constants'

// Client-side utilities
export const clientUtils = {
  async getCurrentUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error fetching user:', error)
      return null
    }
    
    return user
  },

  async getUserProfile(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  },

  async checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId)
    return profile?.role === requiredRole
  }
}

// Server-side utilities  
export const serverUtils = {
  async getServerUser(request: Request) {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error fetching server user:', error)
      return null
    }
    
    return user
  },

  async requireAuth(request: Request) {
    const user = await this.getServerUser(request)
    
    if (!user) {
      throw new Error('Authentication required')
    }
    
    return user
  },

  async requireRole(request: Request, requiredRole: string) {
    const user = await this.requireAuth(request)
    const profile = await serverUtils.getUserProfile(user.id)
    
    if (profile?.role !== requiredRole) {
      throw new Error(`Access denied. Required role: ${requiredRole}`)
    }
    
    return { user, profile }
  },

  async getUserProfile(userId: string) {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  }
}
```

---

## 🎯 Implementation Priority & Timeline

### Week 1 (Critical)
1. ✅ **Route Group Reorganization** - Implement proper route grouping
2. ✅ **Services Implementation** - Create auth, orders, admin services
3. ✅ **Validation Centralization** - Implement Zod validators for auth, orders, products
4. ✅ **Constants Consolidation** - Move all constants to lib/constants.ts

### Week 2 (Important)  
5. ✅ **Enhanced Supabase Configuration** - Improve client/server setup
6. ✅ **Private Components** - Add _components folders where needed
7. ✅ **Error Handling** - Implement missing error/loading pages
8. ✅ **TypeScript Optimization** - Enhance path aliases

### Week 3 (Polish)
9. ✅ **Documentation Updates** - Update README and component documentation
10. ✅ **Performance Optimization** - Review and optimize imports
11. ✅ **Testing** - Ensure all changes work correctly
12. ✅ **Migration Scripts** - Automate any needed data migrations

---

## 🚀 Quick Start Commands

```bash
# Phase 1: Route Structure
mkdir -p app/\(auth\)/login app/\(auth\)/register app/\(auth\)/reset-password
mkdir -p app/\(dashboard\)/admin/_components app/\(dashboard\)/restaurant/_components
mkdir -p app/\(dashboard\)/driver/_components app/\(dashboard\)/demo/_components

# Phase 2: Services Structure  
mkdir -p src/services/auth src/services/orders src/services/admin
mkdir -p src/services/restaurant src/services/driver src/services/demo

# Phase 3: Validators Structure
mkdir -p src/lib/validators/auth src/lib/validators/orders src/lib/validators/products
mkdir -p src/lib/validators/restaurant src/lib/validators/driver

# Phase 4: Enhanced Config
mkdir -p src/lib/supabase supabase/migrations supabase/functions
mkdir -p supabase/config

# Phase 5: Additional Improvements
mkdir -p src/styles src/types/database src/components/_shared
mkdir -p public/images/products public/images/restaurants public/icons public/fonts
```

---

## ✅ Success Criteria

After implementing these best practices:

1. **✅ Clear Route Organization** - Logical route grouping with proper URLs
2. **✅ Centralized Business Logic** - All services properly organized and accessible
3. **✅ Type-Safe Validation** - Comprehensive Zod schemas for all inputs
4. **✅ Enhanced Developer Experience** - Better imports, path aliases, and code organization
5. **✅ Scalable Architecture** - Structure that supports team growth and feature expansion
6. **✅ Production Ready** - Following official Next.js and Supabase best practices

---

## 🎉 Expected Benefits

- **Developer Experience**: Easier navigation and code discovery
- **Maintainability**: Clear separation of concerns and responsibilities  
- **Scalability**: Better structure for team collaboration and feature growth
- **Performance**: Optimized imports and reduced bundle sizes
- **Type Safety**: Comprehensive validation and TypeScript integration
- **Best Practices**: Full compliance with official Next.js + Supabase patterns

**Note**: These changes are incremental and production-safe. Each phase builds on the previous one to create a more organized, maintainable, and scalable codebase while maintaining full functionality.

---

*Last Updated: October 31, 2025*  
*Based on: Perplexity Next.js + Supabase Best Practices Guide*  
*Project: Georgian Distribution System*