# Supabase Realtime: Complete Technical Reference

## Overview

Supabase Realtime is a globally distributed Elixir-based service that enables real-time communication via WebSockets for the Georgian Distribution System. It powers live order tracking, driver location updates, and instant notifications across the platform's Admin, Restaurant, Driver, and Demo dashboards.

### Key Capabilities

Supabase Realtime provides three core features:

1. **Broadcast** - Send ephemeral messages between clients with low latency
   - Cursor positions in collaborative tools
   - Live notifications
   - Typing indicators
   - Real-time reactions

2. **Presence** - Track and synchronize shared state between clients
   - Online user count
   - Driver availability status
   - Active restaurant sessions
   - Collaborative editing state

3. **Postgres Changes** - Listen to database changes via logical replication
   - New order notifications
   - Order status updates
   - Product inventory changes
   - Real-time analytics

### Architecture

Realtime integrates with the Georgian Distribution System:
- **Frontend (greenland77.ge)** - WebSocket connections from Next.js client
- **Realtime Server** - Global Elixir cluster at data.greenland77.ge
- **PostgreSQL** - Logical replication slot for database changes
- **Kong Gateway** - WebSocket connection authentication

---

## Core Concepts

### 1. Channels

Channels are the primary abstraction for real-time communication. Each channel represents a topic that clients can subscribe to.

**Channel Naming**:
- `orders:{restaurant_id}` - Restaurant-specific orders
- `driver:{driver_id}` - Driver location updates
- `notifications:{user_id}` - User-specific notifications
- `global:orders` - All orders (admin only)

**Channel Lifecycle**:
1. **Connect** - WebSocket connection established
2. **Subscribe** - Join specific channels
3. **Listen** - Receive messages on channels
4. **Send** - Broadcast messages to channel
5. **Unsubscribe** - Leave channels
6. **Disconnect** - Close WebSocket connection

### 2. WebSocket Protocol

Realtime uses Phoenix Channels protocol over WebSockets:

```typescript
// Message structure
{
  event: string,      // Event type (phx_join, postgres_changes, etc.)
  topic: string,      // Channel topic
  payload: object,    // Event data
  ref: string         // Message reference ID
}
```

### 3. Authorization

Realtime uses JWT tokens for authorization:
- RLS policies enforced on Postgres Changes
- Custom authorization for Broadcast/Presence
- Row-level filtering of database events

### 4. Connection Management

**Connection States**:
- `connecting` - Establishing WebSocket connection
- `open` - Connection established
- `subscribed` - Channel subscription active
- `closed` - Connection terminated
- `errored` - Connection failed

---

## API Reference

### Method 1: channel()

**Purpose**: Create or retrieve a channel for real-time communication

**When to use**:
- Subscribe to order updates for a restaurant
- Track driver locations
- Listen for new notifications
- Implement collaborative features

**Syntax**:
```typescript
const channel = supabase.channel(
  name: string,
  options?: {
    config?: {
      broadcast?: { self?: boolean, ack?: boolean },
      presence?: { key?: string },
      postgres_changes?: PostgresChangesConfig[]
    }
  }
)
```

**Parameters**:
- `name` (string, required): Unique channel name (cannot be 'realtime')
- `options.config.broadcast.self` (boolean): Receive own broadcast messages (default: false)
- `options.config.broadcast.ack` (boolean): Acknowledge broadcast messages (default: false)
- `options.config.presence.key` (string): Custom key for presence tracking
- `options.config.postgres_changes` (array): Database change subscriptions

**Returns**: `RealtimeChannel` instance

