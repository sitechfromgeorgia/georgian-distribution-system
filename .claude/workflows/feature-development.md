# Feature Development Workflow

> **ახალი ფუნქციის დამატების პროცესი** | Complete process for developing new features

---

## 🎯 Overview

This workflow guides you through the complete process of developing a new feature from specification to deployment.

---

## 📋 Pre-Development Phase

### 1. Feature Specification

**Location:** `specs/{feature-number}-{feature-name}/`

**Create the following files:**

```bash
specs/
└── 00X-feature-name/
    ├── README.md          # Feature overview
    ├── plan.md            # Implementation plan
    ├── tasks.md           # Task breakdown
    ├── quickstart.md      # Setup instructions
    ├── research.md        # Research & decisions
    ├── data-model.md      # Database schema changes
    └── contracts/         # API contracts
        └── api-spec.json  # OpenAPI specification
```

**Use templates from:** `.specify/templates/`

### 2. Feature Analysis

**Questions to answer:**

- [ ] What problem does this feature solve?
- [ ] Who are the users? (Admin/Restaurant/Driver/Demo)
- [ ] What are the acceptance criteria?
- [ ] Are there dependencies on other features?
- [ ] What's the estimated complexity? (Small/Medium/Large)
- [ ] Are there any security considerations?
- [ ] What database changes are needed?
- [ ] What's the rollback strategy?

### 3. Technical Review

- [ ] Review `.claude/architecture.md` for system design
- [ ] Review `.claude/rules/coding-standards.md` for code quality
- [ ] Review `.claude/rules/security-requirements.md` for security
- [ ] Review `.claude/rules/database-guidelines.md` for DB changes
- [ ] Check for similar existing features to reuse patterns

---

## 🌿 Git Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch from main
git checkout -b {feature-number}-{feature-name}

# Example:
git checkout -b 002-restaurant-order-management
```

### 2. Branch Naming Convention

- Feature: `00X-feature-name` (e.g., `002-restaurant-order-management`)
- Bugfix: `fix/description` (e.g., `fix/order-status-update`)
- Hotfix: `hotfix/critical-issue` (e.g., `hotfix/auth-bypass`)

---

## 🔨 Development Phase

### Step 1: Database Changes (if needed)

```sql
-- Create migration file
-- database/migrations/00X_feature_name.sql

BEGIN;

-- 1. Create new tables
CREATE TABLE IF NOT EXISTS {table_name} (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add indexes
CREATE INDEX idx_{table}_{column} ON {table}({column});

-- 3. Enable RLS
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "admin_full_access" ON {table}
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 5. Add comments
COMMENT ON TABLE {table} IS 'Description of table purpose';

COMMIT;
```

**Testing:**
- [ ] Test migration on development database
- [ ] Verify RLS policies for each role
- [ ] Check index performance with `EXPLAIN ANALYZE`
- [ ] Test rollback migration

### Step 2: Type Definitions

```typescript
// src/types/{feature}.ts

import { Database } from './database'

// Extract types from Database
export type Feature = Database['public']['Tables']['feature_table']['Row']
export type FeatureInsert = Database['public']['Tables']['feature_table']['Insert']
export type FeatureUpdate = Database['public']['Tables']['feature_table']['Update']

// Define DTOs
export interface FeatureDTO {
  id: string
  name: string
  created_at: string
}

// Define form schemas with Zod
import { z } from 'zod'

export const FeatureCreateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
})

export type FeatureCreateInput = z.infer<typeof FeatureCreateSchema>
```

### Step 3: API Routes

```typescript
// src/app/api/features/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { FeatureCreateSchema } from '@/types/feature'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch data (RLS applied)
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // 3. Return response
    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/features error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. CSRF protection
    const csrfToken = request.headers.get('x-csrf-token')
    if (!csrfToken) {
      return NextResponse.json({ error: 'CSRF token required' }, { status: 403 })
    }

    // 3. Validation
    const body = await request.json()
    const validatedData = FeatureCreateSchema.parse(body)

    // 4. Business logic
    const { data, error } = await supabase
      .from('features')
      .insert(validatedData)
      .select()
      .single()

    if (error) throw error

    // 5. Return response
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('POST /api/features error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 4: React Hooks

```typescript
// src/hooks/useFeatures.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Feature, FeatureCreateInput } from '@/types/feature'

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Feature[]
    },
  })
}

export function useCreateFeature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FeatureCreateInput) => {
      const { data, error } = await supabase
        .from('features')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data as Feature
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] })
    },
  })
}

export function useRealtimeFeatures() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('features-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'features',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['features'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
```

### Step 5: UI Components

```typescript
// src/components/features/FeatureList.tsx

'use client'

import { useFeatures } from '@/hooks/useFeatures'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

export function FeatureList() {
  const { data: features, isLoading, error } = useFeatures()

  if (isLoading) {
    return <div>Loading features...</div>
  }

  if (error) {
    return (
      <Alert variant="destructive">
        Failed to load features. Please try again.
      </Alert>
    )
  }

  if (!features || features.length === 0) {
    return <p>No features found.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.id}>
          <CardHeader>
            <CardTitle>{feature.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {feature.description || 'No description'}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### Step 6: Page Integration

```typescript
// src/app/dashboard/features/page.tsx

import { FeatureList } from '@/components/features/FeatureList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Features - Georgian Distribution',
  description: 'Manage your features',
}

