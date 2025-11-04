# Row-Level Security (RLS): Complete Technical Reference

## Overview

Row-Level Security (RLS) is PostgreSQL's built-in security mechanism that restricts database access on a per-row basis. For the Georgian Distribution System, RLS ensures restaurants only see their orders, drivers only access assigned deliveries, and admins have full access.

### Key Features
- **Row-level filtering** based on user identity
- **JWT claims access** via auth.uid() and auth.jwt()
- **Policy-based authorization** for each table
- **Automatic enforcement** by PostgREST
- **Role-based access** (Admin, Restaurant, Driver, Demo)

---

## Core Concepts

### 1. RLS Policies

Policies define access rules:
```sql
CREATE POLICY "policy_name"
  ON table_name
  FOR operation  -- SELECT, INSERT, UPDATE, DELETE, ALL
  TO role        -- authenticated, anon, service_role
  USING (condition)       -- For SELECT
  WITH CHECK (condition)  -- For INSERT/UPDATE
```

### 2. Helper Functions

Supabase provides JWT access functions:
- `auth.uid()` - Returns current user's UUID
- `auth.jwt()` - Returns full JWT token
- `auth.email()` - Returns user's email

### 3. Policy Types

- **PERMISSIVE** (default) - Allow access if ANY policy passes
- **RESTRICTIVE** - Deny access unless ALL policies pass

---

## API Reference

### Pattern 1: Simple Ownership

**Scenario**: Restaurants can only see their own orders

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Restaurants view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = restaurant_id);

CREATE POLICY "Restaurants create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Restaurants update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = restaurant_id)
  WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Restaurants delete own orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = restaurant_id);
```

---

### Pattern 2: Role-Based Access

**Scenario**: Admin can access all data, restaurants only own data

```sql
-- Admin can view all orders
CREATE POLICY "Admins view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Restaurants view own orders
CREATE POLICY "Restaurants view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = restaurant_id
  );

-- Policies are PERMISSIVE by default (OR logic)
-- Admin OR Restaurant owner can view
```

---

### Pattern 3: Foreign Key Filtering

**Scenario**: Drivers can view orders assigned to them

```sql
CREATE POLICY "Drivers view assigned orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = driver_id
    OR
    (auth.jwt() ->> 'role') = 'admin'
  );
```

---

### Pattern 4: Multi-Factor Authentication

**Scenario**: Require MFA for sensitive operations

```sql
CREATE POLICY "MFA required for deletion"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = restaurant_id
    AND
    (auth.jwt() -> 'aal')::text = '"aal2"'  -- MFA enabled
  );
```

---

### Pattern 5: Time-Based Access

**Scenario**: Orders can only be modified within 1 hour of creation

```sql
CREATE POLICY "Edit recent orders only"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = restaurant_id
    AND
    created_at > NOW() - INTERVAL '1 hour'
  );
```

---

### Pattern 6: Join-Based Access

**Scenario**: Users can view order items if they own the order

```sql
CREATE POLICY "Users view own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE restaurant_id = auth.uid()
    )
  );
```

---

### Pattern 7: Public Read, Authenticated Write

**Scenario**: Products are public, only authenticated users can create

```sql
-- Public can read
CREATE POLICY "Public read products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated can create
CREATE POLICY "Authenticated create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

### Pattern 8: Restrictive Policies

**Scenario**: Ensure both conditions must pass

```sql
-- User must own restaurant AND have verified email
CREATE POLICY "Verified users only" ON orders
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = restaurant_id
    AND
    (auth.jwt() -> 'email_confirmed_at') IS NOT NULL
  );
```

---

### Pattern 9: Custom JWT Claims

**Scenario**: Check custom role from JWT

```sql
CREATE POLICY "Role-based access"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    CASE (auth.jwt() ->> 'role')
      WHEN 'admin' THEN true
      WHEN 'restaurant' THEN restaurant_id = auth.uid()
      WHEN 'driver' THEN driver_id = auth.uid()
      ELSE false
    END
  );
```

