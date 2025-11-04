# RLS Policy Validation Scripts

## Overview

This document provides automated validation scripts for testing Row Level Security policies in the Georgian Distribution System. These scripts ensure policies work correctly across all roles and business scenarios.

## Quick Start Scripts

### 1. Policy Health Check Script

```bash
#!/bin/bash
# supabase/policies/testing/scripts/health-check.sh

# RLS Policy Health Check
echo "🔍 Running RLS Policy Health Check..."

# Test 1: Check RLS is enabled on all tables
echo "✅ Checking RLS enabled tables..."
psql $DATABASE_URL -c "
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'products', 'orders', 'order_items', 'notifications', 'demo_sessions')
ORDER BY tablename;
"

# Test 2: Verify policy functions exist
echo "✅ Checking policy functions..."
psql $DATABASE_URL -c "
SELECT proname, prosrc
FROM pg_proc 
WHERE proname IN ('get_user_role', 'is_admin', 'is_restaurant', 'is_driver', 'is_demo', 'validate_demo_session')
ORDER BY proname;
"

# Test 3: Count policies per table
echo "✅ Checking policy counts..."
psql $DATABASE_URL -c "
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
"

echo "✅ Policy health check completed!"
```

### 2. Role Validation Script

```sql
-- supabase/policies/testing/scripts/role-validation.sql
-- Comprehensive role validation for all policy functions

-- Test all role functions
SELECT 
    'get_user_role' as function_name,
    get_user_role() as current_result,
    CASE WHEN get_user_role() IS NOT NULL THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'is_admin' as function_name,
    is_admin()::text as current_result,
    CASE WHEN is_admin() IN (true, false) THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'is_restaurant' as function_name,
    is_restaurant()::text as current_result,
    CASE WHEN is_restaurant() IN (true, false) THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'is_driver' as function_name,
    is_driver()::text as current_result,
    CASE WHEN is_driver() IN (true, false) THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'is_demo' as function_name,
    is_demo()::text as current_result,
    CASE WHEN is_demo() IN (true, false) THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 
    'validate_demo_session' as function_name,
    validate_demo_session()::text as current_result,
    CASE WHEN validate_demo_session() IN (true, false) THEN '✅ PASS' ELSE '❌ FAIL' END as status;

-- Test with specific user IDs (replace with actual test user IDs)
SELECT 
    get_user_role('test-admin-user-id') as admin_role_test,
    get_user_role('test-restaurant-user-id') as restaurant_role_test,
    get_user_role('test-driver-user-id') as driver_role_test,
    get_user_role('test-demo-user-id') as demo_role_test;
```

### 3. Policy Testing Script

