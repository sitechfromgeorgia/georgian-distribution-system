# Georgian Distribution System - Comprehensive Testing Suite

## Overview

This directory contains a comprehensive testing infrastructure for the Georgian Distribution System, providing enterprise-grade testing capabilities for API endpoints, authentication, real-time features, role-based access control, and business logic validation.

## Architecture

```
src/lib/testing/
├── README.md                           # This file
├── comprehensive-test-orchestrator.ts  # Main test coordinator
├── role-based-tests.ts                 # Role-specific test implementations
├── business-logic-validator.ts         # Business logic validation
├── run-comprehensive-tests.ts          # CLI script for running tests
├── api-tester.ts                       # API endpoint testing
├── auth-tester.ts                      # Authentication testing
├── realtime-tester.ts                  # Real-time functionality testing
├── query-optimizer.ts                  # Database query optimization
├── tests/comprehensive/                # Comprehensive test suite
│   ├── README.md                       # Detailed documentation
│   ├── config.ts                       # Test configuration
│   ├── reports/                        # Test result storage
│   │   ├── latest.json
│   │   ├── history/
│   │   └── templates/
│   │       └── html-report-template.html
│   └── [additional test files]
└── [other test utilities]
```

## Test Categories

### 1. API Testing (`api-tester.ts`)
- RESTful endpoint validation
- CRUD operations testing
- Error handling verification
- Response format validation
- Rate limiting tests

### 2. Authentication Testing (`auth-tester.ts`)
- User registration flows
- Login/logout functionality
- Session management
- Password reset flows
- Multi-factor authentication (if enabled)
- Account lockout protection

### 3. Real-time Testing (`realtime-tester.ts`)
- WebSocket connection testing
- Database change subscriptions
- Order status notifications
- Broadcast messaging
- Connection resilience
- Performance under load

### 4. Role-Based Access Control (`role-based-tests.ts`)
- Permission validation per role (Admin, Restaurant, Driver, Demo)
- Resource access testing
- Security boundary verification
- Data isolation testing
- Cross-tenant protection

### 5. Business Logic Validation (`business-logic-validator.ts`)
- Order lifecycle validation
- Pricing compliance checks
- User role enforcement
- Data integrity verification
- Workflow validation

### 6. Comprehensive Test Orchestrator (`comprehensive-test-orchestrator.ts`)
- Smoke tests (quick validation)
- Critical path tests (essential workflows)
- Regression tests (full test suite)
- Full comprehensive tests (complete validation)
- Parallel and sequential execution modes

## Usage

### Running Tests via CLI

```bash
# Quick smoke tests (recommended for development)
npm run test:smoke

# Critical business workflows
npm run test:critical

# Full regression suite
npm run test:regression

# Complete system validation
npm run test:full

# Individual test categories
npm run test:api          # API endpoints only
npm run test:auth         # Authentication only
npm run test:realtime     # Real-time features only
npm run test:roles        # Role-based access control
npm run test:business     # Business logic validation

# Specific role testing
npm run test:admin        # Admin role permissions
npm run test:restaurant   # Restaurant role permissions
npm run test:driver       # Driver role permissions
npm run test:demo         # Demo account permissions

# Business logic validation
npm run test:lifecycle    # Order lifecycle validation
npm run test:pricing      # Pricing compliance
npm run test:integrity    # Data integrity checks
```

### Environment Variables

```bash
# Test Configuration
TEST_ENVIRONMENT=development|production|staging
TEST_OUTPUT_FORMAT=console|json|html|all
TEST_SAVE_RESULTS=true|false
TEST_TIMEOUT=30000

# Test Credentials (for role testing)
TEST_ADMIN_EMAIL=admin@test.ge
TEST_ADMIN_PASSWORD=admin123
TEST_RESTAURANT_EMAIL=restaurant@test.ge
TEST_RESTAURANT_PASSWORD=restaurant123
TEST_DRIVER_EMAIL=driver@test.ge
TEST_DRIVER_PASSWORD=driver123
TEST_DEMO_EMAIL=demo@test.ge
TEST_DEMO_PASSWORD=demo123
```

### Programmatic Usage

