# Demo Role Policies

## Overview

The **demo** role is designed for testing and demonstration purposes in the Georgian Distribution System. Demo users have highly restricted access with time limitations, data isolation, and comprehensive safeguards to prevent abuse while allowing meaningful system exploration.

## Core Restrictions

### 🔒 Limited Access
- **Read-only permissions** for most operations
- **Time-restricted sessions** with automatic expiry
- **Data isolation** from production data
- **No financial operations** or sensitive data access
- **Session-based limitations** with usage tracking

### ⏰ Time Constraints
- **1-hour session limits** for data access
- **Automatic session termination** after expiry
- **Limited concurrent sessions** per user (10 max)
- **Demo data refresh** every 30 minutes
- **Controlled data exposure** with anonymization

### 📊 Read-Only Operations
- **View sample products** and categories
- **Browse order history** from demo data
- **Access public information** only
- **View system features** without modification
- **No data creation** or persistent changes

## Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `profiles` | ❌ | ❌ | ❌ | ❌ | No profile access |
| `products` | ✅ Public only (1 hour) | ❌ | ❌ | ❌ | Active products only |
| `orders` | ✅ Demo data (1 hour) | ❌ | ❌ | ❌ | Time-restricted |
| `order_items` | ✅ Demo data (1 hour) | ❌ | ❌ | ❌ | Through order access |
| `notifications` | ✅ Own | ✅ Own | ✅ Own | ✅ Own | Limited notifications |
| `demo_sessions` | ✅ Own | ✅ System | ✅ Own | ✅ Own | Session management |

## Key Policies

### Product Access
```sql
-- Demo users can view public products with time limit
CREATE POLICY "products_select_demo_limited" ON products
    FOR SELECT USING (
        is_demo() AND
        active = true AND
        validate_demo_session() AND
        created_at >= NOW() - INTERVAL '1 hour'
    );
```

### Order Access
```sql
-- Demo users can view recent demo orders only
CREATE POLICY "orders_select_demo_limited" ON orders
    FOR SELECT USING (
        is_demo() AND
        validate_demo_session() AND
        created_at >= NOW() - INTERVAL '1 hour'
    );
```

### Session Management
```sql
-- Demo users can manage their own sessions
CREATE POLICY "demo_sessions_select_own" ON demo_sessions
    FOR SELECT USING (
        session_id = auth.uid()::text OR
        is_admin()
    );

CREATE POLICY "demo_sessions_insert_system" ON demo_sessions
    FOR INSERT WITH CHECK (
        session_id = auth.uid()::text OR
        is_admin()
    );
```

## Demo Data Management

### 📋 Sample Data Categories
- **Restaurant profiles** with realistic Georgian business names
- **Product catalog** with authentic Georgian food items
- **Order history** showing typical business scenarios
- **Driver assignments** with realistic delivery patterns
- **Analytics data** demonstrating system capabilities

### 🔄 Data Refresh Strategy
- **Regular data rotation** to maintain demo freshness
- **Anonymized customer data** for privacy protection
- **Fresh timestamps** within reasonable business hours
- **Realistic business scenarios** for meaningful exploration

### ⚠️ Data Protection
- **No real customer information** in demo data
- **Anonymized delivery addresses** with realistic formatting
- **Sample business names** representing typical Georgian establishments
- **Controlled financial data** showing business metrics without sensitive information

## Session Management