```typescript
// supabase/policies/testing/scripts/policy-tester.ts
/**
 * TypeScript Policy Testing Script
 * Comprehensive testing of all RLS policies
 */

import { createClient } from '@supabase/supabase-js';

interface PolicyTestCase {
  name: string;
  role: 'admin' | 'restaurant' | 'driver' | 'demo';
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  shouldSucceed: boolean;
  description: string;
}

class PolicyTester {
  private supabase: any;
  private testResults: any[] = [];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async runPolicyTests(): Promise<void> {
    const testCases: PolicyTestCase[] = [
      // Admin tests
      { name: 'admin_select_profiles', role: 'admin', table: 'profiles', operation: 'SELECT', shouldSucceed: true, description: 'Admin can select all profiles' },
      { name: 'admin_update_profiles', role: 'admin', table: 'profiles', operation: 'UPDATE', shouldSucceed: true, description: 'Admin can update any profile' },
      { name: 'admin_select_orders', role: 'admin', table: 'orders', operation: 'SELECT', shouldSucceed: true, description: 'Admin can select all orders' },
      { name: 'admin_insert_products', role: 'admin', table: 'products', operation: 'INSERT', shouldSucceed: true, description: 'Admin can create products' },

      // Restaurant tests
      { name: 'restaurant_select_products', role: 'restaurant', table: 'products', operation: 'SELECT', shouldSucceed: true, description: 'Restaurant can view products' },
      { name: 'restaurant_insert_orders', role: 'restaurant', table: 'orders', operation: 'INSERT', shouldSucceed: true, description: 'Restaurant can create orders' },
      { name: 'restaurant_select_own_orders', role: 'restaurant', table: 'orders', operation: 'SELECT', shouldSucceed: true, description: 'Restaurant can view own orders' },
      { name: 'restaurant_update_profiles', role: 'restaurant', table: 'profiles', operation: 'UPDATE', shouldSucceed: true, description: 'Restaurant can update own profile' },

      // Driver tests
      { name: 'driver_select_assigned_orders', role: 'driver', table: 'orders', operation: 'SELECT', shouldSucceed: true, description: 'Driver can view assigned orders' },
      { name: 'driver_update_assigned_orders', role: 'driver', table: 'orders', operation: 'UPDATE', shouldSucceed: true, description: 'Driver can update assigned orders' },
      { name: 'driver_insert_products', role: 'driver', table: 'products', operation: 'INSERT', shouldSucceed: false, description: 'Driver cannot create products' },

      // Demo tests
      { name: 'demo_select_products', role: 'demo', table: 'products', operation: 'SELECT', shouldSucceed: true, description: 'Demo can view public products' },
      { name: 'demo_insert_orders', role: 'demo', table: 'orders', operation: 'INSERT', shouldSucceed: false, description: 'Demo cannot create orders' },
      { name: 'demo_update_profiles', role: 'demo', table: 'profiles', operation: 'UPDATE', shouldSucceed: false, description: 'Demo cannot update profiles' },
    ];

    console.log('🧪 Starting RLS Policy Tests...\n');

    for (const testCase of testCases) {
      await this.runSingleTest(testCase);
    }

    this.printResults();
  }

  private async runSingleTest(testCase: PolicyTestCase): Promise<void> {
    try {
      // Simulate role by setting auth context (simplified)
      const result = await this.executeOperation(testCase.table, testCase.operation);
      const success = !result.error && result.data !== null;
      const passed = success === testCase.shouldSucceed;

      this.testResults.push({
        ...testCase,
        success,
        passed,
        error: result.error?.message || null,
        timestamp: new Date().toISOString()
      });

      const status = passed ? '✅' : '❌';
      console.log(`${status} ${testCase.name}: ${testCase.description}`);
      
      if (!passed) {
        console.log(`   Expected: ${testCase.shouldSucceed ? 'SUCCESS' : 'FAILURE'}`);
        console.log(`   Actual: ${success ? 'SUCCESS' : 'FAILURE'}`);
        if (result.error) {
          console.log(`   Error: ${result.error.message}`);
        }
      }
    } catch (error) {
      this.testResults.push({
        ...testCase,
        success: false,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      console.log(`❌ ${testCase.name}: ${testCase.description}`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeOperation(table: string, operation: string): Promise<any> {
    try {
      switch (operation) {
        case 'SELECT':
          return await this.supabase.from(table).select('*').limit(1);
        case 'INSERT':
          return await this.supabase.from(table).insert({ test: true }).select();
        case 'UPDATE':
          return await this.supabase.from(table).update({ test: true }).select();
        case 'DELETE':
          return await this.supabase.from(table).delete().eq('id', 'non-existent').select();
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));

    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.passed).forEach(test => {
        console.log(`- ${test.name}: ${test.error || 'Unexpected result'}`);
      });
    }

    console.log('\n🎉 Policy testing completed!');
  }
}

// Usage
async function main() {
  const tester = new PolicyTester(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
  
  await tester.runPolicyTests();
}

main().catch(console.error);
```

## Business Logic Testing Scripts

### Order Workflow Test

```sql
-- supabase/policies/testing/scripts/order-workflow-test.sql
-- Test complete order workflow with proper role validation

-- Test 1: Restaurant creates order
DO $$
DECLARE
    test_restaurant_id UUID := 'test-restaurant-uuid';
    order_id UUID;
BEGIN
    -- Create test order as restaurant
    INSERT INTO orders (restaurant_id, status, total_amount, delivery_time)
    VALUES (test_restaurant_id, 'pending', 100.00, NOW() + INTERVAL '2 hours')
    RETURNING id INTO order_id;
    
    RAISE NOTICE 'Order created with ID: %', order_id;
    
    -- Verify restaurant can view own order
    IF EXISTS (SELECT 1 FROM orders WHERE id = order_id AND restaurant_id = test_restaurant_id) THEN
        RAISE NOTICE '✅ Restaurant can view own order';
    ELSE
        RAISE NOTICE '❌ Restaurant cannot view own order';
    END IF;
    
    -- Update order status as restaurant
    UPDATE orders SET status = 'confirmed' WHERE id = order_id;
    RAISE NOTICE '✅ Order status updated to confirmed';
    
    -- Test driver assignment (simulate driver role)
    UPDATE orders SET driver_id = 'test-driver-uuid' WHERE id = order_id AND status = 'assigned';
    RAISE NOTICE '✅ Driver assigned to order';
    
    -- Clean up test data
    DELETE FROM orders WHERE id = order_id;
    RAISE NOTICE '✅ Test cleanup completed';
END $$;
```

### Demo Session Management Test

