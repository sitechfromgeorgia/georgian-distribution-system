# RLS Policy Testing Guide

## Overview

This guide provides comprehensive testing procedures for Row Level Security (RLS) policies in the Georgian Distribution System. It includes automated test scripts, manual validation procedures, and troubleshooting guidelines.

## Testing Structure

```
supabase/policies/testing/
├── test-scenarios.md              # Comprehensive test scenarios
├── validation-scripts.md          # Automated validation scripts
├── troubleshooting.md             # Common issues and solutions
└── scripts/                       # Testing automation scripts
    ├── validate-policies.ts       # Main policy validation script
    ├── test-role-access.ts        # Role-based access testing
    ├── audit-violations.ts        # Policy violation auditing
    └── run-integration-tests.ts   # End-to-end testing
```

## Test Scenarios Overview

### Role-Based Access Testing

#### Admin Role Tests
```sql
-- Test 1: Admin can view all profiles
SELECT * FROM profiles; -- Should return all profiles

-- Test 2: Admin can update any profile
UPDATE profiles 
SET full_name = 'Updated Name' 
WHERE id = (SELECT id FROM profiles LIMIT 1); -- Should succeed

-- Test 3: Admin can create products
INSERT INTO products (name, name_ka, category, unit, price, cost_price)
VALUES ('Test Product', 'ტესტ პროდუქტი', 'test', 'piece', 10.00, 5.00); -- Should succeed

-- Test 4: Admin can view audit logs
SELECT * FROM policy_audit_log; -- Should return all audit entries
```

#### Restaurant Role Tests
```sql
-- Test 1: Restaurant can view own orders
SELECT * FROM orders WHERE restaurant_id = auth.uid(); -- Should return own orders

-- Test 2: Restaurant can view public products
SELECT * FROM products WHERE active = true; -- Should return active products

-- Test 3: Restaurant can create own orders
INSERT INTO orders (restaurant_id, status, total_amount)
VALUES (auth.uid(), 'pending', 100.00); -- Should succeed

-- Test 4: Restaurant cannot view other restaurant orders
SELECT * FROM orders 
WHERE restaurant_id != auth.uid(); -- Should return empty
```

#### Driver Role Tests
```sql
-- Test 1: Driver can view assigned orders
SELECT * FROM orders WHERE driver_id = auth.uid(); -- Should return assigned orders

-- Test 2: Driver can view pending orders (to accept)
SELECT * FROM orders 
WHERE driver_id IS NULL 
AND status IN ('pending', 'confirmed'); -- Should return unassigned orders

-- Test 3: Driver can update order status
UPDATE orders 
SET status = 'out_for_delivery' 
WHERE driver_id = auth.uid() 
AND status = 'assigned'; -- Should succeed

-- Test 4: Driver cannot create orders
INSERT INTO orders (restaurant_id, status, total_amount)
VALUES (auth.uid(), 'pending', 100.00); -- Should fail
```

#### Demo Role Tests
```sql
-- Test 1: Demo can view public products (time-limited)
SELECT * FROM products 
WHERE active = true 
AND created_at >= NOW() - INTERVAL '1 hour'; -- Should return recent products

-- Test 2: Demo cannot create orders
INSERT INTO orders (restaurant_id, status, total_amount)
VALUES (auth.uid(), 'pending', 100.00); -- Should fail

-- Test 3: Demo cannot update profiles
UPDATE profiles 
SET full_name = 'Updated Name' 
WHERE id = auth.uid(); -- Should fail

-- Test 4: Demo can manage own notifications
INSERT INTO notifications (user_id, title, message)
VALUES (auth.uid(), 'Test', 'Demo notification'); -- Should succeed
```

## Policy Validation Scripts

### Automated Policy Testing

