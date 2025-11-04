# Supabase Integration

> **Supabase ინტეგრაცია** | Database and backend services configuration

---

## 🗄️ Overview

Supabase provides our complete backend infrastructure including database, authentication, real-time updates, and file storage.

---

## 🌍 Dual Environment Setup

### Development Environment
- **URL:** `https://akxmacfsltzhbnunoepb.supabase.co`
- **Type:** Official Supabase hosted instance
- **Purpose:** Fast iteration, team collaboration
- **Database:** PostgreSQL 15 with full Supabase dashboard access

### Production Environment
- **URL:** `https://data.greenland77.ge`
- **Type:** Self-hosted Supabase on VPS
- **Purpose:** Data sovereignty, cost control
- **Database:** PostgreSQL 15 self-managed

---

## 🔧 Configuration

### Environment Variables

```bash
# frontend/.env.local (Development)
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-here]

# frontend/.env.production (Production)
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
```

### Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)
```

---

## 🔐 Authentication

### Login

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

if (error) {
  console.error('Login failed:', error.message)
} else {
  console.log('Logged in:', data.user)
}
```

### Logout

```typescript
const { error } = await supabase.auth.signOut()
```

### Get Current Session

```typescript
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  console.log('User:', session.user)
  console.log('Role:', session.user.user_metadata.role)
}
```

### Password Reset

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://greenland77.ge/reset-password',
  }
)
```

---

## 🗄️ Database Operations

### Select Data

```typescript
// Get all orders (RLS applied)
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })

// Get orders with filters
const { data: pending } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'pending')
  .gte('created_at', '2025-01-01')

// Get orders with related data
const { data: ordersWithItems } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (
      *,
      products (*)
    )
  `)
```

### Insert Data

```typescript
const { data: newOrder, error } = await supabase
  .from('orders')
  .insert({
    restaurant_id: 'uuid-here',
    status: 'pending',
    notes: 'Delivery instructions',
  })
  .select()
  .single()
```

### Update Data

```typescript
const { data, error } = await supabase
  .from('orders')
  .update({ status: 'confirmed' })
  .eq('id', 'order-uuid')
  .select()
  .single()
```

### Delete Data

```typescript
const { error } = await supabase
  .from('orders')
  .delete()
  .eq('id', 'order-uuid')
```

---

## 🔄 Real-time Subscriptions

### Subscribe to Table Changes

```typescript
const channel = supabase
  .channel('orders-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'orders',
      filter: `restaurant_id=eq.${userId}`, // Optional filter
    },
    (payload) => {
      console.log('Change received:', payload)
      // Invalidate queries, update UI, etc.
    }
  )
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
```

### Subscribe to Specific Events

```typescript
// Listen only to inserts
supabase
  .channel('new-orders')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
    },
    handleNewOrder
  )
  .subscribe()

// Listen only to updates
supabase
  .channel('order-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders',
    },
    handleOrderUpdate
  )
  .subscribe()
```

---

## 📁 Storage

### Upload File

```typescript
const file = event.target.files[0]

const { data, error } = await supabase.storage
  .from('products')
  .upload(`public/${file.name}`, file, {
    cacheControl: '3600',
    upsert: false,
  })

if (data) {
  const publicUrl = supabase.storage
    .from('products')
    .getPublicUrl(data.path).data.publicUrl
}
```

### Download File

```typescript
const { data, error } = await supabase.storage
  .from('products')
  .download('public/image.jpg')
```

### Delete File

```typescript
const { error } = await supabase.storage
  .from('products')
  .remove(['public/image.jpg'])
```

---

## 🔍 Advanced Queries

### Count Records

```typescript
const { count, error } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending')
```

### Pagination

```typescript
const PAGE_SIZE = 50

const { data, error } = await supabase
  .from('orders')
  .select('*')
  .range(0, PAGE_SIZE - 1) // First page
  .order('created_at', { ascending: false })
```

### Full-Text Search

```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .textSearch('name', 'apple', {
    type: 'websearch',
    config: 'english',
  })
```

---

## 🛠️ MCP Integration

The project uses Supabase MCP server for database operations during development.

### MCP Configuration

Located in `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://akxmacfsltzhbnunoepb.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[service-role-key]"
      }
    }
  }
}
```

### Using MCP

The Supabase MCP server allows Claude to:
- Query database schema
- Execute SQL queries
- Create/modify tables
- Manage RLS policies
- View table data

---

## 📊 Database Dashboard

### Development Dashboard

Access at: `https://app.supabase.com/project/akxmacfsltzhbnunoepb`

Features:
- Table editor
- SQL editor
- Authentication management
- Storage management
- Real-time inspector
- API documentation
- Database logs

### Production Dashboard

Self-hosted Supabase Studio (if configured):
- Access at: `https://data.greenland77.ge:3000`
- Limited to admin access
- Same features as hosted version

---

## 🔒 Security Best Practices

### RLS Policies

Always rely on RLS for security:

```typescript
// ✅ Good - RLS enforced
const { data } = await supabase
  .from('orders')
  .select('*')
// Only returns orders user has access to

// ❌ Bad - Bypassing RLS (never do this)
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('restaurant_id', untrustedUserId) // Don't trust client input
```

### Service Role Key

**NEVER** expose service role key in frontend:

```typescript
// ❌ NEVER DO THIS
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // ❌ This bypasses RLS!
)

// ✅ Use service role only in server-side code
// backend/api/admin-operations.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ✅ Server-side only
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

---

## 🐛 Troubleshooting

### Connection Issues

```typescript
// Test connection
const { data, error } = await supabase
  .from('profiles')
  .select('count')
  .limit(1)

if (error) {
  console.error('Connection failed:', error.message)
}
```

### RLS Policy Issues

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View policies for a table
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

### Real-time Not Working

```typescript
// Check channel status
const channel = supabase.channel('test')

channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected!')
  }
  if (status === 'CHANNEL_ERROR') {
    console.error('Connection failed')
  }
})
```

---

## 📚 Resources

- **Supabase Docs:** https://supabase.com/docs
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **Realtime:** https://supabase.com/docs/guides/realtime
- **Storage:** https://supabase.com/docs/guides/storage

---

**Last Updated:** 2025-11-03
**Supabase Version:** Latest
**Database:** PostgreSQL 15+