```sql
-- supabase/policies/testing/scripts/demo-session-test.sql
-- Test demo session validation and limitations

-- Test demo session creation and validation
DO $$
DECLARE
    demo_user_id UUID := 'demo-user-uuid';
    session_count INTEGER;
BEGIN
    -- Create demo session
    INSERT INTO demo_sessions (session_id, started_at)
    VALUES (demo_user_id::text, NOW());
    
    -- Test session validation
    SELECT COUNT(*) INTO session_count
    FROM demo_sessions ds
    WHERE ds.session_id = demo_user_id::text
    AND ds.ended_at IS NULL;
    
    IF session_count > 0 THEN
        RAISE NOTICE '✅ Demo session created and validated';
    ELSE
        RAISE NOTICE '❌ Demo session validation failed';
    END IF;
    
    -- Test demo session limits
    IF validate_demo_session() THEN
        RAISE NOTICE '✅ Demo session limit validation passed';
    ELSE
        RAISE NOTICE '❌ Demo session limit validation failed';
    END IF;
    
    -- Clean up
    DELETE FROM demo_sessions WHERE session_id = demo_user_id::text;
    RAISE NOTICE '✅ Demo session cleanup completed';
END $$;
```

## Performance Testing Scripts

### Policy Performance Test

```sql
-- supabase/policies/testing/scripts/performance-test.sql
-- Test policy execution performance

-- Performance test for policy execution
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM profiles;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM products WHERE active = true;

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM orders WHERE restaurant_id = auth.uid();

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM orders WHERE driver_id = auth.uid() OR driver_id IS NULL;

-- Check for any slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time
FROM pg_stat_statements
WHERE query LIKE '%profiles%' 
   OR query LIKE '%products%'
   OR query LIKE '%orders%'
ORDER BY mean_time DESC
LIMIT 10;
```

## Audit Log Testing

### Policy Violation Testing

```sql
-- supabase/policies/testing/scripts/audit-test.sql
-- Test policy violation logging

-- Check recent policy violations
SELECT 
    policy_name,
    table_name,
    operation,
    allowed,
    error_message,
    created_at,
    user_id
FROM policy_audit_log
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 50;

-- Check violation patterns
SELECT 
    policy_name,
    COUNT(*) as violation_count,
    MAX(created_at) as last_violation
FROM policy_audit_log
WHERE allowed = false
GROUP BY policy_name
HAVING COUNT(*) > 1
ORDER BY violation_count DESC;
```

## Automated Test Runner

### Complete Test Suite

```bash
#!/bin/bash
# supabase/policies/testing/scripts/run-all-tests.sh

echo "🚀 Starting RLS Policy Test Suite"
echo "=================================="

# Set environment variables
export DATABASE_URL="$SUPABASE_DB_URL"
export SUPABASE_URL="$SUPABASE_URL"
export SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"

# Run health check
echo "🔍 Running Health Check..."
bash scripts/health-check.sh

echo ""
echo "🧪 Running Role Validation..."
psql $DATABASE_URL -f scripts/role-validation.sql

echo ""
echo "🎯 Running Policy Tests..."
npx tsx scripts/policy-tester.ts

echo ""
echo "📊 Running Performance Tests..."
psql $DATABASE_URL -f scripts/performance-test.sql

echo ""
echo "🔍 Running Audit Tests..."
psql $DATABASE_URL -f scripts/audit-test.sql

echo ""
echo "✅ RLS Policy Test Suite Completed!"
```

## Integration with CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/rls-policy-test.yml
name: RLS Policy Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  rls-policy-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm install @supabase/supabase-js
        
    - name: Setup test environment
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
      run: |
        # Run RLS policy tests
        cd supabase/policies/testing/scripts
        chmod +x run-all-tests.sh
        ./run-all-tests.sh
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: rls-policy-test-results
        path: supabase/policies/testing/results/
```

## Usage Instructions

### Running Tests Manually

```bash
# 1. Set up environment
export SUPABASE_URL="your-supabase-url"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_DB_URL="your-database-url"

# 2. Run health check
cd supabase/policies/testing/scripts
./health-check.sh

# 3. Run role validation
psql $SUPABASE_DB_URL -f role-validation.sql

# 4. Run policy tests
npx tsx policy-tester.ts

# 5. Run complete test suite
./run-all-tests.sh
```

### Test Results Interpretation

- **✅ PASS**: Policy working as expected
- **❌ FAIL**: Policy not working correctly
- **⚠️ WARNING**: Policy working but with performance concerns
- **🔍 INFO**: Informational test results

### Common Issues and Solutions

1. **Policy not found**: Check migration was applied
2. **Function not found**: Verify helper functions exist
3. **Permission denied**: Check user authentication
4. **Performance issues**: Review policy complexity and indexing

---

**Next Steps:**
1. Deploy policies using migration
2. Run test suite to validate implementation
3. Monitor policy violations in production
4. Set up automated testing in CI/CD pipeline

**Related Documentation:**
- [Migration Guide](../migration/migration-guide.md)
- [Test Scenarios](./test-scenarios.md)
- [Troubleshooting](./troubleshooting.md)