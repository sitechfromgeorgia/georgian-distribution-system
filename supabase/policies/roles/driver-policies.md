# Driver Role Policies

## Overview

The **driver** role represents delivery personnel in the Georgian Distribution System. Drivers have access to assigned orders, can update delivery status, and manage their delivery workflows while maintaining proper access controls.

## Core Privileges

### 🚚 Delivery Operations
- **View assigned orders** and delivery details
- **Update delivery status** (assigned → out_for_delivery → delivered)
- **Accept pending orders** when available
- **Access delivery addresses** and customer information
- **Track delivery progress** in real-time

### 📍 Order Management
- **View own assigned orders** exclusively
- **Update order status** during delivery process
- **Access customer contact** information
- **Log delivery confirmations** digitally
- **View delivery history** and performance metrics

### 🏃 Fulfillment Workflow
- **Accept unassigned orders** in pending/confirmed status
- **Update delivery timestamps** and location updates
- **Mark orders as delivered** upon completion
- **Handle delivery issues** with proper status updates
- **Maintain delivery confirmations** with customers

## Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `profiles` | ✅ Own | ❌ | ✅ Own | ❌ | Can view restaurant info |
| `products` | ❌ | ❌ | ❌ | ❌ | No product access needed |
| `orders` | ✅ Assigned + Pending | ❌ | ✅ Assigned + Pending | ❌ | Status updates only |
| `order_items` | ✅ Own Orders | ❌ | ❌ | ❌ | Through order access |
| `notifications` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | Delivery notifications |
| `demo_sessions` | ❌ | ❌ | ❌ | ❌ | No demo access |

## Key Policies

### Order Access
```sql
-- Drivers can view assigned orders or accept pending ones
CREATE POLICY "orders_select_assigned_driver" ON orders
    FOR SELECT USING (
        driver_id = auth.uid() OR
        (driver_id IS NULL AND is_driver() AND status IN ('pending', 'confirmed')) OR
        is_admin()
    );

-- Drivers can update assigned order statuses
CREATE POLICY "orders_update_driver_assigned" ON orders
    FOR UPDATE USING (
        driver_id = auth.uid() AND
        is_driver() AND
        status IN ('assigned', 'out_for_delivery')
    )
    WITH CHECK (
        driver_id = auth.uid() AND
        is_driver() AND
        status IN ('out_for_delivery', 'delivered')
    );
```

### Order Assignment
```sql
-- Drivers can accept unassigned pending orders
CREATE POLICY "orders_update_driver_assignment" ON orders
    FOR UPDATE USING (
        driver_id IS NULL AND
        is_driver() AND
        status IN ('pending', 'confirmed') AND
        OLD.driver_id IS NULL
    )
    WITH CHECK (
        driver_id = auth.uid() AND
        is_driver() AND
        status = 'assigned'
    );
```

## Delivery Workflow Policies

### Status Progression Rules
```
Assigned → Out for Delivery → Delivered → Completed
   ↓              ↓              ↓           ↓
Driver        Driver        Driver    Restaurant
Accepts       Updates       Confirms   Finalizes
Order         Status        Delivery   Order
```

### Status Update Validation
```sql
-- Validate proper delivery status progression
CASE 
    WHEN status = 'out_for_delivery' THEN OLD.status = 'assigned'
    WHEN status = 'delivered' THEN OLD.status = 'out_for_delivery'
    WHEN status = 'completed' THEN OLD.status = 'delivered'
    ELSE true
END
```

## Business Logic Enforcement

### Delivery Validation
- **Order assignment** prevents multiple drivers accepting same order
- **Status progression** enforces proper delivery workflow
- **Customer confirmation** required for delivery completion
- **Time tracking** for delivery performance metrics

### Performance Tracking
- **Delivery time monitoring** for performance analytics
- **Customer satisfaction** tracking through confirmations
- **Route efficiency** analysis for optimization
- **Driver performance** metrics and reporting

### Communication Management
- **Real-time notifications** for status changes
- **Customer updates** during delivery process
- **Admin alerts** for delivery issues
- **Performance feedback** loops