### Session Validation
```sql
-- Function to validate demo session limits
CREATE OR REPLACE FUNCTION validate_demo_session()
RETURNS BOOLEAN AS $$
DECLARE
    active_sessions INTEGER;
    max_demo_sessions INTEGER := 10;
BEGIN
    -- Count active demo sessions for this user
    SELECT COUNT(*) INTO active_sessions
    FROM demo_sessions ds
    JOIN profiles p ON p.id = ds.session_id
    WHERE p.id = auth.uid() 
    AND ds.ended_at IS NULL;
    
    -- Allow if under limit
    RETURN active_sessions < max_demo_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Session Lifecycle
1. **Demo session creation** when user logs in
2. **Session tracking** with start and end timestamps
3. **Automatic cleanup** of expired sessions
4. **Usage monitoring** for abuse prevention
5. **Graceful session termination** with proper cleanup

## Security Safeguards

### 🚫 Access Prevention
- **No write operations** except session management
- **No sensitive data access** including financial information
- **No user data modification** or profile updates
- **No administrative functions** or system configuration
- **No integration access** with external services

### 📊 Monitoring & Logging
- **Session usage tracking** in `demo_sessions` table
- **Access pattern monitoring** for anomaly detection
- **Automated session cleanup** for expired sessions
- **Usage analytics** for demo effectiveness measurement

### 🔍 Abuse Prevention
- **Concurrent session limits** (maximum 10 per user)
- **Time-based restrictions** (1-hour maximum per session)
- **IP-based rate limiting** for excessive access
- **Session validation** before each data access

## Demo Scenarios

### 🏪 Restaurant Demo
- **View product catalog** with Georgian food items
- **Browse order history** showing typical business patterns
- **Explore inventory management** features
- **Experience order workflow** from restaurant perspective
- **Review analytics dashboard** with business insights

### 🚚 Driver Demo
- **View assigned deliveries** in realistic scenarios
- **Experience delivery workflow** updates
- **Explore route planning** and optimization features
- **Track delivery performance** metrics
- **Understand customer communication** patterns

### 👨‍💼 Admin Demo
- **System oversight capabilities** demonstration
- **User management interface** exploration
- **Business analytics** and reporting features
- **System health monitoring** tools
- **Policy violation tracking** and audit logs

## Common Demo Operations

### System Exploration
```sql
-- Demo users can view public products
SELECT name, name_ka, category, price, active
FROM products 
WHERE active = true
LIMIT 20;

-- Check demo session status
SELECT ds.started_at, ds.ended_at,
       CASE WHEN ds.ended_at IS NULL THEN 'Active' ELSE 'Expired' END as status
FROM demo_sessions ds
WHERE ds.session_id = auth.uid()::text
ORDER BY ds.started_at DESC;
```

### Feature Discovery
```sql
-- Explore order workflow examples
SELECT status, COUNT(*) as order_count
FROM orders 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY status
ORDER BY order_count DESC;

-- View demo analytics
SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as daily_revenue
FROM orders 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;
```

## Troubleshooting

### Common Issues

**Session expired message:**
- Check if 1-hour time limit reached
- Verify demo session is still active
- Consider starting fresh demo session

**Limited data visibility:**
- Confirm demo role assignment
- Check session validation status
- Verify demo session has not exceeded limits

**Cannot see recent orders:**
- Demo orders refresh every 30 minutes
- Only orders from last hour visible
- Data anonymization may affect visibility

### Session Management
```sql
-- Check current demo session
SELECT 
    ds.session_id,
    ds.started_at,
    ds.ended_at,
    NOW() - ds.started_at as session_duration
FROM demo_sessions ds
WHERE ds.session_id = auth.uid()::text
AND ds.ended_at IS NULL;

-- Clean up expired sessions
UPDATE demo_sessions 
SET ended_at = NOW()
WHERE ended_at IS NULL 
AND started_at < NOW() - INTERVAL '1 hour';
```

## Best Practices

### ✅ Effective Demo Usage
- **Explore systematically** through different system sections
- **Test realistic scenarios** matching actual business use cases
- **Document interesting findings** for stakeholder discussions
- **Respect session limits** and plan exploration time

### ✅ Responsible Testing
- **Don't attempt to bypass** security restrictions
- **Don't share demo credentials** with others
- **Don't attempt to access** non-demo features
- **Don't overload system** with excessive requests

### ❌ What Not to Do
- **Don't try to modify** demo data or system state
- **Don't attempt to access** real customer information
- **Don't exceed session limits** through multiple logins
- **Don't attempt to exploit** demo functionality for unauthorized access

---

**Related Documentation:**
- [Testing Scenarios](../testing/test-scenarios.md)
- [Policy Functions](../testing/validation-scripts.md)
- [Session Management Guide](../business-logic/session-policies.md)

**Policy Functions:** `is_demo()`, `validate_demo_session()`