# Migration Guide - Supabase Optimization

This guide helps developers migrate from the old custom API architecture to the new streamlined Supabase-based system.

## 📋 Overview of Changes

### What Was Removed
- ❌ Custom MFA API routes (`/api/auth/mfa/setup`, `/api/auth/mfa/verify`)
- ❌ Custom password reset API route (`/api/auth/reset-password`) 
- ❌ Custom CSRF API route (`/api/csrf`)
- ❌ Custom CSRF protection logic in components
- ❌ Redundant security validation classes
- ❌ Complex order workflow security checks

### What Remains
- ✅ Direct Supabase Auth integration
- ✅ Native Supabase real-time subscriptions
- ✅ Database-level RLS security
- ✅ Supabase Storage for file uploads
- ✅ Simplified business logic

## 🔄 Migration Steps

### 1. Authentication Migration

#### Before (Custom API)
```typescript
// Old way - using custom API routes
const response = await fetch('/api/auth/mfa/setup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken
  }
})
const data = await response.json()
```

#### After (Supabase Direct)
```typescript
// New way - direct Supabase Auth
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
})
```

#### Complete Migration Examples

**MFA Setup:**
```typescript
// OLD: API route approach
const response = await fetch('/api/auth/mfa/setup', { ... })

// NEW: Direct Supabase approach
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
})

if (error) {
  console.error('MFA enrollment failed:', error.message)
  return
}

// Handle MFA challenge
const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
  factorId: data.id
})
```

**MFA Verification:**
```typescript
// OLD: API route approach
const response = await fetch('/api/auth/mfa/verify', {
  method: 'POST',
  body: JSON.stringify({ factorId, code, challengeId }),
  headers: { 'x-csrf-token': csrfToken }
})

// NEW: Direct Supabase approach
const { data, error } = await supabase.auth.mfa.verify({
  factorId,
  challengeId,
  code
})
```

**Password Reset:**
```typescript
// OLD: API route approach
const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ email }),
  headers: { 'x-csrf-token': csrfToken }
})

// NEW: Direct Supabase approach
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

### 2. Security Migration

#### Remove CSRF Dependencies
```typescript
// OLD: CSRF implementation
import { useCSRF } from '@/hooks/useCSRF'

export function MyComponent() {
  const { csrfToken, getHeaders } = useCSRF()
  
  const submitForm = async () => {
    const response = await fetch('/api/some-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      }
    })
  }
}

// NEW: Direct Supabase approach (no CSRF needed)
export function MyComponent() {
  const submitForm = async () => {
    // Direct Supabase operations don't need CSRF tokens
    const { data, error } = await supabase.from('table').insert({...})
  }
}
```

### 3. Order Management Migration

#### Before (Custom API)
```typescript
// Old order workflow with custom validation
import { OrderBusinessLogic } from '@/lib/order-workflow'

const canUpdateOrder = OrderBusinessLogic.validateOrderUpdate(
  orderId,
  newStatus,
  userRole,
  userId
)
```

#### After (Supabase + RLS)
```typescript
// New simplified approach - RLS handles permissions
const { data, error } = await supabase
  .from('orders')
  .update({ status: newStatus })
  .eq('id', orderId)

