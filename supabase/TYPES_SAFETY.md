# TypeScript Type Safety for Georgian Distribution System

This file documents the TypeScript integration for the Georgian Distribution System Supabase CLI setup.

## Generated Types

TypeScript types are automatically generated from your Supabase schema and should be used throughout the frontend application for type safety.

### Generating Types

```bash
# Generate types for local development
supabase gen types typescript --local > ../frontend/src/types/database.types.ts

# Generate types for production
supabase gen types typescript --project-ref your-project-ref > ../frontend/src/types/database.types.ts
```

### Using Generated Types

```typescript
// Import the generated database types
import { Database } from '@/types/database.types';

// Use in your Supabase client
const supabase = createClient<Database>(url, anonKey);

// Use in function signatures
async function getProducts(): Promise<Database['public']['Tables']['products']['Row'][]> {
  const { data } = await supabase
    .from('products')
    .select('*');
  
  return data || [];
}

// Georgian language fields
interface ProductWithGeorgian extends Database['public']['Tables']['products']['Row'] {
  name_ka: string; // Georgian name (ქართული)
  description_ka?: string; // Georgian description
}
```

## Georgian Language Support in Types

The database schema includes Georgian language support:

```sql
-- Products table includes bilingual fields
name TEXT,              -- English name
name_ka TEXT,           -- Georgian name (ქართული)
description TEXT,       -- English description
description_ka TEXT     -- Georgian description

-- Notifications include Georgian messages
title TEXT,             -- English title
title_ka TEXT,          -- Georgian title
message TEXT,           -- English message
message_ka TEXT         -- Georgian message
```

### Usage Examples

```typescript
// Working with Georgian product names
const getLocalizedProduct = (product: Database['public']['Tables']['products']['Row'], lang: 'en' | 'ka') => {
  return {
    ...product,
    name: lang === 'ka' ? product.name_ka : product.name,
    description: lang === 'ka' ? product.description_ka : product.description
  };
};

// Type-safe Georgian notifications
const createNotification = (
  userId: string,
  title: string,
  titleKa: string,
  message: string,
  messageKa: string
) => {
  return supabase.from('notifications').insert({
    user_id: userId,
    title,
    title_ka: titleKa,
    message,
    message_ka: messageKa,
    type: 'info' as const
  });
};
```

## Role-Based Access Control Types

```typescript
// User roles
type UserRole = Database['public']['Enums']['user_role']; // 'admin' | 'restaurant' | 'driver' | 'demo'

// Order status
type OrderStatus = Database['public']['Enums']['order_status']; 
// 'pending' | 'confirmed' | 'priced' | 'assigned' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'

// Type-safe role checking
const hasAccess = (user: Database['public']['Tables']['profiles']['Row'], requiredRole: UserRole): boolean => {
  if (user.role === 'admin') return true;
  return user.role === requiredRole;
};
```

## Custom Types for Georgian Distribution

```typescript
// Extended product type with Georgian support
export interface GeorgianProduct {
  id: string;
  name: string;          // English
  name_ka: string;       // Georgian (ქართული)
  category: string;
  unit: string;
  price: number;
  stock_quantity: number;
  active: boolean;
}

// Extended order type
export interface GeorgianOrder {
  id: string;
  restaurant_id: string;
  driver_id?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string;
  created_at: string;
  updated_at: string;
  // Relations
  order_items?: GeorgianOrderItem[];
  restaurant?: GeorgianRestaurant;
  driver?: GeorgianDriver;
}

// User profile with Georgian-specific fields
export interface GeorgianUserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  restaurant_name?: string;  // Georgian restaurant names
  phone: string;
  address: string;
  is_active: boolean;
}
```

## Database Schema Type References

### Core Tables

| Table | Type | Key Georgian Fields |
|-------|------|-------------------|
| `profiles` | `Database['public']['Tables']['profiles']['Row']` | `restaurant_name`, `full_name` |
| `products` | `Database['public']['Tables']['products']['Row']` | `name_ka`, `description_ka` |
| `orders` | `Database['public']['Tables']['orders']['Row']` | `delivery_address` |
| `order_items` | `Database['public']['Tables']['order_items']['Row']` | `notes` |
| `notifications` | `Database['public']['Tables']['notifications']['Row']` | `title_ka`, `message_ka` |

### Enums

- `user_role`: admin, restaurant, driver, demo
- `order_status`: pending, confirmed, priced, assigned, out_for_delivery, delivered, completed, cancelled
- `notification_type`: info, success, warning, error

## Integration with Frontend

### Type-Safe API Calls

```typescript
// Product service with type safety
export class ProductService {
  async getProducts(): Promise<GeorgianProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async getLowStockProducts(): Promise<GeorgianProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('stock_quantity', supabase.raw('min_stock_level'))
      .eq('active', true);
    
    if (error) throw error;
    return data || [];
  }
}
```

### Form Validation with Zod

```typescript
import { z } from 'zod';
import { Database } from '@/types/database.types';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  name_ka: z.string().min(1, 'Georgian name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().positive('Price must be positive'),
  cost_price: z.number().positive('Cost price must be positive'),
  stock_quantity: z.number().min(0, 'Stock quantity cannot be negative'),
  min_stock_level: z.number().min(0, 'Minimum stock level cannot be negative')
});

type ProductFormData = z.infer<typeof productSchema>;
```

## Best Practices

1. **Always use generated types** instead of hardcoding table/column names
2. **Enable strict TypeScript** in your `tsconfig.json`
3. **Use the Georgian language fields** for proper localization
4. **Validate data** using Zod schemas based on generated types
5. **Export custom interfaces** for frequently used combinations

## Troubleshooting

### Type Generation Issues

```bash
# Force regenerate types
rm ../frontend/src/types/database.types.ts
supabase gen types typescript --local > ../frontend/src/types/database.types.ts

# Check for schema changes
supabase db diff
```

### Missing Types

If you get type errors:

1. Ensure `supabase gen types typescript --local` is up to date
2. Check that your migration files are properly applied
3. Verify `tsconfig.json` has the correct path to types file

### Runtime Type Safety

Use Zod for runtime validation:

```typescript
import { z } from 'zod';

// Runtime validation of API responses
const orderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'confirmed', 'priced', 'assigned', 'out_for_delivery', 'delivered', 'completed', 'cancelled']),
  total_amount: z.number(),
  created_at: z.string()
});

const validatedOrder = orderSchema.parse(apiResponse);
```

---

This setup ensures type safety throughout the Georgian Distribution System with full support for bilingual content and role-based access control.