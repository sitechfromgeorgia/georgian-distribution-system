# PostgREST API: Complete Technical Reference

## Overview

PostgREST automatically generates a RESTful API from your PostgreSQL database schema. For the Georgian Distribution System, it provides instant CRUD endpoints for orders, products, restaurants, and drivers without writing backend code.

### Key Features
- **Auto-generated REST API** from database schema
- **Complex queries** with filtering, ordering, pagination
- **Foreign key relationships** via joins
- **Full-text search** capabilities
- **RLS policy enforcement** for security
- **Aggregate functions** (count, sum, avg)

---

## Core Concepts

### 1. Resource Endpoints

Every table becomes a REST endpoint:
```
GET    /orders           - List all orders
POST   /orders           - Create new order
GET    /orders?id=eq.1   - Get specific order
PATCH  /orders?id=eq.1   - Update order
DELETE /orders?id=eq.1   - Delete order
```

### 2. Query Operators

Filter data using operators:
```
eq    - Equal                     ?status=eq.pending
neq   - Not equal                 ?status=neq.cancelled
gt    - Greater than              ?total=gt.100
gte   - Greater than or equal     ?total=gte.50
lt    - Less than                 ?quantity=lt.10
lte   - Less than or equal        ?quantity=lte.100
like  - LIKE operator             ?name=like.*pizza*
ilike - Case-insensitive LIKE     ?email=ilike.*@gmail.com
in    - IN operator               ?status=in.(pending,confirmed)
is    - IS operator               ?driver_id=is.null
```

### 3. Select Queries

Choose specific columns:
```
?select=id,name,price
?select=*
?select=id,name,restaurant:restaurants(name,address)
```

---

## API Reference

### Method 1: select()

**Purpose**: Fetch data from table

**Syntax**:
```typescript
const { data, error } = await supabase
  .from(table: string)
  .select(columns?: string)
  .filters...
```

**Example (List Restaurant Orders)**:
```typescript
// Fetch orders with related data
const { data: orders, error } = await supabase
  .from('orders')
  .select(`
    *,
    restaurant:restaurants(id, name, address),
    driver:drivers(id, full_name, phone),
    items:order_items(
      quantity,
      price,
      product:products(name, image_url)
    )
  `)
  .eq('restaurant_id', restaurantId)
  .order('created_at', { ascending: false })
  .limit(10)

if (error) console.error(error)
else console.log(orders)
```

---

### Method 2: insert()

**Purpose**: Create new records

**Syntax**:
```typescript
const { data, error } = await supabase
  .from(table: string)
  .insert(values: object | object[])
  .select()  // Return inserted data
```

**Example (Create Order)**:
```typescript
// Create order with items
const { data: order, error } = await supabase
  .from('orders')
  .insert({
    restaurant_id: restaurantId,
    driver_id: driverId,
    status: 'pending',
    total: 150.50,
    delivery_address: '123 Main St, Batumi'
  })
  .select()
  .single()

if (error) {
  console.error('Failed to create order:', error)
  return
}

// Create order items
const { error: itemsError } = await supabase
  .from('order_items')
  .insert(
    items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))
  )
```

---

### Method 3: update()

**Purpose**: Update existing records

**Syntax**:
```typescript
const { data, error } = await supabase
  .from(table: string)
  .update(values: object)
  .match(conditions: object)
  .select()
```

**Example (Update Order Status)**:
```typescript
const { data, error } = await supabase
  .from('orders')
  .update({ 
    status: 'confirmed',
    confirmed_at: new Date().toISOString()
  })
  .eq('id', orderId)
  .select()
  .single()

if (!error) {
  console.log('Order confirmed:', data)
}
```

---

### Method 4: delete()

**Purpose**: Delete records

**Syntax**:
```typescript
const { error } = await supabase
  .from(table: string)
  .delete()
  .match(conditions: object)
```

**Example**:
```typescript
const { error } = await supabase
  .from('orders')
  .delete()
  .eq('id', orderId)
```

---

### Method 5: upsert()

**Purpose**: Insert or update (on conflict)

**Syntax**:
```typescript
const { data, error } = await supabase
  .from(table: string)
  .upsert(values: object | object[], {
    onConflict?: string  // Conflict column(s)
  })
  .select()
```

**Example (Update Product Inventory)**:
```typescript
const { data, error } = await supabase
  .from('products')
  .upsert({
    id: productId,
    name: 'Coca Cola 500ml',
    price: 2.50,
    stock: 100
  }, {
    onConflict: 'id'
  })
  .select()
```

---

### Method 6: Filters (eq, neq, gt, lt, etc.)

**Purpose**: Filter query results

**Examples**:
```typescript
// Equal
.eq('status', 'pending')

// Not equal
.neq('status', 'cancelled')

// Greater than
.gt('total', 50)

// Less than or equal
.lte('created_at', '2025-01-01')

// IN operator
.in('status', ['pending', 'confirmed'])

// IS NULL
.is('driver_id', null)

// LIKE
.like('name', '%pizza%')

// Case-insensitive LIKE
.ilike('email', '%@gmail.com')

// Full-text search
.textSearch('description', 'delicious spicy')
```