```typescript
// supabase/policies/testing/scripts/validate-policies.ts
/**
 * Comprehensive RLS Policy Validation Script
 * Tests all policies across all roles and operations
 */

interface TestResult {
  policy_name: string;
  role: string;
  table: string;
  operation: string;
  expected_result: boolean;
  actual_result: boolean;
  passed: boolean;
  error_message?: string;
}

class PolicyValidator {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async validatePolicy(
    policyName: string,
    role: string,
    table: string,
    operation: string,
    shouldSucceed: boolean
  ): Promise<TestResult> {
    try {
      let query;
      
      switch (operation) {
        case 'SELECT':
          query = this.supabase.from(table).select('*').limit(1);
          break;
        case 'INSERT':
          query = this.supabase.from(table).insert({ test: true }).select();
          break;
        case 'UPDATE':
          query = this.supabase.from(table).update({ test: true }).select();
          break;
        case 'DELETE':
          query = this.supabase.from(table).delete().eq('id', 'non-existent').select();
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const { data, error } = await query;
      const succeeded = !error;

      return {
        policy_name: policyName,
        role,
        table,
        operation,
        expected_result: shouldSucceed,
        actual_result: succeeded,
        passed: succeeded === shouldSucceed,
        error_message: error?.message
      };
    } catch (err) {
      return {
        policy_name: policyName,
        role,
        table,
        operation,
        expected_result: shouldSucceed,
        actual_result: false,
        passed: false,
        error_message: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  async runAllTests(): Promise<{
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  }> {
    const testCases = [
      // Admin tests
      { policy: 'profiles_select_admin_all', role: 'admin', table: 'profiles', op: 'SELECT', shouldSucceed: true },
      { policy: 'profiles_update_admin_all', role: 'admin', table: 'profiles', op: 'UPDATE', shouldSucceed: true },
      { policy: 'products_select_admin_all', role: 'admin', table: 'products', op: 'SELECT', shouldSucceed: true },
      
      // Restaurant tests
      { policy: 'products_select_own_restaurant', role: 'restaurant', table: 'products', op: 'SELECT', shouldSucceed: true },
      { policy: 'orders_insert_restaurant_own', role: 'restaurant', table: 'orders', op: 'INSERT', shouldSucceed: true },
      { policy: 'orders_select_own_restaurant', role: 'restaurant', table: 'orders', op: 'SELECT', shouldSucceed: true },
      
      // Driver tests
      { policy: 'orders_select_assigned_driver', role: 'driver', table: 'orders', op: 'SELECT', shouldSucceed: true },
      { policy: 'orders_update_driver_assigned', role: 'driver', table: 'orders', op: 'UPDATE', shouldSucceed: true },
      
      // Demo tests
      { policy: 'products_select_demo_limited', role: 'demo', table: 'products', op: 'SELECT', shouldSucceed: true },
      { policy: 'orders_insert_demo_restricted', role: 'demo', table: 'orders', op: 'INSERT', shouldSucceed: false },
    ];

    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      // Simulate different user roles for testing
      await this.switchUserRole(testCase.role);
      
      const result = await this.validatePolicy(
        testCase.policy,
        testCase.role,
        testCase.table,
        testCase.op,
        testCase.shouldSucceed
      );
      
      results.push(result);
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return {
      total: results.length,
      passed,
      failed,
      results
    };
  }

  private async switchUserRole(role: string): Promise<void> {
    // Implementation for switching user context for testing
    // This would involve creating test users with different roles
  }
}

// Usage example
async function runPolicyValidation() {
  const supabase = createClient(/* ... */);
  const validator = new PolicyValidator(supabase);
  
  const results = await validator.runAllTests();
  
  console.log(`Policy Validation Results:`);
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.results.filter(r => !r.passed).forEach(test => {
      console.log(`- ${test.policy}: ${test.error_message}`);
    });
  }
}
```

## Integration Testing

### End-to-End Workflow Testing

```typescript
// supabase/policies/testing/scripts/run-integration-tests.ts
/**
 * Integration testing for complete business workflows
 * Tests RLS policies in realistic business scenarios
 */

interface BusinessScenario {
  name: string;
  description: string;
  steps: TestStep[];
}

interface TestStep {
  role: string;
  action: string;
  table: string;
  operation: string;
  expected_result: 'success' | 'failure';
  validation_query?: string;
}

const BUSINESS_SCENARIOS: BusinessScenario[] = [
  {
    name: 'Complete Order Workflow',
    description: 'Test order creation through completion with all roles',
    steps: [
      { role: 'restaurant', action: 'Create order', table: 'orders', operation: 'INSERT', expected_result: 'success' },
      { role: 'restaurant', action: 'Update order status', table: 'orders', operation: 'UPDATE', expected_result: 'success' },
      { role: 'driver', action: 'Accept order', table: 'orders', operation: 'UPDATE', expected_result: 'success' },
      { role: 'driver', action: 'Update delivery status', table: 'orders', operation: 'UPDATE', expected_result: 'success' },
      { role: 'restaurant', action: 'Complete order', table: 'orders', operation: 'UPDATE', expected_result: 'success' },
    ]
  },
  {
    name: 'Inventory Management',
    description: 'Test product management workflow',
    steps: [
      { role: 'restaurant', action: 'Create product', table: 'products', operation: 'INSERT', expected_result: 'success' },
      { role: 'restaurant', action: 'Update product', table: 'products', operation: 'UPDATE', expected_result: 'success' },
      { role: 'demo', action: 'View product', table: 'products', operation: 'SELECT', expected_result: 'success' },
      { role: 'driver', action: 'Create product', table: 'products', operation: 'INSERT', expected_result: 'failure' },
    ]
  }
];

class IntegrationTester {
  async runScenario(scenario: BusinessScenario): Promise<{
    scenario: string;
    passed: number;
    failed: number;
    details: any[];
  }> {
    const details = [];
    let passed = 0;
    let failed = 0;

    for (const step of scenario.steps) {
      try {
        const result = await this.executeStep(step);
        const stepPassed = result.success === step.expected_result;
        
        if (stepPassed) {
          passed++;
        } else {
          failed++;
        }

        details.push({
          ...step,
          success: result.success,
          expected: step.expected_result,
          passed: stepPassed,
          error: result.error
        });
      } catch (err) {
        failed++;
        details.push({
          ...step,
          success: 'error',
          expected: step.expected_result,
          passed: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return {
      scenario: scenario.name,
      passed,
      failed,
      details
    };
  }

  private async executeStep(step: TestStep) {
    // Implementation for executing individual test steps
    // This would simulate the actual database operations
    return { success: 'success', error: null };
  }
}
```

