# Database Design: Complete Reference

## Overview
PostgreSQL schema design for the Georgian Distribution System with migrations, types, and best practices.

## Schema Structure

### Core Tables
```sql
-- Users (handled by auth.users)
-- Extended with profiles

-- Restaurants
CREATE TABLE restaurants (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers
CREATE TABLE drivers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  driver_id UUID REFERENCES drivers(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL,
  delivery_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes
```sql
-- Performance indexes
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

## Triggers
```sql
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

## Migrations

### Using Supabase CLI
```bash
# Create migration
supabase migration new add_orders_table

# Edit migration file
# supabase/migrations/20250129_add_orders_table.sql

# Apply migration
supabase db push

# Reset database
supabase db reset
```

### Migration Example
```sql
-- supabase/migrations/20250129_add_orders_table.sql
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Restaurants view own orders"
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = restaurant_id);
```

## TypeScript Types

### Generate Types
```bash
supabase gen types typescript --local > types/supabase.ts
```

### Use Types
```typescript
import { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
```

## Best Practices
1. **Use UUIDs** for primary keys
2. **Add indexes** on foreign keys
3. **Enable RLS** on all tables
4. **Use migrations** for schema changes
5. **Add timestamps** (created_at, updated_at)
6. **Use CHECK constraints** for validation
7. **Use ON DELETE CASCADE** for child tables
8. **Generate TypeScript types** after migrations

## Foreign Key Relationships
```sql
-- One-to-Many
orders.restaurant_id -> restaurants.id

-- Many-to-Many (junction table)
-- Not used in Georgian Distribution System
```

## Official Docs
https://supabase.com/docs/guides/database

*Last Updated: October 29, 2025*