**Example (Restaurant Order Notifications)**:
```typescript
// app/dashboard/restaurant/orders/realtime.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Order {
  id: string
  status: string
  total: number
  created_at: string
}

export function OrderRealtime({ restaurantId }: { restaurantId: string }) {
  const supabase = createBrowserClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    // Create channel with postgres_changes config
    const ordersChannel = supabase
      .channel(`orders:${restaurantId}`, {
        config: {
          postgres_changes: [
            {
              event: '*',  // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'orders',
              filter: `restaurant_id=eq.${restaurantId}`
            }
          ]
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New order:', payload.new)
          setOrders(prev => [payload.new as Order, ...prev])
          
          // Show notification
          new Notification('New Order!', {
            body: `Order #${payload.new.id} received`,
            icon: '/logo.png'
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order updated:', payload.new)
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id ? payload.new as Order : order
          ))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to order updates')
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe')
        }
      })

    setChannel(ordersChannel)

    // Cleanup on unmount
    return () => {
      ordersChannel.unsubscribe()
    }
  }, [restaurantId, supabase])

  return (
    <div>
      <h2>Live Orders ({orders.length})</h2>
      {orders.map(order => (
        <div key={order.id}>
          Order #{order.id} - {order.status}
        </div>
      ))}
    </div>
  )
}
```

**Common Errors**:
- `CHANNEL_ERROR` - Check JWT token validity
- `TIMED_OUT` - Network issues or server overload
- `Invalid channel name` - Cannot use 'realtime' as channel name

**Best Practices**:
- Use descriptive channel names with IDs
- Always unsubscribe on component unmount
- Handle all subscription states
- Implement reconnection logic

---

### Method 2: subscribe()

**Purpose**: Activate channel subscription and start receiving messages

**When to use**:
- After setting up channel event listeners
- To start receiving real-time updates
- Must be called before channel becomes active

**Syntax**:
```typescript
channel.subscribe((status, error) => {
  // Handle subscription status
})
```

**Subscription States**:
- `SUBSCRIBED` - Successfully subscribed
- `TIMED_OUT` - Subscription timeout
- `CLOSED` - Channel closed
- `CHANNEL_ERROR` - Subscription failed

**Returns**: `RealtimeChannel` instance

**Example (Driver Location Tracking)**:
```typescript
// components/driver-tracker.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface DriverLocation {
  driver_id: string
  latitude: number
  longitude: number
  updated_at: string
}