```typescript
import { runComprehensiveTests, runSmokeTests } from './comprehensive-test-orchestrator';

// Run smoke tests
const smokeResults = await runSmokeTests();

// Run full comprehensive tests
const fullResults = await runComprehensiveTests({
  environment: 'production',
  outputFormat: 'html',
  saveResults: true
});

// Run specific role tests
import { testAdminRole, testRestaurantRole } from './role-based-tests';
const adminResults = await testAdminRole();
const restaurantResults = await testRestaurantRole();
```

## Test Results

### Console Output
Tests provide real-time console output with:
- ✅ Green checkmarks for passed tests
- ❌ Red X marks for failed tests
- ⚠️ Yellow warning signs for skipped tests
- 📊 Summary statistics and recommendations

### JSON Reports
Structured JSON output includes:
- Detailed test results
- Performance metrics
- Error details
- Recommendations
- Historical tracking

### HTML Reports
Visual HTML reports with:
- Color-coded results
- Charts and graphs
- Detailed breakdowns
- Executive summaries
- Recommendations

## Test Data Management

### Safe Testing Practices
- Tests use read-only operations where possible
- Test data is isolated from production
- Cleanup procedures remove test artifacts
- No permanent changes to production data

### Test Data Sources
- Mock data for unit tests
- Development environment data
- Isolated test databases (when available)
- Simulated user interactions

## Performance Benchmarks

### Expected Test Durations
- Smoke Tests: 2-5 minutes
- Critical Tests: 5-10 minutes
- Regression Tests: 15-25 minutes
- Full Tests: 30-50 minutes

### Performance Metrics
- API Response Times: <500ms average
- Real-time Latency: <100ms
- Test Execution: <5% system impact
- Memory Usage: <200MB additional

## Security Considerations

- Test credentials are environment-specific
- No sensitive data in test outputs
- Isolated test environments
- Secure credential management
- Audit logging for test activities

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Comprehensive Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:smoke
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed
- `2`: Test execution error
- `3`: Configuration error

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit with your Supabase credentials
   ```

3. **Run smoke tests:**
   ```bash
   npm run test:smoke
   ```

4. **View results:**
   - Console output for immediate feedback
   - JSON/HTML reports in `test-results/` directory

## Contributing

### Adding New Tests

1. Create test file in appropriate category
2. Follow existing patterns and interfaces
3. Add proper error handling
4. Include performance monitoring
5. Update this README

### Test File Template

```typescript
import { supabase } from '../../supabase/client';
import { recordPerformance } from '../../monitoring/performance';

export class NewTestSuite {
  async runTests(): Promise<TestResult> {
    // Implementation
  }
}
```

## Troubleshooting

### Common Issues

**Connection Failures**
```
Error: Unable to connect to Supabase
Solution: Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Authentication Errors**
```
Error: Invalid credentials
Solution: Verify test credentials in environment variables
```

**Timeout Errors**
```
Error: Test timeout exceeded
Solution: Increase TEST_TIMEOUT or optimize test queries
```

**Permission Errors**
```
Error: Insufficient permissions
Solution: Check RLS policies and user roles
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=test:* npm run test:smoke
```

## Support

For issues or questions:
1. Check this README
2. Review test logs
3. Check environment configuration
4. Verify Supabase connectivity
5. Contact development team

---

## Key Features

### ✅ Comprehensive Coverage
- API endpoint validation
- Authentication flows
- Real-time functionality
- Role-based access control
- Business logic validation
- Performance monitoring

### ✅ Enterprise-Grade
- Production-ready test suites
- Detailed reporting and analytics
- CI/CD integration support
- Security-first approach
- Performance benchmarking

### ✅ Developer-Friendly
- Easy-to-use CLI interface
- Multiple output formats
- Configurable test suites
- Clear error messages
- Extensive documentation

### ✅ Georgian Distribution System Specific
- Multi-tenant architecture testing
- Order lifecycle validation
- Role-based permission testing
- Real-time order tracking
- Georgian language support validation

---

*Last Updated: November 2025*
*Georgian Distribution System v2.1*
*Comprehensive Testing Suite v1.0*