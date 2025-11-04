# Restaurant Role Policies

## Overview

The **restaurant** role represents business operators who manage orders, products, and inventory within the Georgian Distribution System. Restaurants have focused access to their own business data while maintaining proper isolation from other restaurants.

## Core Privileges

### 🍽️ Business Operations
- **Manage own products** and inventory
- **Create and track orders** for their restaurant
- **Update order status** through workflow
- **View order history** and analytics
- **Manage staff notifications**

### 📦 Inventory Management
- **Create new products** with pricing
- **Update product availability** and stock
- **Monitor inventory levels** and alerts
- **Upload product images** for marketing
- **Manage product categories** and descriptions

### 📋 Order Management
- **View orders assigned** to their restaurant
- **Update order status** (pending → confirmed → priced → assigned)
- **Add order items** during order creation
- **Modify order totals** before assignment
- **Cancel orders** before driver assignment

### 👤 Profile Management
- **Update restaurant profile** information
- **Manage contact details** and addresses
- **Update staff access** within business
- **View customer delivery preferences**

## Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `profiles` | ✅ Own + Other Restaurants | ✅ Own | ✅ Own | ❌ | Can view other restaurants |
| `products` | ✅ Public + Own | ✅ Own | ✅ Own | ✅ Own | Cannot access other restaurant products |
| `orders` | ✅ Own Restaurant | ✅ Own | ✅ Own | ❌ | Cannot access other restaurants |
| `order_items` | ✅ Own Orders | ✅ Own Orders | ✅ Own Orders | ✅ Own Orders | Through order access |
| `notifications` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | System notifications included |
| `demo_sessions` | ❌ | ❌ | ❌ | ❌ | No demo access |

## Key Policies

### Product Management
```sql
-- View public and own products
CREATE POLICY "products_select_own_restaurant" ON products
    FOR SELECT USING (
        active = true OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'restaurant'
        )
    );

-- Create own products
CREATE POLICY "products_insert_restaurant_own" ON products
    FOR INSERT WITH CHECK (
        is_restaurant() AND
        NOT is_demo()
    );
```

### Order Processing
```sql
-- View orders for own restaurant
CREATE POLICY "orders_select_own_restaurant" ON orders
    FOR SELECT USING (
        restaurant_id = auth.uid() OR
        is_admin()
    );

-- Create orders for own restaurant
CREATE POLICY "orders_insert_restaurant_own" ON orders
    FOR INSERT WITH CHECK (
        restaurant_id = auth.uid() AND
        is_restaurant() AND
        NOT is_demo()
    );
```

## Order Workflow Policies

### Status Progression Rules
```sql
-- Restaurants can update order status with validation
CREATE POLICY "orders_update_restaurant_own" ON orders
    FOR UPDATE USING (
        restaurant_id = auth.uid() AND
        is_restaurant() AND
        status NOT IN ('completed', 'cancelled')
    )
    WITH CHECK (
        restaurant_id = auth.uid() AND
        is_restaurant() AND
        -- Prevent status regression
        CASE 
            WHEN status = 'confirmed' THEN OLD.status = 'pending'
            WHEN status = 'priced' THEN OLD.status IN ('pending', 'confirmed')
            WHEN status = 'assigned' THEN OLD.status IN ('pending', 'confirmed', 'priced')
            ELSE true
        END
    );
```

### Status Progression Map
```
Pending → Confirmed → Priced → Assigned → Out for Delivery → Delivered → Completed
   ↓         ↓          ↓         ↓              ↓             ↓         ↓
 Driver   Restaurant  Restaurant  Admin/        Driver        Driver   Restaurant
Request   Accept      Calculate   System                                    Confirm
           Order       Price       Assign                             Completion
```

## Business Logic Enforcement

### Inventory Validation
- **Stock levels** cannot go negative
- **Price updates** require business justification
- **Product availability** affects customer visibility
- **Minimum stock alerts** for inventory management