---

### Method 7: order()

**Purpose**: Sort results

**Syntax**:
```typescript
.order(column: string, { ascending?: boolean, nullsFirst?: boolean })
```

**Example**:
```typescript
const { data } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .order('total', { ascending: true })
```

---

### Method 8: limit() & range()

**Purpose**: Pagination

**Syntax**:
```typescript
.limit(count: number)
.range(from: number, to: number)
```

**Example (Paginated Orders)**:
```typescript
const page = 1
const pageSize = 10

const { data, error } = await supabase
  .from('orders')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1)

// data = orders for current page
// count = total number of orders
```

---

### Method 9: count()

**Purpose**: Count records

**Syntax**:
```typescript
const { count, error } = await supabase
  .from(table: string)
  .select('*', { count: 'exact', head: true })
  .filters...
```

**Example**:
```typescript
// Count pending orders
const { count } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending')

console.log(`${count} pending orders`)
```

---

### Method 10: rpc()

**Purpose**: Call PostgreSQL functions

**Syntax**:
```typescript
const { data, error } = await supabase
  .rpc(functionName: string, params?: object)
```

**Example (Calculate Daily Revenue)**:
```typescript
// PostgreSQL function
CREATE FUNCTION get_daily_revenue(target_date date)
RETURNS numeric AS $$
  SELECT SUM(total)
  FROM orders
  WHERE DATE(created_at) = target_date
  AND status = 'completed'
$$ LANGUAGE SQL;

// Call from TypeScript
const { data: revenue } = await supabase
  .rpc('get_daily_revenue', {
    target_date: '2025-01-15'
  })

console.log(`Revenue: ₾${revenue}`)
```

---

## Use Cases

### Use Case 1: Complex Joins

```typescript
// Fetch orders with all related data
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    restaurant:restaurants!inner(
      id,
      name,
      address,
      phone
    ),
    driver:drivers(
      id,
      full_name,
      phone,
      vehicle_type
    ),
    items:order_items(
      id,
      quantity,
      price,
      product:products(
        id,
        name,
        image_url,
        category
      )
    )
  `)
  .eq('restaurant_id', restaurantId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false })
```

---

### Use Case 2: Full-Text Search

```typescript
// Search products
const { data: products } = await supabase
  .from('products')
  .select('*')
  .textSearch('name', 'cola', {
    type: 'websearch',
    config: 'english'
  })
```

---

### Use Case 3: Aggregations

```typescript
// Get order statistics
const { data: stats } = await supabase
  .from('orders')
  .select('status')
  .eq('restaurant_id', restaurantId)

const pending = stats.filter(o => o.status === 'pending').length
const completed = stats.filter(o => o.status === 'completed').length

// Better: Use PostgreSQL function
CREATE FUNCTION get_order_stats(restaurant_uuid uuid)
RETURNS json AS $$
  SELECT json_build_object(
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
  )
  FROM orders
  WHERE restaurant_id = restaurant_uuid
$$ LANGUAGE SQL;

const { data: stats } = await supabase
  .rpc('get_order_stats', { restaurant_uuid: restaurantId })
```

---

## Security Considerations

### 1. RLS Policies Applied

PostgREST automatically enforces RLS policies:
```sql
-- Restaurants can only see their orders
CREATE POLICY "Restaurants view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = restaurant_id);

-- API queries automatically filtered
-- SELECT * FROM orders WHERE restaurant_id = auth.uid()
```

---

### 2. Input Validation

Always validate and sanitize inputs:
```typescript
import { z } from 'zod'

const orderSchema = z.object({
  restaurant_id: z.string().uuid(),
  total: z.number().positive(),
  delivery_address: z.string().min(10)
})

const validated = orderSchema.parse(inputData)
```

---

## Performance Optimization

### 1. Use Indexes

```sql
-- Speed up common queries
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
```

---

### 2. Limit Columns

```typescript
// Don't fetch all columns
.select('id,name,price')  // Good

.select('*')  // Bad if not needed
```

---

### 3. Pagination

```typescript
// Always paginate large datasets
.range(0, 49)  // First 50 records
```

---

## Best Practices

1. **Use .select()** to specify needed columns
2. **Paginate** large result sets
3. **Create indexes** for filtered columns
4. **Use RPC** for complex aggregations
5. **Validate inputs** server-side
6. **Handle errors** gracefully

---

## Troubleshooting

### Issue 1: No Data Returned

Check RLS policies:
```sql
SELECT * FROM orders;  -- Returns nothing

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

---

### Issue 2: Slow Queries

Check query plan:
```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE restaurant_id = 'uuid';
```

---

## TypeScript Types

```typescript
import { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
```

---

## Official Resources

- **Docs**: https://supabase.com/docs/guides/api
- **PostgREST**: https://postgrest.org

---

*Last Updated: October 29, 2025*
