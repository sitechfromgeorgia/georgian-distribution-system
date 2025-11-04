# Database Guidelines

> **მონაცემთა ბაზის სახელმძღვანელო** | Supabase PostgreSQL best practices

---

## 🗄️ Database Philosophy

1. **RLS is Law** - All security enforced at database level
2. **Indexes for Performance** - Strategic indexing for common queries
3. **Constraints for Integrity** - Let database enforce data rules
4. **Migrations are Sacred** - Never modify production DB manually
5. **Normalize Wisely** - Balance normalization with query performance

---

## 📊 Database Schema

### Current Tables

```
profiles          - User profiles with roles
products          - Product catalog
orders            - Order management
order_items       - Order line items
notifications     - User notifications
demo_sessions     - Demo environment isolation
```

### Schema Design Principles

```sql
-- ✅ Use UUIDs for primary keys
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ...
);

-- ✅ Add timestamps for audit trail
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  -- ...
);

-- ✅ Use foreign keys for referential integrity
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  -- ...
);

-- ✅ Add check constraints for data validation
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) CHECK (unit_price >= 0),
  -- ...
);
```

---

## 🔐 Row-Level Security (RLS)

### RLS Architecture

**Every table MUST have RLS enabled and policies defined.**

```sql
-- Step 1: Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 2: Create policies for each role and operation
-- Admin: Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Restaurant: Can SELECT own orders
CREATE POLICY "restaurant_select_own" ON orders
  FOR SELECT
  USING (restaurant_id = auth.uid());

-- Restaurant: Can INSERT with self as restaurant_id
CREATE POLICY "restaurant_insert_own" ON orders
  FOR INSERT
  WITH CHECK (restaurant_id = auth.uid());

-- Restaurant: Cannot UPDATE or DELETE (admin only)

-- Driver: Can SELECT assigned orders
CREATE POLICY "driver_select_assigned" ON orders
  FOR SELECT
  USING (driver_id = auth.uid());

-- Driver: Can UPDATE status of assigned orders
CREATE POLICY "driver_update_assigned" ON orders
  FOR UPDATE
  USING (driver_id = auth.uid())
  WITH CHECK (
    driver_id = auth.uid()
    AND status IN ('in_transit', 'delivered')
  );

-- Demo: Read-only, recent data only
CREATE POLICY "demo_read_recent" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'demo'
    )
    AND created_at > NOW() - INTERVAL '7 days'
  );
```

### RLS Policy Patterns

```sql
-- Pattern 1: Role-based full access
CREATE POLICY "admin_full_access" ON {table}
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Pattern 2: Owner-only access
CREATE POLICY "owner_only" ON {table}
  FOR SELECT
  USING (user_id = auth.uid());

-- Pattern 3: Conditional access
CREATE POLICY "conditional_access" ON {table}
  FOR SELECT
  USING (
    public = true
    OR user_id = auth.uid()
    OR shared_with @> ARRAY[auth.uid()]
  );

-- Pattern 4: Time-based access
CREATE POLICY "recent_data_only" ON {table}
  FOR SELECT
  USING (created_at > NOW() - INTERVAL '30 days');

-- Pattern 5: Status-based access
CREATE POLICY "published_only" ON {table}
  FOR SELECT
  USING (status = 'published' OR author_id = auth.uid());
```

### RLS Testing

```sql
-- Test as different roles
SET request.jwt.claims TO '{"sub": "user-id-here", "role": "restaurant"}';

-- Verify restaurant can only see own orders
SELECT * FROM orders; -- Should only return own orders

-- Verify restaurant cannot see other orders
SELECT * FROM orders WHERE restaurant_id != auth.uid(); -- Should return nothing

-- Reset
RESET request.jwt.claims;
```

---

## 🚀 Query Optimization

### Strategic Indexes

