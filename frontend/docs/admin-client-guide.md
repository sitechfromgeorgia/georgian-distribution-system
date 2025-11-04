# Admin Client Guide - Georgian Distribution System

This guide provides comprehensive documentation for using the Admin Client in the Georgian Distribution System, including service role operations, bulk processing, and audit logging.

## Overview

The Admin Client is a specialized Supabase client configured with service role privileges that enables privileged operations not available through regular user authentication. It provides:

- **Service Role Access**: Bypass Row Level Security (RLS) policies
- **Bulk Operations**: Efficient processing of large datasets
- **Audit Logging**: Complete tracking of admin actions
- **System Administration**: User management, product management, and order administration

## Architecture

### Environment Structure

```
frontend/
├── src/
│   ├── lib/supabase/
│   │   ├── admin.ts          # Admin client configuration
│   │   ├── client.ts         # Regular client configuration
│   │   └── ...
│   ├── lib/
│   │   ├── admin-utils.ts    # Admin utilities and helpers
│   │   ├── env.ts           # Environment configuration
│   │   └── ...
│   ├── services/admin/
│   │   ├── index.ts         # Admin services exports
│   │   ├── admin.service.ts # Main admin service
│   │   ├── audit.service.ts # Audit logging service
│   │   ├── bulk.service.ts  # Bulk operations service
│   │   └── ...
│   └── types/
│       └── admin.ts         # Admin-specific types
```

### Configuration

#### Environment Variables Required

```bash
# Supabase Configuration (Required for Admin Client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

**Important Security Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to the client
- Admin operations are restricted to server-side contexts only
- Service role key bypasses all RLS policies - use with extreme caution

## Core Components

### 1. Admin Client (`/lib/supabase/admin.ts`)

The main admin client configuration with service role authentication.

#### Key Features:
- **Server-side only**: Prevents client-side usage
- **Singleton pattern**: Reuses client instance
- **Automatic validation**: Checks environment configuration
- **Health monitoring**: System connectivity checks

#### Usage Example:
```typescript
import { getAdminClient, adminDatabase } from '@/lib/supabase/admin'

// Server-side usage only
const adminClient = getAdminClient()

// Direct client access
const { data } = await adminClient
  .from('orders')
  .select('*')

// Database operations class
const orders = await adminDatabase.getAllOrdersWithDetails()
```

### 2. Admin Services (`/services/admin/`)

#### AdminService
Main service class for general admin operations.

```typescript
import { AdminService } from '@/services/admin'

const adminService = new AdminService()

// Server-side enhanced operations
if (typeof window === 'undefined') {
  const analytics = await adminService.getDashboardAnalytics()
  const systemHealth = await adminService.getSystemHealth()
  const connectionInfo = await adminService.getConnectionInfo()
}
```

#### AuditService
Handles comprehensive audit logging.

```typescript
import { auditService } from '@/services/admin'

// Log admin actions
await auditService.logAdminAction(
  'user_create',
  'users',
  userId,
  'admin-123',
  { userData: { role: 'restaurant' } }
)

// Get audit logs with filtering
const logs = await auditService.getAuditLogs({
  action: 'user_create',
  dateFrom: '2025-01-01',
  limit: 100
})

// Export audit logs
const csv = await auditService.exportAuditLogs({
  dateFrom: '2025-01-01',
  dateTo: '2025-12-31'
})
```

#### BulkService
Handles batch operations efficiently.

```typescript
import { bulkService } from '@/services/admin'

// Bulk update product prices
const priceUpdates = [
  { id: 'product-1', price: 29.99 },
  { id: 'product-2', price: 15.50 }
]

const result = await bulkService.bulkUpdateProductPrices(
  priceUpdates,
  'admin-123'
)

// Monitor batch progress
const batch = await bulkService.getBatchStatus(result.batchId)
const activeBatches = await bulkService.getActiveBatches()
```

### 3. Admin Utilities (`/lib/admin-utils.ts`)

#### AdminValidator
Data validation for admin operations.

```typescript
import { AdminValidator } from '@/lib/admin-utils'