## Security Considerations

### 🔒 Access Control
- **Order-specific access** only to assigned deliveries
- **Customer data protection** with minimal exposure
- **Delivery address security** with proper validation
- **Status update auditing** for accountability

### 📱 Mobile-First Design
- **Optimized queries** for mobile applications
- **Offline capability** for poor connectivity areas
- **Real-time updates** for live order tracking
- **Secure authentication** with session management

## Common Driver Operations

### Daily Deliveries
```sql
-- View today's assigned deliveries
SELECT o.*, p.full_name as customer_name, p.address as delivery_address
FROM orders o
JOIN profiles p ON p.id = o.restaurant_id
WHERE o.driver_id = auth.uid()
AND DATE(o.created_at) = CURRENT_DATE
ORDER BY o.delivery_time;

-- Update delivery status
UPDATE orders 
SET status = 'out_for_delivery', updated_at = NOW()
WHERE id = 'order-id' 
AND driver_id = auth.uid();
```

### Order Assignment
```sql
-- Accept pending order
UPDATE orders 
SET driver_id = auth.uid(), status = 'assigned', updated_at = NOW()
WHERE driver_id IS NULL 
AND status IN ('pending', 'confirmed')
AND NOT EXISTS (
    SELECT 1 FROM orders o2 
    WHERE o2.driver_id = auth.uid() 
    AND o2.status IN ('assigned', 'out_for_delivery')
    AND DATE(o2.created_at) = CURRENT_DATE
);
```

### Delivery Confirmation
```sql
-- Mark order as delivered
UPDATE orders 
SET status = 'delivered', updated_at = NOW()
WHERE id = 'order-id' 
AND driver_id = auth.uid()
AND status = 'out_for_delivery';
```

## Performance Optimization

### 🚀 Query Efficiency
- **Indexed driver lookups** for fast order retrieval
- **Status-based filtering** for efficient queries
- **Real-time subscriptions** for live updates
- **Batch operations** for multiple order updates

### 📊 Analytics Support
- **Delivery time tracking** for performance metrics
- **Route optimization** data collection
- **Customer feedback** integration
- **Driver efficiency** monitoring

## Troubleshooting

### Common Issues

**Cannot see available orders:**
- Check `is_driver()` function returns `true`
- Verify status is 'pending' or 'confirmed'
- Ensure no active assignments exist

**Status update rejected:**
- Validate proper status progression
- Check if order already assigned to another driver
- Verify delivery time constraints

**Performance issues:**
- Monitor query execution plans
- Review real-time subscription efficiency
- Check mobile connectivity

### Debug Commands

```sql
-- Check driver-specific orders
SELECT status, COUNT(*) as order_count
FROM orders 
WHERE driver_id = auth.uid()
GROUP BY status;

-- View delivery performance
SELECT DATE(created_at) as delivery_date, COUNT(*) as deliveries
FROM orders 
WHERE driver_id = auth.uid()
AND status = 'delivered'
GROUP BY DATE(created_at)
ORDER BY delivery_date DESC;
```

## Best Practices

### ✅ Delivery Excellence
- **Timely status updates** for customer transparency
- **Accurate delivery confirmations** for business records
- **Professional communication** with customers
- **Performance optimization** through efficient routes

### ✅ Operational Efficiency
- **Proactive order acceptance** during peak hours
- **Proper status progression** following workflow rules
- **Customer service excellence** during deliveries
- **Continuous improvement** based on feedback

### ❌ Common Pitfalls
- **Don't delay status updates** during delivery process
- **Don't skip customer confirmations** for delivery completion
- **Don't accept orders** without proper route planning
- **Don't ignore delivery issues** without proper escalation

---

**Related Documentation:**
- [Order Workflow Policies](../business-logic/order-workflow-policies.md)
- [Notification Policies](../business-logic/notification-policies.md)
- [Order Management Guide](../tables/orders-policies.md)

**Policy Functions:** `is_driver()`, `get_user_role()`