## Policy Violation Monitoring

### Automated Audit Log Analysis

```sql
-- Policy violation analysis query
SELECT 
    pal.policy_name,
    pal.table_name,
    pal.operation,
    COUNT(*) as violation_count,
    MAX(pal.created_at) as last_violation,
    p.role as violating_user_role,
    p.full_name as violating_user
FROM policy_audit_log pal
LEFT JOIN profiles p ON p.id = pal.user_id
WHERE pal.allowed = false
GROUP BY pal.policy_name, pal.table_name, pal.operation, p.role, p.full_name
ORDER BY violation_count DESC, last_violation DESC;

-- High-frequency violation detection
SELECT 
    policy_name,
    user_id,
    COUNT(*) as violations_in_last_hour
FROM policy_audit_log
WHERE allowed = false 
AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY policy_name, user_id
HAVING COUNT(*) > 5;

-- Policy effectiveness analysis
SELECT 
    table_name,
    operation,
    SUM(CASE WHEN allowed THEN 1 ELSE 0 END) as allowed_attempts,
    SUM(CASE WHEN NOT allowed THEN 1 ELSE 0 END) as blocked_attempts,
    CASE 
        WHEN SUM(allowed_attempts + blocked_attempts) > 0 
        THEN ROUND(SUM(allowed_attempts::decimal) / SUM(allowed_attempts + blocked_attempts) * 100, 2)
        ELSE 0
    END as success_rate_percent
FROM policy_audit_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY table_name, operation
ORDER BY success_rate_percent ASC;
```

## Performance Testing

### Policy Performance Monitoring

```sql
-- Query performance analysis
SELECT 
    schemaname,
    tablename,
    query,
    calls,
    total_time,
    mean_time,
    stddev_time
FROM pg_stat_statements 
WHERE query LIKE '%RLS%' 
OR query LIKE '%policy%'
ORDER BY total_time DESC;

-- Index utilization for RLS policies
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('profiles', 'products', 'orders', 'order_items')
ORDER BY tablename, attname;

-- Policy execution time monitoring
SELECT 
    policy_name,
    AVG(execution_time_ms) as avg_execution_time,
    MAX(execution_time_ms) as max_execution_time,
    COUNT(*) as execution_count
FROM policy_execution_metrics
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY policy_name
ORDER BY avg_execution_time DESC;
```

## Troubleshooting Common Issues

### Issue 1: Policy Not Working
```sql
-- Check if policy exists and is enabled
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'your_table_name';

-- Check RLS is enabled on table
SELECT 
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'your_table_name';

-- Test policy manually
SET ROLE authenticated;
SET request.jwt.claim.sub = 'your-user-id';
SELECT * FROM your_table_name;
RESET ROLE;
```

### Issue 2: Performance Issues
```sql
-- Identify slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking more than 100ms
ORDER BY mean_time DESC;

-- Check for missing indexes
SELECT 
    t.relname AS table_name,
    a.attname AS column_name,
    i.relname AS index_name
FROM pg_class t
JOIN pg_attribute a ON a.attrelid = t.oid
JOIN pg_index ix ON ix.indrelid = t.oid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE t.relkind = 'r'
AND a.attnum = ANY(ix.indkey)
AND NOT ix.indisprimary
AND NOT ix.indisunique;
```

### Issue 3: Role Validation Failures
```sql
-- Test role functions directly
SELECT 
    is_admin(),
    is_restaurant(),
    is_driver(),
    is_demo();

-- Check user profile
SELECT id, role, full_name, is_active
FROM profiles 
WHERE id = auth.uid();

-- Test role switching
SELECT get_user_role('target-user-id');
```

## Testing Checklist

### Pre-Deployment Testing
- [ ] All role-based policies tested for each role
- [ ] Business workflow integration tests pass
- [ ] Policy performance benchmarks met
- [ ] No high-frequency policy violations
- [ ] All helper functions working correctly
- [ ] Audit logging functioning properly

### Security Testing
- [ ] Demo role cannot access sensitive data
- [ ] Cross-tenant data isolation verified
- [ ] Admin bypass works correctly
- [ ] Session validation functioning
- [ ] Rate limiting operational

### Performance Testing
- [ ] Policy execution under 50ms average
- [ ] No missing indexes affecting RLS
- [ ] Query plans optimized for RLS
- [ ] Memory usage within acceptable limits

### Monitoring Setup
- [ ] Audit log collection active
- [ ] Policy violation alerts configured
- [ ] Performance metrics tracking enabled
- [ ] Dashboard for policy health monitoring

---

**Next Steps:**
1. Deploy RLS policies migration
2. Run automated policy validation
3. Execute integration test scenarios
4. Monitor policy performance and violations
5. Set up ongoing policy health monitoring

**Related Documentation:**
- [Migration Guide](../migration/migration-guide.md)
- [Business Logic Policies](../business-logic/)
- [Role-Based Documentation](../roles/)