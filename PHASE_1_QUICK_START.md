# Phase 1 - Quick Start Guide 🚀

Phase 1 დასრულებულია! ეს არის სწრაფი გზამკვლევი იმისთვის რომ დაიწყოთ მუშაობა განახლებულ სისტემასთან.

---

## ✅ რა შეიცვალა

### 1. Supabase Clients - ახალი იმპორტები

**❌ ძველი (აღარ გამოიყენოთ):**
```typescript
import { supabase } from '@/lib/supabase-client'
import { supabase } from '@/lib/supabase'
import { supabase } from '@/lib/supabase/client'
```

**✅ ახალი (გამოიყენეთ ეს):**
```typescript
// Browser/Client Components
import { createBrowserClient } from '@/lib/supabase'
const supabase = createBrowserClient()

// Server Components / API Routes
import { createServerClient } from '@/lib/supabase'
const supabase = await createServerClient()

// Admin operations (server-only)
import { createAdminClient } from '@/lib/supabase'
const supabase = createAdminClient()

// Types
import type { Database, Profile, Order } from '@/lib/supabase'
```

---

### 2. Logger - Console.log ჩანაცვლება

**❌ ძველი (აღარ გამოიყენოთ):**
```typescript
console.log('User logged in', { userId: '123' })
console.error('Error occurred', error)
```

**✅ ახალი (გამოიყენეთ ეს):**
```typescript
import { logger } from '@/lib/logger'

// Info logs
logger.info('User logged in', { userId: '123' })

// Errors
logger.error('API failed', error, { endpoint: '/api/orders' })

// Warnings
logger.warn('Slow query detected', { duration: 2500 })

// Debug (development only)
logger.debug('Detailed info', { data: complexObject })

// Performance tracking
const end = logger.performance.start('Database Query')
// ... do work ...
end() // Automatically logs duration

// Module-specific
const authLogger = createLogger('auth')
authLogger.info('Login attempt', { email: 'user@example.com' })
```

---

### 3. Middleware - Authentication & Authorization

ახლა middleware **ავტომატურად** ამოწმებს:
- ✅ Session refresh
- ✅ Authentication (protected routes)
- ✅ Role-based access (admin/restaurant/driver)
- ✅ CSRF protection (POST/PUT/PATCH/DELETE)
- ✅ Security headers

**დაცული გვერდები:**
- `/dashboard/*` - მოითხოვს authentication
- `/dashboard/admin/*` - მოითხოვს admin როლს
- `/dashboard/restaurant/*` - admin ან restaurant
- `/api/*` - CSRF protection + auth

**საჯარო გვერდები:**
- `/`, `/login`, `/signup`, `/reset-password`
- `/test`, `/diagnostic`, `/health`

---

## 🔧 Development Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
დარწმუნდით რომ `.env.local` შეიცავს:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # Server-side only
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Build
```bash
npm run build
```

### 5. Run Linter
```bash
npm run lint
```

**Note:** Linter ახლა გაფრთხილებებს აჩვენებს console.log გამოყენებისას!

---

## 📁 ფაილების სტრუქტურა

```
frontend/
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # ✅ Browser client
│   │   │   ├── server.ts       # ✅ Server client + Admin
│   │   │   └── index.ts        # ✅ Barrel export (NEW!)
│   │   ├── logger.ts           # ✅ Logging system (UPDATED!)
│   │   └── supabase.ts         # ⚠️ Deprecated (Phase 2-ში წაიშლება)
│   ├── middleware.ts           # ✅ Full SSR middleware (NEW!)
│   └── ...
├── scripts/
│   └── fix-supabase-imports.mjs # ✅ Automation script
├── next.config.ts              # ✅ Updated
├── eslint.config.mjs           # ✅ With console.log rules
└── ...
```

---

## 🛠️ Common Tasks

### დაამატე ახალი Server Component
```typescript
// app/my-page/page.tsx
import { createServerClient } from '@/lib/supabase'

export default async function MyPage() {
  const supabase = await createServerClient()
  const { data } = await supabase.from('profiles').select('*')

  return <div>{/* render data */}</div>
}
```

### დაამატე ახალი Client Component
```typescript
'use client'

import { createBrowserClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.from('profiles').select('*').then(({ data }) => {
      setData(data)
    })
  }, [])

  return <div>{/* render data */}</div>
}
```

### დაამატე Admin API Route
```typescript
// app/api/admin/users/route.ts
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()

  // Admin client bypasses RLS
  const { data, error } = await supabase
    .from('profiles')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
```

### Performance Tracking
```typescript
import { logger } from '@/lib/logger'

async function fetchOrders() {
  return await logger.performance.track('Fetch Orders', async () => {
    const supabase = createBrowserClient()
    return await supabase.from('orders').select('*')
  })
}
```

---

## 🧪 Testing

### Test Supabase Connection
```bash
# Navigate to diagnostic page
http://localhost:3000/diagnostic
```

### Test Middleware Protection
```bash
# Try accessing protected route without login
http://localhost:3000/dashboard

# Should redirect to login with redirect parameter
http://localhost:3000/login?redirect=/dashboard
```

---

## 🐛 Troubleshooting

### Build Warnings: "supabase is not exported"

**მიზეზი:** რამდენიმე ფაილი ცდილობს იმპორტირებას `{ supabase }` singleton-ის.

**გამოსწორება:** შეცვალე იმპორტი:
```typescript
// ❌ ძველი
import { supabase } from '@/lib/supabase'

// ✅ ახალი
import { createBrowserClient } from '@/lib/supabase'
const supabase = createBrowserClient()
```

### Middleware არ მუშაობს

**შემოწმება:**
1. `.env.local` შეიცავს `NEXT_PUBLIC_SUPABASE_URL` და `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Development server restart: `npm run dev`
3. Clear `.next` cache: `rm -rf .next`

### Logger არ გამოაქვს logs

**მიზეზი:** Production-ში logging გათიშულია.

**გამოსწორება:** დაამატე `.env.local`-ში:
```env
NEXT_PUBLIC_ENABLE_LOGGING=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

---

## 📚 დოკუმენტაცია

- **Phase 1 Completion Report:** [PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md)
- **Cleanup Instructions:** [CLEANUP_INSTRUCTIONS.md](./CLEANUP_INSTRUCTIONS.md)
- **Supabase Client Docs:** [src/lib/supabase/client.ts](../frontend/src/lib/supabase/client.ts)
- **Middleware Docs:** [src/middleware.ts](../frontend/src/middleware.ts)
- **Logger Docs:** [src/lib/logger.ts](../frontend/src/lib/logger.ts)

---

## ✅ Checklist - დაწყების წინ

- [ ] `npm install` გაშვებული
- [ ] `.env.local` შემოწმებული
- [ ] `npm run build` წარმატებული
- [ ] იმპორტები განახლებული (`createBrowserClient` / `createServerClient`)
- [ ] `console.log` ჩანაცვლებული `logger`-ით (არასავალდებულო, მაგრამ რეკომენდებული)

---

## 🚀 შემდეგი ნაბიჯები (Phase 2)

როდესაც მზად იქნები გასაგრძელებლად:

1. **TypeScript Strict Mode** - სრული type safety
2. **Security Headers** - CSP, HSTS დამატება
3. **Server Components Migration** - performance გაუმჯობესება
4. **Console.log Replacement** - ყველა 105 ფაილის განახლება
5. **Test Suite** - 70%+ coverage

---

**გილოცავ! სისტემა ახლა გაცილებით სუფთა და იდეალურია! 🎉**

**კითხვები?** გადახედე [PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md)-ს დეტალებისთვის.
