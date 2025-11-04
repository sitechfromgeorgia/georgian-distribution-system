# Real-time Cart Synchronization - Georgian Distribution System

This document provides comprehensive documentation for the real-time cart synchronization feature implemented in the Georgian Distribution System.

## Overview

The real-time cart synchronization system provides instant, live updates across all devices and sessions using Supabase Realtime capabilities. This ensures that cart changes are immediately reflected across multiple browser tabs, devices, or sessions.

## Architecture

### Core Components

1. **Database Schema** (`database/realtime-cart-sync.sql`)
   - `cart_sessions` - Manages cart sessions for authenticated and anonymous users
   - `cart_items` - Stores individual cart items with real-time sync
   - `cart_activities` - Tracks cart changes for real-time updates

2. **Service Layer** (`frontend/src/services/realtime-cart.service.ts`)
   - `RealtimeCartService` - Core service for cart operations with real-time sync
   - Session management with automatic TTL
   - WebSocket subscriptions for live updates

3. **Context & State** (`frontend/src/contexts/RealtimeCartContext.tsx`)
   - `RealtimeCartProvider` - React context provider for real-time cart state
   - Toast notifications for user feedback
   - Automatic cart synchronization

4. **Custom Hooks** (`frontend/src/hooks/useRealtimeCart.ts`)
   - `useRealtimeCart` - Main hook for cart operations
   - Specialized hooks for different use cases

## Features

### 🔄 Real-time Synchronization
- **Live Updates**: Cart changes instantly reflect across all devices
- **WebSocket Connection**: Persistent connection using Supabase Realtime
- **Activity Tracking**: Every cart change is logged for audit trail
- **Session Management**: Automatic session creation and cleanup

### 👥 Multi-user Support
- **Authenticated Users**: Personal cart sessions tied to user accounts
- **Anonymous Users**: Temporary cart sessions for guest users
- **Session Persistence**: 24-hour cart retention
- **Device Independence**: Cart follows the user, not the device

### 🛡️ Security & Data Integrity
- **Row Level Security**: Database-level access control
- **User Isolation**: Users can only access their own cart data
- **Input Validation**: Zod schemas for all cart operations
- **Automatic Cleanup**: Expired sessions are automatically removed

### 🇬🇪 Georgian Market Features
- **Georgian Language Support**: All UI elements in Georgian
- **Local Currency**: GEL currency formatting
- **Regional Optimizations**: Optimized for Georgian market needs

## Usage Examples

### Basic Setup

```tsx
import { RealtimeCartProvider } from '@/contexts/RealtimeCartContext'

export default function App({ children }) {
  return (
    <RealtimeCartProvider 
      userId={user?.id}
      enableRealTime={true}
    >
      {children}
    </RealtimeCartProvider>
  )
}
```

### Using Real-time Cart Hook

```tsx
import { useRealtimeCart } from '@/hooks/useRealtimeCart'

function ProductCatalog() {
  const { 
    addProductToCart,
    itemCount, 
    totalPrice,
    formatTotal 
  } = useRealtimeCart()

  const handleAddToCart = async (productId: string) => {
    await addProductToCart(productId, 1, 'დამატებითი ინფორმაცია')
  }

  return (
    <div>
      <p>კალათაში: {itemCount} ერთეული</p>
      <p>ჯამური ფასი: {formatTotal(totalPrice)}</p>
      {/* ... product catalog UI ... */}
    </div>
  )
}
```

### Real-time Connection Status

```tsx
import { useRealtimeCartConnection } from '@/hooks/useRealtimeCart'

function CartStatusIndicator() {
  const { connectionStatus, session } = useRealtimeCartConnection()

  return (
    <div className={`cart-status ${connectionStatus}`}>
      {connectionStatus === 'connected' && (
        <span className="text-green-600">🟢 კალათა სინქრონიზებულია</span>
      )}
      {connectionStatus === 'disconnected' && (
        <span className="text-yellow-600">🟡 კალათა არ არის სინქრონიზებული</span>
      )}
      {connectionStatus === 'disabled' && (
        <span className="text-gray-600">⚪ რეალ-დროის სინქრონიზაცია გამორთულია</span>
      )}
    </div>
  )
}
```

## Database Schema