export function DriverTracker({ orderId }: { orderId: string }) {
  const supabase = createBrowserClient()
  const [location, setLocation] = useState<DriverLocation | null>(null)
  const [status, setStatus] = useState<string>('connecting')

  useEffect(() => {
    const channel = supabase
      .channel(`order:${orderId}:driver-location`)
      .on(
        'broadcast',
        { event: 'location-update' },
        (payload) => {
          setLocation(payload.payload as DriverLocation)
        }
      )
      .subscribe((subscriptionStatus, error) => {
        setStatus(subscriptionStatus)

        if (subscriptionStatus === 'SUBSCRIBED') {
          console.log('✅ Tracking driver location')
        }

        if (subscriptionStatus === 'CHANNEL_ERROR') {
          console.error('❌ Failed to track driver:', error)
        }

        if (subscriptionStatus === 'TIMED_OUT') {
          console.warn('⏱️ Subscription timeout, retrying...')
          // Implement retry logic
          setTimeout(() => {
            channel.subscribe()
          }, 5000)
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [orderId, supabase])

  if (status === 'connecting') {
    return <div>Connecting to driver...</div>
  }

  if (status === 'CHANNEL_ERROR') {
    return <div>Failed to connect to driver</div>
  }

  return (
    <div>
      <h3>Driver Location</h3>
      {location ? (
        <div>
          <p>Lat: {location.latitude}</p>
          <p>Lng: {location.longitude}</p>
          <p>Updated: {new Date(location.updated_at).toLocaleTimeString()}</p>
        </div>
      ) : (
        <p>Waiting for location...</p>
      )}
    </div>
  )
}
```

**Best Practices**:
- Always handle all subscription states
- Implement retry logic for TIMED_OUT
- Show loading state while connecting
- Log errors for debugging

---

### Method 3: on() - Postgres Changes

**Purpose**: Listen to database table changes (INSERT, UPDATE, DELETE)

**When to use**:
- New order notifications
- Order status updates
- Product inventory changes
- Real-time analytics

**Syntax**:
```typescript
channel.on(
  'postgres_changes',
  {
    event: '*' | 'INSERT' | 'UPDATE' | 'DELETE',
    schema: string,
    table: string,
    filter?: string
  },
  (payload) => {
    // Handle database change
  }
)
```

**Parameters**:
- `event` - Database event type or `*` for all
- `schema` - Database schema (usually 'public')
- `table` - Table name
- `filter` - Column filter (e.g., 'status=eq.pending')

**Payload Structure**:
```typescript
{
  eventType: 'INSERT' | 'UPDATE' | 'DELETE',
  new: Record<string, any>,  // New row data (INSERT, UPDATE)
  old: Record<string, any>,  // Old row data (UPDATE, DELETE)
  schema: string,
  table: string,
  commit_timestamp: string
}
```

**Example (Admin Real-Time Dashboard)**:
```typescript
// app/admin/dashboard/realtime.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  activeDrivers: number
  revenue: number
}

export function AdminDashboard() {
  const supabase = createBrowserClient()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    activeDrivers: 0,
    revenue: 0
  })

  useEffect(() => {
    const channel = supabase
      .channel('admin:global-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // New order created
          setStats(prev => ({
            ...prev,
            totalOrders: prev.totalOrders + 1,
            pendingOrders: prev.pendingOrders + 1,
            revenue: prev.revenue + payload.new.total
          }))
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: 'status=eq.pending'
        },
        (payload) => {
          // Order status changed from pending
          if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
            setStats(prev => ({
              ...prev,
              pendingOrders: prev.pendingOrders - 1
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers' },
        (payload) => {
          // Driver status changed
          if (payload.eventType === 'UPDATE') {
            if (payload.old.status !== 'active' && payload.new.status === 'active') {
              setStats(prev => ({
                ...prev,
                activeDrivers: prev.activeDrivers + 1
              }))
            } else if (payload.old.status === 'active' && payload.new.status !== 'active') {
              setStats(prev => ({
                ...prev,
                activeDrivers: prev.activeDrivers - 1
              }))
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  return (
    <div className="dashboard">
      <div className="stat-card">
        <h3>Total Orders</h3>
        <p className="stat-value">{stats.totalOrders}</p>
      </div>
      <div className="stat-card">
        <h3>Pending Orders</h3>
        <p className="stat-value">{stats.pendingOrders}</p>
      </div>
      <div className="stat-card">
        <h3>Active Drivers</h3>
        <p className="stat-value">{stats.activeDrivers}</p>
      </div>
      <div className="stat-card">
        <h3>Revenue</h3>
        <p className="stat-value">₾{stats.revenue.toFixed(2)}</p>
      </div>
    </div>
  )
}
```

**Security Notes**:
- RLS policies automatically enforced
- Users only receive changes they can access
- Filter parameter adds client-side filtering
- Sensitive columns excluded automatically

---

### Method 4: on() - Broadcast

**Purpose**: Send and receive ephemeral messages between clients

**When to use**:
- Driver location updates
- Typing indicators
- Cursor positions
- Live reactions
- Temporary notifications

**Syntax**:
```typescript
channel.on(
  'broadcast',
  { event: string },
  (payload) => {
    // Handle broadcast message
  }
)
```

**Example (Driver Sends Location Updates)**:
```typescript
// app/driver/tracking/location-sender.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useRef } from 'react'

export function LocationSender({ orderId, driverId }: { 
  orderId: string
  driverId: string 
}) {
  const supabase = createBrowserClient()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`order:${orderId}:driver-location`)
      .subscribe()

    channelRef.current = channel

    // Start sending location every 5 seconds
    const intervalId = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            channel.send({
              type: 'broadcast',
              event: 'location-update',
              payload: {
                driver_id: driverId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                updated_at: new Date().toISOString()
              }
            })
          },
          (error) => {
            console.error('Location error:', error)
          }
        )
      }
    }, 5000)

    return () => {
      clearInterval(intervalId)
      channel.unsubscribe()
    }
  }, [orderId, driverId, supabase])

  return (
    <div className="status-indicator">
      📍 Sharing location with restaurant
    </div>
  )
}
```

**Broadcast Options**:
```typescript
// Receive own messages (default: false)
const channel = supabase.channel('my-channel', {
  config: {
    broadcast: { self: true }
  }
})

// Acknowledge message delivery (default: false)
const channel = supabase.channel('my-channel', {
  config: {
    broadcast: { ack: true }
  }
})
```

---

### Method 5: on() - Presence

**Purpose**: Track online users and shared state

**When to use**:
- Show active drivers count
- Display online restaurants
- Collaborative editing
- User activity indicators

**Syntax**:
```typescript
channel.on('presence', { event: string }, (payload) => {
  // Handle presence event
})
```

**Presence Events**:
- `sync` - Initial state + periodic sync
- `join` - User joined channel
- `leave` - User left channel

**Example (Track Active Drivers)**:
```typescript
// components/active-drivers.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface DriverPresence {
  driver_id: string
  driver_name: string
  status: 'available' | 'busy' | 'offline'
  location?: { lat: number; lng: number }
}

export function ActiveDrivers() {
  const supabase = createBrowserClient()
  const [drivers, setDrivers] = useState<Record<string, DriverPresence>>({})

  useEffect(() => {
    const channel = supabase
      .channel('drivers:presence', {
        config: {
          presence: {
            key: 'driver_id'  // Unique key per user
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        // Get all present users
        const state = channel.presenceState<DriverPresence>()
        console.log('Current drivers:', state)
        
        // Convert to flat object
        const driverMap: Record<string, DriverPresence> = {}
        Object.entries(state).forEach(([key, presences]) => {
          if (presences.length > 0) {
            driverMap[key] = presences[0]
          }
        })
        setDrivers(driverMap)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Driver joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Driver left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track own presence (for drivers)
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user?.app_metadata.role === 'driver') {
            await channel.track({
              driver_id: user.id,
              driver_name: user.user_metadata.full_name,
              status: 'available',
              online_at: new Date().toISOString()
            })
          }
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  const driverCount = Object.keys(drivers).length

  return (
    <div>
      <h3>Active Drivers: {driverCount}</h3>
      <ul>
        {Object.entries(drivers).map(([id, driver]) => (
          <li key={id}>
            <span className={`status-${driver.status}`}>●</span>
            {driver.driver_name} - {driver.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

### Method 6: send()

**Purpose**: Send broadcast message to channel

**When to use**:
- Send location updates
- Send chat messages
- Send notifications
- Send ephemeral data

**Syntax**:
```typescript
channel.send({
  type: 'broadcast',
  event: string,
  payload: any
})
```

**Returns**: `Promise<'ok' | 'timed out' | 'rate limited'>`

**Example (Chat System)**:
```typescript
// components/order-chat.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface ChatMessage {
  user_id: string
  user_name: string
  message: string
  timestamp: string
}

export function OrderChat({ orderId }: { orderId: string }) {
  const supabase = createBrowserClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    const chatChannel = supabase
      .channel(`order:${orderId}:chat`)
      .on(
        'broadcast',
        { event: 'message' },
        (payload) => {
          setMessages(prev => [...prev, payload.payload])
        }
      )
      .subscribe()

    setChannel(chatChannel)

    return () => {
      chatChannel.unsubscribe()
    }
  }, [orderId, supabase])

  async function sendMessage() {
    if (!input.trim() || !channel) return

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const message: ChatMessage = {
      user_id: user.id,
      user_name: user.user_metadata.full_name || 'User',
      message: input,
      timestamp: new Date().toISOString()
    }

    const status = await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    })

    if (status === 'ok') {
      setInput('')
    } else {
      alert('Failed to send message')
    }
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className="message">
            <strong>{msg.user_name}:</strong> {msg.message}
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}
```

---

### Method 7: track()

**Purpose**: Track user presence state in channel

**When to use**:
- Mark driver as available/busy
- Show online status
- Track collaborative editing
- Display active users

**Syntax**:
```typescript
await channel.track(state: object)
```

**Example (Driver Status Tracking)**:
```typescript
// app/driver/status/tracker.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

type DriverStatus = 'available' | 'busy' | 'offline'

export function DriverStatusTracker({ driverId }: { driverId: string }) {
  const supabase = createBrowserClient()
  const [status, setStatus] = useState<DriverStatus>('offline')
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    const presenceChannel = supabase
      .channel('drivers:presence')
      .subscribe(async (subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          // Track initial status
          await presenceChannel.track({
            driver_id: driverId,
            status: 'available',
            online_at: new Date().toISOString()
          })
          setStatus('available')
        }
      })

    setChannel(presenceChannel)

    return () => {
      presenceChannel.unsubscribe()
    }
  }, [driverId, supabase])

  async function updateStatus(newStatus: DriverStatus) {
    if (!channel) return

    await channel.track({
      driver_id: driverId,
      status: newStatus,
      updated_at: new Date().toISOString()
    })

    setStatus(newStatus)
  }

  return (
    <div>
      <h3>Your Status: {status}</h3>
      <button onClick={() => updateStatus('available')}>Available</button>
      <button onClick={() => updateStatus('busy')}>Busy</button>
      <button onClick={() => updateStatus('offline')}>Offline</button>
    </div>
  )
}
```

---

### Method 8: untrack()

**Purpose**: Stop tracking presence (mark as offline)

**Syntax**:
```typescript
await channel.untrack()
```

**Example**:
```typescript
// Untrack when driver goes offline
await channel.untrack()
```

---

### Method 9: unsubscribe()

**Purpose**: Leave channel and stop receiving messages

**When to use**:
- Component unmount
- User navigates away
- Feature disabled
- Clean up resources

**Syntax**:
```typescript
await channel.unsubscribe()
```

**Example (Cleanup Pattern)**:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('my-channel')
    .subscribe()

  // Cleanup function
  return () => {
    channel.unsubscribe()
  }
}, [])
```

---

### Method 10: removeChannel()

**Purpose**: Remove channel from client (cleanup)

**Syntax**:
```typescript
supabase.removeChannel(channel)
```

**Example**:
```typescript
const channel = supabase.channel('temp-channel')
await channel.subscribe()

// Later...
await channel.unsubscribe()
supabase.removeChannel(channel)
```

---

## Use Cases for Georgian Distribution System

### Use Case 1: Real-Time Order Board

**Scenario**: Restaurant sees new orders appear instantly

**Implementation**:
```typescript
// app/dashboard/restaurant/order-board.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function OrderBoard({ restaurantId }: { restaurantId: string }) {
  const supabase = createBrowserClient()
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    // Initial fetch
    supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))

    // Subscribe to changes
    const channel = supabase
      .channel(`restaurant:${restaurantId}:orders`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          setOrders(prev => [payload.new, ...prev])
          playNotificationSound()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          setOrders(prev => prev.map(order =>
            order.id === payload.new.id ? payload.new : order
          ))
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [restaurantId, supabase])

  return (
    <div className="order-board">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

function playNotificationSound() {
  new Audio('/sounds/new-order.mp3').play()
}
```

---

### Use Case 2: Live Driver Map

**Scenario**: Track all active driver locations on map

**Implementation**:
```typescript
// components/driver-map.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface DriverLocation {
  driver_id: string
  latitude: number
  longitude: number
}

export function DriverMap() {
  const supabase = createBrowserClient()
  const [locations, setLocations] = useState<Record<string, DriverLocation>>({})

  useEffect(() => {
    const channel = supabase
      .channel('drivers:all-locations')
      .on(
        'broadcast',
        { event: 'location-update' },
        (payload) => {
          const location = payload.payload as DriverLocation
          setLocations(prev => ({
            ...prev,
            [location.driver_id]: location
          }))
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  return (
    <div className="map-container">
      {/* Render map with markers for each driver */}
      {Object.values(locations).map(location => (
        <Marker key={location.driver_id} location={location} />
      ))}
    </div>
  )
}
```

---

## Security Considerations

### 1. Row-Level Security Integration

**Risk**: Users seeing unauthorized database changes

**Mitigation**:
- RLS policies automatically enforced
- Only rows user can access are broadcast
- No manual filtering needed

**Example**:
```sql
-- RLS policy ensures restaurants only see their orders
CREATE POLICY "Restaurants see own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = restaurant_id);

-- Realtime automatically respects this policy
```

---

### 2. Channel Authorization

**Risk**: Unauthorized users joining channels

**Mitigation**:
- Use RLS for Postgres Changes
- Implement custom auth for Broadcast/Presence

**Example**:
```typescript
// Only allow restaurants to join their channel
const { data: { user } } = await supabase.auth.getUser()

if (user?.app_metadata.role !== 'restaurant') {
  throw new Error('Unauthorized')
}

const channel = supabase.channel(`restaurant:${user.id}:orders`)
```

---

## Performance Optimization

### 1. Connection Pooling

**Problem**: Too many WebSocket connections

**Solution**: Reuse channels across components

```typescript
// lib/realtime-manager.ts
class RealtimeManager {
  private channels = new Map()

  getChannel(name: string) {
    if (!this.channels.has(name)) {
      const channel = supabase.channel(name)
      this.channels.set(name, channel)
    }
    return this.channels.get(name)
  }

  cleanup() {
    this.channels.forEach(channel => channel.unsubscribe())
    this.channels.clear()
  }
}
```

---

### 2. Message Throttling

**Problem**: Too many broadcast messages

**Solution**: Throttle location updates

```typescript
import { throttle } from 'lodash'

const sendLocation = throttle((channel, location) => {
  channel.send({
    type: 'broadcast',
    event: 'location-update',
    payload: location
  })
}, 5000)  // Max once per 5 seconds
```

---

## Best Practices

1. **Always unsubscribe on unmount**
2. **Handle all subscription states**
3. **Use filters to reduce messages**
4. **Implement reconnection logic**
5. **Throttle high-frequency updates**

---

## Troubleshooting

### Issue 1: Channel Not Receiving Messages

**Solution**: Check RLS policies and filters

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check if user can access rows
SELECT * FROM orders WHERE restaurant_id = auth.uid();
```

---

## TypeScript Types

```typescript
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Order = Database['public']['Tables']['orders']['Row']

type OrderChangePayload = RealtimePostgresChangesPayload<Order>
```

---

## Related Documentation

- [01-supabase-auth.md](./01-supabase-auth.md) - JWT authentication for Realtime
- [05-row-level-security.md](./05-row-level-security.md) - RLS policies for Postgres Changes

---

## Official Resources

- **Docs**: https://supabase.com/docs/guides/realtime
- **GitHub**: https://github.com/supabase/realtime

---

*Last Updated: October 29, 2025*  
*Supabase Realtime Version: Latest*  
*Project: Georgian Distribution System*
