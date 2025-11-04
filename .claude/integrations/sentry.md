# Sentry Integration

> **Sentry ინტეგრაცია** | Error tracking and performance monitoring

---

## 🔍 Overview

Sentry provides real-time error tracking, performance monitoring, and debugging tools for the Georgian Distribution Management System.

---

## ⚙️ Configuration

### Sentry Project Details

- **Organization:** sitech-bg
- **Project:** georgian-distribution
- **Region:** EU (Germany)
- **URL:** https://sentry.io/organizations/sitech-bg/projects/georgian-distribution/

### Environment Variables

```bash
# frontend/.env.local
NEXT_PUBLIC_SENTRY_DSN=[your-sentry-dsn]
SENTRY_ORG=sitech-bg
SENTRY_PROJECT=georgian-distribution
SENTRY_AUTH_TOKEN=[your-auth-token]
```

### Sentry Configuration Files

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0, // Adjust for production
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

// sentry.server.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

---

## 🐛 Error Tracking

### Automatic Error Capture

Sentry automatically captures:
- Unhandled exceptions
- Unhandled promise rejections
- Console errors
- Network errors

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      operation: 'order_creation',
      user_role: session.user.role,
    },
    extra: {
      orderId: order.id,
      restaurantId: order.restaurant_id,
    },
  })
  throw error
}
```

### Custom Error Messages

```typescript
Sentry.captureMessage('Payment processing failed', {
  level: 'error',
  tags: {
    payment_method: 'card',
  },
})
```

---

## 📊 Performance Monitoring

### Transaction Tracking

```typescript
import * as Sentry from '@sentry/nextjs'

// Start transaction
const transaction = Sentry.startTransaction({
  name: 'Process Order',
  op: 'order.process',
})

try {
  // Track spans within transaction
  const span = transaction.startChild({
    op: 'database.query',
    description: 'Fetch order items',
  })

  const items = await fetchOrderItems(orderId)

  span.finish()

  // More operations...

  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

### Automatic Performance Tracking

Next.js routes are automatically instrumented:

```typescript
// API route example
// Performance automatically tracked
export async function GET(request: NextRequest) {
  const data = await fetchData()
  return NextResponse.json({ data })
}
```

---

## 👤 User Context

### Set User Context

```typescript
import * as Sentry from '@sentry/nextjs'

// Set user context after login
Sentry.setUser({
  id: user.id,
  username: user.full_name,
  role: user.role,
  // Don't include email or sensitive data
})

// Clear user context on logout
Sentry.setUser(null)
```

### Add Custom Context

```typescript
Sentry.setContext('order', {
  id: order.id,
  status: order.status,
  total: order.total_amount,
})

Sentry.setTag('restaurant_id', restaurantId)
```

---

## 🔔 Alerts & Notifications

### Alert Rules (Configured in Sentry Dashboard)

1. **Error Spike Alert**
   - Trigger: More than 50 errors in 1 hour
   - Action: Email notification

2. **Critical Error Alert**
   - Trigger: Any error tagged as 'critical'
   - Action: Slack notification (if configured)

3. **Performance Degradation**
   - Trigger: Average response time > 3 seconds
   - Action: Email notification

---

## 📈 Dashboard & Reports

### Key Metrics to Monitor

1. **Error Rate**
   - Track errors per minute/hour
   - Identify spikes

2. **User Impact**
   - Number of users affected
   - Error frequency per user

3. **Performance**
   - Average response times
   - Slow transactions
   - Database query times

4. **Release Health**
   - Crash-free sessions
   - Adoption rate
   - Error comparison between releases

---

## 🔍 Debugging with Sentry

### Breadcrumbs

Sentry automatically captures breadcrumbs:
- Console logs
- Navigation events
- Network requests
- User interactions

Custom breadcrumbs:

```typescript
Sentry.addBreadcrumb({
  category: 'order',
  message: 'User started order creation',
  level: 'info',
  data: {
    restaurantId: 'uuid',
  },
})
```

### Source Maps

Enable source maps for readable stack traces:

```javascript
// next.config.ts
module.exports = {
  sentry: {
    hideSourceMaps: false, // Keep readable in dev
  },
}
```

---

## 🚨 Error Filtering

### Ignore Common Errors

```javascript
// sentry.client.config.js
Sentry.init({
  // ...
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Network errors
    'NetworkError',
    // Ignore specific messages
    'ResizeObserver loop limit exceeded',
  ],
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
  ],
})
```

### Sample Rate Configuration

```javascript
// Adjust for production to reduce costs
Sentry.init({
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
})
```

---

## 🧪 Testing Sentry Integration

### Test Error Capture

```typescript
// Create test error
const testSentry = () => {
  try {
    throw new Error('Test Sentry Integration')
  } catch (error) {
    Sentry.captureException(error)
  }
}
```

### Verify in Dashboard

1. Trigger test error
2. Go to Sentry dashboard
3. Check Issues tab
4. Verify error appears within 1 minute

---

## 📊 Best Practices

### DO ✅

```typescript
// ✅ Add context to errors
Sentry.captureException(error, {
  tags: { feature: 'orders' },
  extra: { orderId: '123' },
})

// ✅ Set user context
Sentry.setUser({ id: userId, role: userRole })

// ✅ Track performance
const transaction = Sentry.startTransaction({ name: 'API Call' })

// ✅ Use breadcrumbs
Sentry.addBreadcrumb({ message: 'User action', category: 'ui' })
```

### DON'T ❌

```typescript
// ❌ Don't log sensitive data
Sentry.captureException(error, {
  extra: {
    password: user.password, // ❌ Never log passwords
    creditCard: payment.card, // ❌ Never log payment data
  },
})

// ❌ Don't capture everything
try {
  // Expected error
  const data = await fetchOptionalData()
} catch (error) {
  Sentry.captureException(error) // ❌ Don't capture expected errors
}

// ❌ Don't include PII
Sentry.setUser({
  id: user.id,
  email: user.email, // ❌ Avoid PII
  phone: user.phone, // ❌ Avoid PII
})
```

---

## 🔧 Troubleshooting

### Sentry Not Capturing Errors

1. Check DSN is correct
2. Verify Sentry is initialized
3. Check network tab for Sentry requests
4. Verify error is not filtered

### Source Maps Not Working

1. Ensure `hideSourceMaps: false` in development
2. Verify `sentry-cli` is configured
3. Check Sentry dashboard for uploaded source maps

---

## 📚 Resources

- **Sentry Docs:** https://docs.sentry.io/
- **Next.js Integration:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/
- **Error Tracking:** https://docs.sentry.io/product/issues/

---

**Last Updated:** 2025-11-03
**Sentry SDK:** @sentry/nextjs v8.50.0
**Region:** EU (Germany)