// RLS policies automatically enforce user permissions
// No custom validation needed
```

### 4. Real-time Subscription Migration

#### Before (Custom Real-time)
```typescript
// Old custom real-time implementation
const subscribeToOrders = async (orderId) => {
  const response = await fetch(`/api/orders/subscribe/${orderId}`)
  // Custom WebSocket handling
}
```

#### After (Supabase Real-time)
```typescript
// New Supabase real-time
const channel = supabase
  .channel(`orders:${orderId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    console.log('Order updated:', payload)
  })
  .subscribe()
```

## 🛠️ Code Patterns

### Authentication Patterns

**Login:**
```typescript
// Direct Supabase auth
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
})
```

**Signup:**
```typescript
// Direct Supabase auth
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name,
      role: userRole
    }
  }
})
```

**Session Management:**
```typescript
// Check session
const { data: { session } } = await supabase.auth.getSession()

// Listen to auth changes
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event)
    // Handle auth state changes
  }
)
```

### Database Patterns

**Row-Level Security (RLS):**
```sql
-- RLS handles authorization at database level
CREATE POLICY "Users can view own orders" ON orders
FOR SELECT USING (auth.uid() = restaurant_id);

CREATE POLICY "Users can update own orders" ON orders  
FOR UPDATE USING (auth.uid() = restaurant_id);
```

**Real-time Queries:**
```typescript
// Real-time data fetching
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', userId)

// Real-time subscriptions
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public', 
    table: 'orders',
    filter: `restaurant_id=eq.${userId}`
  }, (payload) => {
    console.log('New order:', payload.new)
  })
  .subscribe()
```

### Storage Patterns

**File Uploads:**
```typescript
// Direct Supabase storage
const { data, error } = await supabase.storage
  .from('order-attachments')
  .upload(`order-${orderId}/${fileName}`, file)

if (error) {
  console.error('Upload failed:', error)
}
```

## 🔍 Common Issues & Solutions

### Issue: "User is not authenticated" Error

**Problem:** Missing or invalid authentication
**Solution:** 
```typescript
// Ensure user is authenticated before operations
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  // Redirect to login or handle unauthenticated state
  return
}
```

### Issue: RLS Policy Denies Access

**Problem:** User doesn't have permission to access data
**Solution:**
```sql
-- Check and update RLS policies
-- Ensure policies match user roles
-- Test with specific user scenarios
```

### Issue: Real-time Subscription Not Working

**Problem:** Missing real-time subscriptions or network issues
**Solution:**
```typescript
// Ensure real-time is enabled on table
-- ALTER PUBLICATION supabase_realtime ADD TABLE table_name;

// Proper subscription cleanup
useEffect(() => {
  const subscription = supabase.channel('table')
    .on('postgres_changes', ...).subscribe()
    
  return () => {
    supabase.removeChannel(subscription)
  }
}, [])
```

## 📝 Implementation Checklist

### For Each Component Using Removed APIs:

- [ ] **Remove CSRF dependency** (`useCSRF` hook)
- [ ] **Replace MFA API calls** with direct Supabase calls
- [ ] **Replace password reset API calls** with Supabase Auth
- [ ] **Remove custom validation logic** that duplicates RLS
- [ ] **Update imports** to remove deprecated security classes
- [ ] **Test authentication flows** thoroughly
- [ ] **Verify RLS policies** are working correctly
- [ ] **Test real-time functionality** is working
- [ ] **Remove unused API route files** (they now return deprecation notices)

### Testing Scenarios:

- [ ] **User registration/login** works with direct Supabase
- [ ] **MFA enrollment and verification** works correctly
- [ ] **Password reset flow** functions properly
- [ ] **Order management** respects user permissions
- [ ] **Real-time updates** are working for all user roles
- [ ] **File uploads** work with Supabase Storage
- [ ] **Session management** handles expiration correctly

## 📚 Resources

- **Supabase Auth Documentation:** https://supabase.com/docs/guides/auth
- **Supabase RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Supabase Real-time Guide:** https://supabase.com/docs/guides/realtime
- **Supabase Storage Guide:** https://supabase.com/docs/guides/storage

## 🔄 Rollback Plan

If issues arise during migration:

1. **Keep deprecation notices in API routes** (not hard deletes)
2. **Maintain RLS policies** as they provide database-level security
3. **Test thoroughly** before production deployment
4. **Monitor authentication metrics** during transition

## ✨ Benefits After Migration

- **🚀 Faster Performance:** Direct client-to-Supabase communication
- **🔒 Better Security:** Database-level RLS policies
- **📱 Better Real-time:** Native WebSocket connections  
- **🛠️ Easier Maintenance:** Less custom code to maintain
- **📖 Better Documentation:** Official Supabase docs vs custom code
- **👥 Community Support:** Supabase ecosystem vs custom implementation

---

**Migration Status:** ✅ **Complete**
**Next Steps:** Test all functionality and monitor for issues during deployment.

For questions or issues during migration, refer to the Supabase documentation or create an issue in the project repository.