# Supabase Client JS: Complete Reference

## Overview
@supabase/supabase-js is the official TypeScript/JavaScript SDK for Supabase, providing methods for Auth, Database, Storage, Realtime, and Edge Functions.

## Installation
```bash
npm install @supabase/supabase-js
```

## Client Setup

### Browser Client
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (Next.js App Router)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
}
```

## Core Methods

### Database
```typescript
// Query
await supabase.from('orders').select('*')

// Insert
await supabase.from('orders').insert({ ... })

// Update
await supabase.from('orders').update({ ... }).eq('id', id)

// Delete
await supabase.from('orders').delete().eq('id', id)
```

### Auth
```typescript
// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()

// Get user
await supabase.auth.getUser()

// Update user
await supabase.auth.updateUser({ data: { ... } })
```

### Storage
```typescript
// Upload
await supabase.storage.from('bucket').upload(path, file)

// Download
await supabase.storage.from('bucket').download(path)

// Get URL
supabase.storage.from('bucket').getPublicUrl(path)
```

### Realtime
```typescript
const channel = supabase
  .channel('orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
    console.log(payload)
  })
  .subscribe()
```

## TypeScript Support
```typescript
import { Database } from '@/types/supabase'

const supabase = createClient<Database>()

// Fully typed queries
const { data } = await supabase.from('orders').select('*')
// data is typed as Order[]
```

## Best Practices
1. Use TypeScript for type safety
2. Handle errors explicitly
3. Close realtime channels on unmount
4. Use server client for SSR
5. Never expose service_role key

## Official Docs
https://supabase.com/docs/reference/javascript

*Last Updated: October 29, 2025*
