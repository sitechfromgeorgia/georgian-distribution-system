# Admin Role Policies

## Overview

The **admin** role has the highest level of access in the Georgian Distribution System. Admins can bypass most RLS restrictions and perform system-wide operations.

## Core Privileges

### 🔑 Full System Access
- **Unrestricted data access** across all tables
- **Bypass RLS policies** for any table
- **User management** capabilities
- **System configuration** access

### 👥 User Management
- **View all profiles** regardless of role
- **Update any profile** including role changes
- **Delete user accounts** with proper validation
- **Create admin accounts** and assign roles

### 📊 Business Operations
- **View all orders** across restaurants and drivers
- **Manage all products** across all restaurants
- **Override order status** changes
- **Access financial data** and reports

### 🔧 System Administration
- **Audit log access** for compliance
- **Policy violation monitoring**
- **System health monitoring**
- **Database maintenance operations**

## Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Bypass |
|-------|--------|--------|--------|--------|--------|
| `profiles` | ✅ All | ✅ All | ✅ All | ✅ All | ✅ |
| `products` | ✅ All | ✅ All | ✅ All | ✅ All | ✅ |
| `orders` | ✅ All | ✅ All | ✅ All | ✅ All | ✅ |
| `order_items` | ✅ All | ✅ All | ✅ All | ✅ All | ✅ |
| `notifications` | ✅ All | ✅ All | ✅ All | ✅ All | ✅ |
| `demo_sessions` | ✅ All | ✅ All | ✅ All | ✅ All | ✅ |
| `policy_audit_log` | ✅ All | ✅ System | ✅ All | ✅ All | ✅ |

## Key Policies

### Profile Management
```sql
-- Admin can view all profiles
CREATE POLICY "profiles_select_admin_all" ON profiles
    FOR SELECT USING (is_admin());

-- Admin can update any profile
CREATE POLICY "profiles_update_admin_all" ON profiles
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- Admin can delete any profile
CREATE POLICY "profiles_delete_admin_only" ON profiles
    FOR DELETE USING (is_admin());
```

### Order Oversight
```sql
-- Admin can view all orders
CREATE POLICY "orders_select_admin_all" ON orders
    FOR SELECT USING (is_admin());

-- Admin can update any order status
CREATE POLICY "orders_update_admin_all" ON orders
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
```

### Audit Access
```sql
-- Admin can view all audit logs
CREATE POLICY "audit_log_select_admin_only" ON policy_audit_log
    FOR SELECT USING (is_admin());
```

## Business Logic Enforcement

### Financial Oversight
- **View revenue reports** across all restaurants
- **Access cost analysis** data
- **Monitor delivery fees** and commissions
- **Generate system-wide analytics**

### Quality Control
- **Monitor order fulfillment** rates
- **Track delivery performance** metrics
- **Review customer satisfaction** data
- **Identify operational bottlenecks**

## Security Considerations

### ⚠️ High Privilege Role
- **Admin access should be limited** to trusted personnel
- **Regular audit reviews** recommended
- **Multi-factor authentication** required
- **Session timeout enforcement** active

### 🔍 Monitoring Requirements
- **All admin actions logged** in `policy_audit_log`
- **Unusual activity detection** patterns
- **Regular access reviews** scheduled
- **Privilege escalation tracking** active

## Common Admin Tasks

### User Management
```sql
-- View all users by role
SELECT role, COUNT(*) as user_count
FROM profiles
GROUP BY role;

-- Change user role
UPDATE profiles 
SET role = 'restaurant' 
WHERE id = 'target-user-id';
```

### System Monitoring
```sql
-- Check policy violations
SELECT policy_name, COUNT(*) as violations
FROM policy_audit_log
WHERE allowed = false
GROUP BY policy_name;

-- Monitor active sessions
SELECT p.full_name, ds.started_at
FROM demo_sessions ds
JOIN profiles p ON p.id = ds.session_id::UUID
WHERE ds.ended_at IS NULL;
```

### Financial Oversight
```sql
-- Revenue by restaurant
SELECT p.restaurant_name, SUM(o.total_amount) as revenue
FROM orders o
JOIN profiles p ON p.id = o.restaurant_id
WHERE o.status = 'completed'
GROUP BY p.id, p.restaurant_name
ORDER BY revenue DESC;
```

## Troubleshooting

### Common Issues

**Admin cannot access data:**
- Verify `is_admin()` function returns `true`
- Check profile role is set to `'admin'`
- Ensure JWT claims contain proper role

**Policy violations in audit log:**
- Review specific policy causing violation
- Check business logic validation rules
- Verify user permissions and role assignment

**Performance issues:**
- Monitor query execution plans
- Review policy complexity
- Consider index optimization

### Debug Commands

```sql
-- Check current user role
SELECT get_user_role();

-- Test admin functions
SELECT is_admin(), is_restaurant(), is_driver();

-- View current policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'profiles';
```

## Best Practices

### ✅ Do's
- **Use admin role sparingly** for routine operations
- **Document admin actions** in audit log
- **Regular security reviews** of admin access
- **Monitor admin activity patterns** for anomalies

### ❌ Don'ts
- **Don't use admin role** for testing
- **Don't bypass business logic** without justification
- **Don't share admin credentials** across team members
- **Don't disable admin auditing** features

---

**Related Documentation:**
- [Business Logic Policies](../business-logic/)
- [Testing Scenarios](../testing/test-scenarios.md)
- [Troubleshooting Guide](../testing/troubleshooting.md)

**Policy Functions:** `is_admin()`, `get_user_role()`