```sql
-- ✅ Index foreign keys
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ✅ Index frequently filtered columns
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_products_available ON products(available);

-- ✅ Index for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ✅ Composite indexes for common query patterns
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);

-- ✅ Unique indexes for constraints
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
CREATE UNIQUE INDEX idx_demo_sessions_session_id ON demo_sessions(session_id);
```

### Query Performance Tips

```typescript
// ✅ Select only needed columns
const { data } = await supabase
  .from('orders')
  .select('id, status, total_amount, created_at')
  .eq('restaurant_id', restaurantId)

// ❌ Avoid SELECT *
const { data } = await supabase
  .from('orders')
  .select('*') // ❌ Fetches all columns, slower

// ✅ Use pagination for large datasets
const { data } = await supabase
  .from('orders')
  .select('*')
  .range(0, 49) // First 50 orders
  .order('created_at', { ascending: false })

// ✅ Use count for total records
const { count } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending')

// ✅ Use EXISTS for checking existence
SELECT EXISTS (
  SELECT 1 FROM orders
  WHERE restaurant_id = 'xxx' AND status = 'pending'
)
-- Better than COUNT(*) when you just need true/false
```

---

## 🔄 Database Migrations

### Migration Strategy

```bash
# Development: Use Supabase Dashboard for schema changes
# Production: Use migration scripts

database/migrations/
  001_initial_schema.sql
  002_add_notifications.sql
  003_add_indexes.sql
  004_rls_policies.sql
```

### Migration Best Practices

```sql
-- ✅ Make migrations idempotent
CREATE TABLE IF NOT EXISTS orders (
  -- ...
);

-- ✅ Use transactions
BEGIN;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
  CREATE INDEX IF NOT EXISTS idx_orders_notes ON orders(notes);
COMMIT;

-- ✅ Add comments for documentation
COMMENT ON TABLE orders IS 'Stores order information with status tracking';
COMMENT ON COLUMN orders.status IS 'Order status: pending, confirmed, in_transit, delivered, cancelled';

-- ✅ Handle rollback scenario
-- migration_up.sql
ALTER TABLE orders ADD COLUMN priority INTEGER DEFAULT 0;

-- migration_down.sql
ALTER TABLE orders DROP COLUMN priority;
```

---

## 📊 Data Integrity

### Constraints

```sql
-- ✅ NOT NULL for required fields
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  status TEXT NOT NULL,
  -- ...
);

-- ✅ CHECK constraints for valid values
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'confirmed',
    'in_transit',
    'delivered',
    'cancelled'
  )),
  total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
  -- ...
);

-- ✅ UNIQUE constraints where needed
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  -- ...
);

-- ✅ Foreign key with CASCADE
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- When order is deleted, all items are deleted too
  -- ...
);
```

### Triggers for Data Consistency

```sql
-- ✅ Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ✅ Cascade status updates
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.restaurant_id,
      'order_status_changed',
      'Order Status Updated',
      'Your order #' || NEW.id || ' status changed to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();
```

---

## 🔄 Real-time Database

### Supabase Realtime Configuration

```sql
-- Enable realtime for table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Realtime is subject to RLS policies
-- Users only receive updates for rows they have access to
```

### Client-side Realtime

```typescript
// ✅ Subscribe to table changes
const channel = supabase
  .channel('orders-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'orders',
      filter: `restaurant_id=eq.${userId}`, // RLS applied
    },
    (payload) => {
      console.log('Order changed:', payload)
      // Invalidate queries, update UI, etc.
    }
  )
  .subscribe()

// ✅ Cleanup subscription
return () => {
  supabase.removeChannel(channel)
}
```

---

## 🧪 Testing Database Operations

### Test Data Setup