// Validate user data
const userValidation = AdminValidator.validateUserData({
  email: 'user@example.com',
  full_name: 'John Doe',
  role: 'restaurant',
  phone: '+995555123456'
})

// Validate bulk operations
const bulkValidation = AdminValidator.validateBulkPriceUpdates([
  { id: 'product-1', price: 29.99 }
])

if (!userValidation.isValid) {
  console.error('Validation errors:', userValidation.errors)
}
```

#### AdminAuditLogger
Local audit logging utility.

```typescript
import { AdminAuditLogger } from '@/lib/admin-utils'

// Log actions locally
AdminAuditLogger.log(
  'product_update',
  'products',
  'product-123',
  'admin-123',
  { changes: { price: 29.99 } }
)

// Retrieve recent logs
const recentLogs = AdminAuditLogger.getRecentLogs(50)
const actionLogs = AdminAuditLogger.getLogsByAction('user_create')
```

#### AdminBatchProcessor
Batch operation tracking.

```typescript
import { AdminBatchProcessor } from '@/lib/admin-utils'

// Create batch operation
const batch = AdminBatchProcessor.createBatch(
  'product_bulk_update',
  100,
  { operation: 'price_update' }
)

// Update progress
AdminBatchProcessor.updateBatchProgress(
  batch.id,
  50, // processed
  45, // success
  [{ item_id: 'product-1', error: 'Price too high' }]
)

// Complete batch
AdminBatchProcessor.completeBatch(batch.id, 'completed')
```

## Security Guidelines

### 1. Server-Side Only Operations

Admin operations must only be performed in server-side contexts:

```typescript
// ✅ Correct: Server-side usage
export async function adminFunction() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin operations require server context')
  }
  
  const adminClient = getAdminClient()
  // ... admin operations
}

// ❌ Incorrect: Client-side usage
function ClientComponent() {
  const adminClient = getAdminClient() // Will throw error
}
```

### 2. Environment Validation

Always validate environment before admin operations:

```typescript
import { checkAdminConnection, getAdminEnvironmentInfo } from '@/lib/supabase/admin'

// Check connection
const isConnected = await checkAdminConnection()
if (!isConnected) {
  throw new Error('Admin client connection failed')
}

// Check environment
const envInfo = getAdminEnvironmentInfo()
console.log('Admin environment:', envInfo)
```

### 3. Audit Logging

Always log sensitive operations:

```typescript
import { auditService } from '@/services/admin'

// Log all privileged operations
await auditService.logAdminAction(
  'user_delete',
  'users',
  userId,
  adminUserId,
  { reason: 'User violated terms of service' }
)
```

## Common Use Cases

### 1. User Management

```typescript
import { adminService, auditService, AdminValidator } from '@/services/admin'

export async function createUser(userData: UserFormData) {
  // Validate input
  const validation = AdminValidator.validateUserData(userData)
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
  }

  // Log operation start
  const logEntry = await auditService.logAdminAction(
    'user_create',
    'users',
    null,
    'admin-123',
    { userData: { ...userData, password: '[REDACTED]' } }
  )

  try {
    // Create user via service role
    const user = await adminService.createUser(userData)
    
    // Log success
    await auditService.logAdminAction(
      'user_create',
      'users',
      user.id,
      'admin-123',
      { success: true, log_entry_id: logEntry.id }
    )
    
    return user
  } catch (error) {
    // Log failure
    await auditService.logAdminAction(
      'user_create',
      'users',
      null,
      'admin-123',
      { success: false, error: error.message }
    )
    throw error
  }
}
```

### 2. Bulk Product Updates

```typescript
import { bulkService, AdminValidator } from '@/services/admin'