### Cart Sessions Table
```sql
CREATE TABLE cart_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Cart Items Table
```sql
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_session_id UUID REFERENCES cart_sessions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cart_session_id, product_id)
);
```

### Cart Activities Table
```sql
CREATE TABLE cart_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_session_id UUID REFERENCES cart_sessions(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    old_quantity INTEGER,
    new_quantity INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Real-time Events

### Supported Events
- `item_added` - New item added to cart
- `item_updated` - Cart item quantity/notes updated
- `item_removed` - Item removed from cart
- `cart_cleared` - All items removed from cart
- `activity` - General cart activity

### Event Handling
```tsx
const handleRealTimeUpdate = useCallback((update: RealtimeCartUpdate) => {
  console.log('Cart update received:', update)
  
  switch (update.type) {
    case 'item_added':
      // Handle item addition
      break
    case 'item_updated':
      // Handle item update
      break
    case 'item_removed':
      // Handle item removal
      break
    case 'cart_cleared':
      // Handle cart cleared
      break
  }
}, [])
```

## Configuration

### Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Real-time Settings
NEXT_PUBLIC_REALTIME_CART_ENABLED=true
NEXT_PUBLIC_CART_SESSION_TTL_HOURS=24
```

### Service Configuration
```tsx
const realtimeConfig: RealtimeCartConfig = {
  enableRealTime: true,
  sessionToken: 'optional-custom-session-token',
  userId: 'current-user-id'
}
```

## Performance Considerations

### Optimization Strategies
1. **Debounced Updates**: Cart operations are debounced to prevent excessive API calls
2. **Efficient Queries**: Uses indexed columns for fast lookups
3. **Connection Pooling**: Leverages Supabase's connection pooler
4. **Background Sync**: Non-critical sync operations run in background

### Monitoring
- Connection status monitoring
- Session activity tracking
- Performance metrics collection
- Error rate monitoring

## Troubleshooting

### Common Issues

#### Connection Problems
- **Issue**: Cart not syncing across devices
- **Solution**: Check Supabase Realtime configuration and network connectivity

#### Session Expiration
- **Issue**: Cart items disappearing after 24 hours
- **Solution**: This is expected behavior; ensure users submit orders within 24 hours

#### Database Errors
- **Issue**: RLS policy violations
- **Solution**: Verify user authentication and session token validity

### Debug Tools
```tsx
// Enable debug mode
const { session, isConnected, lastSync } = useRealtimeCartSync()

if (process.env.NODE_ENV === 'development') {
  console.log('Cart Session:', session)
  console.log('Connection Status:', isConnected)
  console.log('Last Sync:', lastSync)
}
```

## Migration from Local Storage

The system provides seamless migration from local storage cart to real-time cart:

```tsx
// Migrate existing cart data
const migrateLocalCart = async () => {
  const localCart = localStorage.getItem('georgian-cart')
  if (localCart) {
    const cartData = JSON.parse(localCart)
    for (const item of cartData.items) {
      await addProductToCart(item.productId, item.quantity, item.notes)
    }
    localStorage.removeItem('georgian-cart')
  }
}
```

## API Reference

### RealtimeCartService Methods

#### `initializeSession()`
Initializes a new cart session or returns existing active session.

#### `getCart()`
Fetches current cart data from database.

#### `addItem(input)`
Adds item to cart with real-time sync.

#### `updateItem(input)`
Updates existing cart item.

#### `removeItem(itemId)`
Removes item from cart.

#### `clearCart()`
Clears all items from cart.

#### `subscribeToCartUpdates(callback)`
Subscribes to real-time cart changes.

## Best Practices

### 1. Session Management
- Always initialize session before cart operations
- Handle session expiration gracefully
- Clean up on user logout

### 2. Error Handling
- Implement comprehensive error handling
- Provide user-friendly error messages
- Log errors for debugging

### 3. Performance
- Minimize real-time subscriptions
- Use appropriate loading states
- Optimize for mobile devices

### 4. User Experience
- Provide visual feedback for all actions
- Show connection status to users
- Handle offline scenarios gracefully

## Future Enhancements

### Planned Features
- [ ] Cart sharing between users
- [ ] Cart export/import functionality
- [ ] Advanced cart analytics
- [ ] Inventory reservation system
- [ ] Bulk cart operations
- [ ] Cart templates

### Scalability Considerations
- Horizontal scaling support
- Redis caching layer
- CDN integration for cart assets
- Advanced monitoring and alerting

---

*This documentation covers the real-time cart synchronization system as implemented for the Georgian Distribution System. For updates and additional features, refer to the project repository.*