### Order Validation
- **Order totals** calculated from line items
- **Delivery addresses** validated for service area
- **Order timing** within business hours (configurable)
- **Item availability** checked at order creation

### Financial Controls
- **Price changes** logged for audit
- **Discount policies** enforced at database level
- **Tax calculations** automatic based on location
- **Commission tracking** for platform fees

## Security Considerations

### 🔒 Data Isolation
- **Restaurant-specific access** enforced at database level
- **Cross-restaurant access** explicitly denied
- **Customer data** protected per restaurant
- **Financial data** isolated per business

### ⚡ Performance Optimization
- **Indexed queries** for restaurant-specific lookups
- **Efficient status updates** with minimal overhead
- **Real-time notifications** for status changes
- **Batch operations** for inventory updates

## Common Restaurant Operations

### Daily Operations
```sql
-- View today's orders
SELECT * FROM orders 
WHERE restaurant_id = auth.uid() 
AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Update order status
UPDATE orders 
SET status = 'confirmed', updated_at = NOW()
WHERE id = 'order-id' 
AND restaurant_id = auth.uid();

-- Check low stock items
SELECT name, stock_quantity, min_stock_level
FROM products 
WHERE restaurant_id = auth.uid()
AND stock_quantity <= min_stock_level;
```

### Inventory Management
```sql
-- Update product stock
UPDATE products 
SET stock_quantity = 50, updated_at = NOW()
WHERE id = 'product-id' 
AND restaurant_id = auth.uid();

-- Add new product
INSERT INTO products (name, name_ka, category, unit, price, cost_price, stock_quantity)
VALUES ('Georgian Wine', 'ქართული ღვინო', 'beverages', 'bottle', 25.00, 15.00, 100);
```

### Order Processing
```sql
-- Add items to order
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT 'order-id', product.id, 2, product.price, 2 * product.price
FROM products product
WHERE product.id = 'selected-product-id';

-- Calculate order total
UPDATE orders 
SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM order_items 
    WHERE order_id = 'order-id'
)
WHERE id = 'order-id'
AND restaurant_id = auth.uid();
```

## Troubleshooting

### Common Issues

**Cannot access other restaurant data:**
- Verify `is_restaurant()` function returns `true`
- Check profile role is set to `'restaurant'`
- Ensure proper data isolation is working

**Order status update rejected:**
- Check status progression rules
- Verify current status allows transition
- Ensure driver not already assigned

**Product images not uploading:**
- Check storage bucket permissions
- Verify role-based upload policies
- Ensure file size and format validation

### Debug Commands

```sql
-- Check restaurant-specific access
SELECT COUNT(*) FROM products WHERE restaurant_id = auth.uid();
SELECT COUNT(*) FROM orders WHERE restaurant_id = auth.uid();

-- View order workflow history
SELECT status, created_at, updated_at
FROM orders 
WHERE restaurant_id = auth.uid()
ORDER BY created_at DESC;

-- Check inventory status
SELECT name, stock_quantity, active
FROM products 
WHERE restaurant_id = auth.uid()
ORDER BY stock_quantity ASC;
```

## Best Practices

### ✅ Operational Excellence
- **Regular inventory audits** for accuracy
- **Timely order processing** for customer satisfaction
- **Accurate pricing updates** for profit optimization
- **Proactive stock management** to avoid stockouts

### ✅ Security Guidelines
- **Secure profile management** with regular updates
- **Limited staff access** based on need-to-know
- **Audit trail maintenance** for business compliance
- **Regular access reviews** for staff changes

### ❌ Common Pitfalls
- **Don't update prices** without business justification
- **Don't ignore inventory alerts** for low stock
- **Don't delay order processing** during peak hours
- **Don't oversell items** without stock validation

---

**Related Documentation:**
- [Order Workflow Policies](../business-logic/order-workflow-policies.md)
- [Inventory Management Policies](../business-logic/inventory-policies.md)
- [Product Management Guide](../tables/products-policies.md)

**Policy Functions:** `is_restaurant()`, `get_user_role()`