export async function updateProductPrices(updates: BulkPriceUpdate[], adminId: string) {
  // Validate updates
  const validation = AdminValidator.validateBulkPriceUpdates(updates)
  if (!validation.isValid) {
    throw new Error(`Bulk validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
  }

  // Execute bulk update
  const result = await bulkService.bulkUpdateProductPrices(updates, adminId)
  
  // Monitor progress
  setTimeout(async () => {
    const status = await bulkService.getBatchStatus(result.batchId)
    console.log('Batch status:', status)
  }, 1000)
  
  return result
}
```

### 3. Order Management

```typescript
import { adminService, auditService } from '@/services/admin'

export async function assignOrderToDriver(orderId: string, driverId: string, adminId: string) {
  // Log operation
  await auditService.logAdminAction(
    'order_assignment',
    'orders',
    orderId,
    adminId,
    { driver_id: driverId }
  )

  // Assign driver
  const order = await adminService.assignDriver(orderId, driverId)
  
  return order
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, adminId: string) {
  // Log operation
  await auditService.logAdminAction(
    'order_status_change',
    'orders',
    orderId,
    adminId,
    { new_status: status }
  )

  // Update status
  const order = await adminService.updateOrderStatus(orderId, status)
  
  return order
}
```

## Error Handling

### Admin-Specific Error Types

```typescript
// Environment errors
if (typeof window !== 'undefined') {
  throw new AdminClientError('SERVER_CONTEXT_REQUIRED', 'Admin client can only be used server-side')
}

// Validation errors
const validation = AdminValidator.validateUserData(data)
if (!validation.isValid) {
  throw new AdminValidationError('INVALID_INPUT', validation.errors)
}

// Permission errors
if (!hasAdminPermission(user)) {
  throw new AdminPermissionError('INSUFFICIENT_PRIVILEGES', 'Admin role required')
}
```

### Error Recovery

```typescript
import { adminService } from '@/services/admin'

try {
  const result = await adminService.bulkUpdateProductPrices(updates, adminId)
  return result
} catch (error) {
  if (error.code === 'CONNECTION_ERROR') {
    // Retry with fallback
    const fallbackResult = await adminService.getSystemHealth()
    return { status: 'degraded', data: fallbackResult }
  }
  
  // Log error for investigation
  await auditService.logAdminAction(
    'system_error',
    'system',
    null,
    'admin-123',
    { error: error.message, operation: 'bulk_update' }
  )
  
  throw error
}
```

## Performance Considerations

### 1. Connection Pooling

The admin client uses connection pooling for efficiency:

```typescript
// Singleton pattern ensures efficient connection reuse
const adminClient = getAdminClient() // Reuses existing connection

// Multiple operations share connection
const users = await adminClient.from('profiles').select('*')
const products = await adminClient.from('products').select('*')
```

### 2. Batch Operations

Use bulk operations for large datasets:

```typescript
// ❌ Inefficient: Individual operations
for (const update of updates) {
  await adminService.updateProduct(update.id, { price: update.price })
}

// ✅ Efficient: Single bulk operation
await bulkService.bulkUpdateProductPrices(updates, adminId)
```

### 3. Audit Log Management

Clean up old audit logs regularly:

```typescript
import { bulkService } from '@/services/admin'

// Clean up completed batches older than 24 hours
await bulkService.cleanupCompletedBatches(24)

// Archive old audit logs (implement based on your retention policy)
const cutoffDate = new Date()
cutoffDate.setMonths(cutoffDate.getMonth() - 6)
await auditService.archiveAuditLogs(cutoffDate)
```

## Testing Admin Operations

### 1. Connection Testing

```typescript
import { checkAdminConnection, getAdminEnvironmentInfo } from '@/lib/supabase/admin'

describe('Admin Client', () => {
  test('should connect successfully', async () => {
    const isConnected = await checkAdminConnection()
    expect(isConnected).toBe(true)
  })

  test('should have valid environment', () => {
    const envInfo = getAdminEnvironmentInfo()
    expect(envInfo.hasServiceRoleKey).toBe(true)
    expect(envInfo.url).toBeDefined()
  })
})
```

### 2. Service Testing

```typescript
import { adminService } from '@/services/admin'

describe('AdminService', () => {
  test('should get system health', async () => {
    const health = await adminService.getSystemHealth()
    expect(health.database).toBeDefined()
  })

  test('should get connection info', async () => {
    const connectionInfo = await adminService.getConnectionInfo()
    expect(connectionInfo.clientType).toBe('server')
    expect(connectionInfo.hasAdminClient).toBe(true)
  })
})
```

## Environment Configuration

### Development Setup

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
NEXT_PUBLIC_ENVIRONMENT=development
```

### Production Setup

```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_ENVIRONMENT=production
```

## Best Practices

### 1. Always Validate Input

```typescript
// Validate all admin inputs
const validation = AdminValidator.validateUserData(userData)
if (!validation.isValid) {
  throw new AdminValidationError('Invalid input', validation.errors)
}
```

### 2. Log All Operations

```typescript
// Log every privileged operation
await auditService.logAdminAction(
  operation,
  resource,
  resourceId,
  performedBy,
  details
)
```

### 3. Use Batch Operations

```typescript
// Prefer bulk operations for multiple items
await bulkService.bulkUpdateProductPrices(updates, adminId)
```

### 4. Monitor Performance

```typescript
// Track operation performance
const start = Date.now()
await adminService.bulkUpdateProductPrices(updates, adminId)
const duration = Date.now() - start
console.log(`Operation took ${duration}ms`)
```

### 5. Handle Errors Gracefully

```typescript
// Provide meaningful error messages
try {
  await adminService.bulkUpdateProductPrices(updates, adminId)
} catch (error) {
  throw new AdminOperationError(
    'BULK_UPDATE_FAILED',
    `Failed to update ${updates.length} products: ${error.message}`
  )
}
```

## Troubleshooting

### Common Issues

#### 1. "Admin client can only be used in server-side contexts"

**Solution**: Ensure operations are in server-side contexts only.

```typescript
// ✅ Correct
export async function adminFunction() {
  if (typeof window !== 'undefined') {
    throw new Error('Server context required')
  }
  const adminClient = getAdminClient()
}

// ❌ Incorrect
function Component() {
  const adminClient = getAdminClient() // This will fail
}
```

#### 2. "Missing SUPABASE_SERVICE_ROLE_KEY"

**Solution**: Ensure environment variable is set.

```bash
# Check .env.local or environment configuration
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### 3. Connection Pool Exhaustion

**Solution**: Monitor and optimize connection usage.

```typescript
// Monitor connection health
const health = await checkAdminConnection()
if (!health) {
  console.warn('Admin client connection issues detected')
}
```

## API Reference

### Admin Client Functions

- `getAdminClient()`: Get singleton admin client instance
- `checkAdminConnection()`: Test admin client connectivity
- `getAdminEnvironmentInfo()`: Get environment configuration info

### AdminService Methods

- `getDashboardAnalytics()`: Get comprehensive analytics data
- `getSystemHealth()`: Check system health status
- `getConnectionInfo()`: Get connection status and info
- `getAllOrdersWithDetails()`: Get all orders with related data
- `bulkUpdateProductPrices()`: Bulk update product prices
- `bulkUpdateUserStatus()`: Bulk update user status
- `assignDriver()`: Assign driver to order
- `updateOrderStatus()`: Update order status

### AuditService Methods

- `logAdminAction()`: Create audit log entry
- `getAuditLogs()`: Retrieve audit logs with filtering
- `getAuditStats()`: Get audit statistics
- `exportAuditLogs()`: Export audit logs to CSV

### BulkService Methods

- `bulkUpdateProductPrices()`: Bulk update product prices
- `bulkUpdateUserStatus()`: Bulk update user status
- `bulkDeleteOrders()`: Bulk delete orders (with confirmation)
- `getBatchStatus()`: Get batch operation status
- `getActiveBatches()`: Get active batch operations
- `cancelBatch()`: Cancel pending batch operation

---

*For more information, see the main documentation at `/docs/README.md`*