---

### Pattern 10: Bypass RLS (Service Role)

**Scenario**: Admin operations that need full access

```typescript
// Server-side only
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Full access to all rows
const { data: allOrders } = await supabaseAdmin
  .from('orders')
  .select('*')
```

---

## Use Cases for Georgian Distribution System

### Use Case 1: Restaurant Dashboard

```sql
-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Restaurants view own orders
CREATE POLICY "restaurant_orders_select"
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = restaurant_id);

-- Restaurants view own order items
CREATE POLICY "restaurant_order_items_select"
  ON order_items FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE restaurant_id = auth.uid()
    )
  );

-- Restaurants update own profile
CREATE POLICY "restaurant_profile_update"
  ON restaurants FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

### Use Case 2: Driver App

```sql
-- Drivers view assigned orders
CREATE POLICY "driver_orders_select"
  ON orders FOR SELECT TO authenticated
  USING (
    auth.uid() = driver_id
    OR
    (status = 'pending' AND driver_id IS NULL)  -- Available orders
  );

-- Drivers update assigned orders
CREATE POLICY "driver_orders_update"
  ON orders FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);
```

---

### Use Case 3: Admin Dashboard

```sql
-- Admins can do everything
CREATE POLICY "admin_all_access"
  ON orders FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- Same for all other tables
CREATE POLICY "admin_restaurants_access"
  ON restaurants FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');
```

---

## Security Considerations

### 1. Never Trust Client Data

Always validate on server:
```sql
-- ❌ WRONG - user_metadata can be faked
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')

-- ✅ CORRECT - app_metadata is admin-only
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
```

---

### 2. Test Policies Thoroughly

```sql
-- Test as different users
SET request.jwt.claim.sub = 'user-uuid-here';
SET request.jwt.claim.role = 'authenticated';

SELECT * FROM orders;  -- Should only return user's orders
```

---

### 3. Use Restrictive Policies for Critical Operations

```sql
CREATE POLICY "critical_operation" ON sensitive_table
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    AND
    (auth.jwt() -> 'aal')::text = '"aal2"'  -- Require MFA
  );
```

---

## Performance Optimization

### 1. Index Foreign Keys

```sql
-- Speed up policy checks
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
```

---

### 2. Avoid Complex Subqueries

```sql
-- ❌ SLOW - nested subquery
USING (
  order_id IN (
    SELECT id FROM orders WHERE restaurant_id IN (
      SELECT id FROM restaurants WHERE manager_id = auth.uid()
    )
  )
)

-- ✅ FAST - join
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.id = order_items.order_id
    AND r.manager_id = auth.uid()
  )
)
```

---

### 3. Use Materialized Views

```sql
-- Cache expensive policy checks
CREATE MATERIALIZED VIEW user_accessible_orders AS
SELECT o.* FROM orders o
WHERE o.restaurant_id = auth.uid()
   OR o.driver_id = auth.uid();

-- Refresh periodically
REFRESH MATERIALIZED VIEW user_accessible_orders;
```

---

## Best Practices

1. **Enable RLS on ALL tables** in public schema
2. **Use app_metadata** for roles (never user_metadata)
3. **Index foreign key columns** used in policies
4. **Test policies** with different users
5. **Use RESTRICTIVE** policies for critical operations
6. **Log policy violations** for security monitoring
7. **Document policies** with clear comments

---

## Troubleshooting

### Issue 1: No Rows Returned

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Test policy manually
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM orders;
```

---

### Issue 2: Policy Not Working

```sql
-- Verify user ID
SELECT auth.uid();  -- Should return UUID

-- Verify JWT claims
SELECT auth.jwt();  -- Should return full token

-- Check policy logic
SELECT 
  id,
  restaurant_id,
  auth.uid() as current_user,
  restaurant_id = auth.uid() as matches
FROM orders;
```

---

## Official Resources

- **Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL RLS**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

*Last Updated: October 29, 2025*