```sql
-- test-data.sql
BEGIN;

-- Create test users
INSERT INTO auth.users (id, email) VALUES
  ('admin-test-id', 'admin@test.com'),
  ('restaurant-test-id', 'restaurant@test.com'),
  ('driver-test-id', 'driver@test.com');

INSERT INTO profiles (id, full_name, role) VALUES
  ('admin-test-id', 'Test Admin', 'admin'),
  ('restaurant-test-id', 'Test Restaurant', 'restaurant'),
  ('driver-test-id', 'Test Driver', 'driver');

-- Create test products
INSERT INTO products (id, name, name_georgian, category, unit, available) VALUES
  ('product-1', 'Apple', 'ვაშლი', 'fruits', 'kg', true),
  ('product-2', 'Banana', 'ბანანი', 'fruits', 'kg', true);

-- Create test orders
INSERT INTO orders (id, restaurant_id, status, total_amount) VALUES
  ('order-1', 'restaurant-test-id', 'pending', 100.00),
  ('order-2', 'restaurant-test-id', 'confirmed', 200.00);

COMMIT;
```

### Testing Queries

```typescript
// test/database/orders.test.ts
describe('Orders Database', () => {
  it('respects RLS for restaurant role', async () => {
    // Login as restaurant
    const { data: session } = await supabase.auth.signInWithPassword({
      email: 'restaurant@test.com',
      password: 'password',
    })

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')

    // Should only see own orders
    expect(orders).toHaveLength(2)
    expect(orders.every(o => o.restaurant_id === session.user.id)).toBe(true)
  })

  it('allows admin to see all orders', async () => {
    // Login as admin
    await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'password',
    })

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')

    // Should see all orders
    expect(orders.length).toBeGreaterThan(2)
  })
})
```

---

## 📈 Monitoring & Maintenance

### Database Health Checks

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- queries taking more than 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

### Backup Strategy

```bash
# Daily automated backups (Supabase handles this)
# Manual backup for critical changes
pg_dump -h data.greenland77.ge -U postgres -d georgian_distribution > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h data.greenland77.ge -U postgres -d georgian_distribution < backup_20251103.sql
```

---

## 🔒 Security Best Practices

### Principle of Least Privilege

```sql
-- ✅ Service role (backend only, never exposed)
-- Full access for admin operations

-- ✅ Anon role (public, used by frontend)
-- Read-only access to public data
GRANT SELECT ON products TO anon;

-- ✅ Authenticated role (logged-in users)
-- Access controlled by RLS policies
GRANT ALL ON orders TO authenticated;
```

### Sensitive Data

```sql
-- ❌ Don't store sensitive data in plaintext
CREATE TABLE users (
  id UUID PRIMARY KEY,
  password_hash TEXT NOT NULL, -- ✅ Hashed, not plaintext
  -- ...
);

-- ✅ Use Supabase Auth for authentication
-- Never store passwords yourself
```

---

## 📚 Supabase Client Best Practices

```typescript
// ✅ Create singleton client
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ Type-safe queries
const { data: orders } = await supabase
  .from('orders')
  .select('id, status, created_at')
  // TypeScript knows the shape of data

// ✅ Error handling
const { data, error } = await supabase
  .from('orders')
  .insert({ restaurant_id: '123', status: 'pending' })

if (error) {
  console.error('Database error:', error.message)
  throw new Error('Failed to create order')
}

// ✅ Batch operations
const { data, error } = await supabase
  .from('orders')
  .insert([
    { restaurant_id: '1', status: 'pending' },
    { restaurant_id: '2', status: 'pending' },
  ])
```

---

## 📋 Database Checklist

Before deploying changes:
- [ ] RLS enabled on all tables
- [ ] Policies defined for all roles
- [ ] Indexes created for foreign keys
- [ ] Indexes created for frequently queried columns
- [ ] Constraints added for data validation
- [ ] Triggers tested for side effects
- [ ] Migration script tested on staging
- [ ] Backup taken before schema changes
- [ ] Realtime enabled for required tables
- [ ] Performance tested with production-like data volume

---

**Last Updated:** 2025-11-03
**Database:** PostgreSQL 15+ (Supabase)
**RLS Policies:** 25+ comprehensive policies
**Indexes:** 12 strategic indexes