export default function FeaturesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Features</h1>
        <Link href="/dashboard/features/new">
          <Button>Add Feature</Button>
        </Link>
      </div>

      <FeatureList />
    </div>
  )
}
```

---

## 🧪 Testing Phase

### 1. Write Tests

```typescript
// src/hooks/useFeatures.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFeatures } from './useFeatures'
import { createWrapper } from '@/test-utils'

describe('useFeatures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches features successfully', async () => {
    const { result } = renderHook(() => useFeatures(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})
```

### 2. Run Tests

```bash
cd frontend
npm test

# Watch mode during development
npm test -- --watch

# Check coverage
npm test -- --coverage
```

### 3. Manual Testing Checklist

Test for each role:

**Admin:**
- [ ] Can view all features
- [ ] Can create new features
- [ ] Can edit features
- [ ] Can delete features

**Restaurant:**
- [ ] Can view relevant features
- [ ] Cannot access admin features
- [ ] UI responds correctly

**Driver:**
- [ ] Can view assigned features
- [ ] Cannot modify features
- [ ] Mobile-responsive

**Demo:**
- [ ] Read-only access works
- [ ] Limited data shown

---

## 📝 Documentation Phase

### 1. Update Documentation

- [ ] Update `.claude/context.md` with new feature status
- [ ] Add feature to main README if user-facing
- [ ] Document any new environment variables
- [ ] Update API documentation in `specs/` folder

### 2. Write Changelog Entry

```markdown
## [Version X.Y.Z] - 2025-11-03

### Added
- New feature: Restaurant Order Management
  - Bulk order operations
  - Advanced filtering and search
  - Order templates
  - Quick reorder functionality

### Changed
- Improved order status workflow
- Enhanced mobile responsiveness

### Fixed
- Order status update race condition
```

---

## 🔍 Code Review Phase

### Self-Review Checklist

- [ ] Code follows `.claude/rules/coding-standards.md`
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests written and passing
- [ ] No console.log statements left
- [ ] No commented-out code
- [ ] Error handling implemented
- [ ] Loading states handled
- [ ] Security considerations addressed
- [ ] RLS policies tested
- [ ] Performance optimized
- [ ] Mobile-responsive
- [ ] Accessibility standards met

### Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add restaurant order management

- Implement bulk order operations
- Add advanced filtering and search
- Create order templates feature
- Add quick reorder functionality
- Include comprehensive tests
- Update documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin 002-restaurant-order-management
```

---

## 🚀 Deployment Phase

### 1. Create Pull Request

```bash
# Use GitHub CLI
gh pr create \
  --title "feat: Restaurant Order Management" \
  --body "$(cat <<'EOF'
## Summary
Implements comprehensive restaurant order management features:
- ✅ Bulk order operations
- ✅ Advanced filtering and search
- ✅ Order templates
- ✅ Quick reorder functionality

## Test Plan
- [x] Unit tests passing (coverage: 85%)
- [x] Integration tests passing
- [x] Manual testing completed for all roles
- [x] RLS policies verified
- [x] Performance tested with 1000+ orders

## Screenshots
[Add screenshots of new features]

## Database Changes
- New `order_templates` table
- New indexes on `orders.restaurant_id` and `orders.created_at`
- New RLS policies for order templates

## Breaking Changes
None

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 2. PR Review Process

**Reviewer checks:**
- [ ] Code quality meets standards
- [ ] Tests are comprehensive
- [ ] Security concerns addressed
- [ ] Performance impact acceptable
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)

### 3. Merge to Main

```bash
# After approval, merge PR
gh pr merge --squash

# Pull latest main
git checkout main
git pull origin main

# Delete feature branch
git branch -d 002-restaurant-order-management
```

### 4. Deploy to Production

See `.claude/workflows/deployment.md` for full deployment process.

---

## 📊 Post-Deployment

### 1. Monitoring

- [ ] Check Sentry for new errors
- [ ] Monitor performance metrics
- [ ] Verify database query performance
- [ ] Check user feedback

### 2. Update Context

```bash
# Update .claude/context.md
- Mark feature as completed
- Update metrics
- Add to recent achievements
```

### 3. Celebrate! 🎉

Feature successfully deployed!

---

## 🔄 Iteration

Based on feedback:
1. Create follow-up tasks in `specs/` folder
2. Prioritize improvements
3. Repeat workflow for enhancements

---

## 📚 Resources

- **Coding Standards:** `.claude/rules/coding-standards.md`
- **Testing Guidelines:** `.claude/rules/testing-guidelines.md`
- **Security Requirements:** `.claude/rules/security-requirements.md`
- **Database Guidelines:** `.claude/rules/database-guidelines.md`
- **Architecture:** `.claude/architecture.md`

---

**Last Updated:** 2025-11-03
**Process Version:** 1.0.0
