# Supabase CLI: Complete Technical Reference

## Overview

Supabase CLI is a command-line interface tool for managing local Supabase development environments, database migrations, Edge Functions, and deployment workflows. For the Georgian Distribution System, the CLI enables version-controlled database schema changes, local testing, and seamless deployment to the production Supabase instance at data.greenland77.ge.

### Key Capabilities

The Supabase CLI provides:
- **Local Development** - Run complete Supabase stack locally (PostgreSQL, Auth, Realtime, Storage)
- **Database Migrations** - Version-controlled schema changes with migration files
- **Type Generation** - Auto-generate TypeScript types from database schema
- **Edge Functions** - Develop and deploy serverless functions
- **CI/CD Integration** - Automate deployments with GitHub Actions
- **Database Seeding** - Populate test data for development

### Installation

```bash
# Install via npm
npm install -g supabase

# Install via Homebrew (macOS)
brew install supabase/tap/supabase

# Install via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Verify installation
supabase --version
```

---

## Core Concepts

### 1. Project Structure

```
Distribution-Managment/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── seed.sql                 # Development seed data
│   ├── migrations/              # Database migration files
│   │   ├── 20240101000000_initial_schema.sql
│   │   ├── 20240102000000_add_orders_table.sql
│   │   └── 20240103000000_add_rls_policies.sql
│   └── functions/               # Edge Functions
│       └── order-notification/
│           └── index.ts
├── .env.local                   # Local environment variables
└── package.json
```

### 2. Migration Lifecycle

1. **Create Migration** - `supabase migration new migration_name`
2. **Write SQL** - Edit migration file with schema changes
3. **Test Locally** - `supabase db reset` to test migration
4. **Deploy** - `supabase db push` to apply to production
5. **Generate Types** - `supabase gen types typescript` for TypeScript

### 3. Local vs Remote

- **Local**: Development environment on localhost
- **Remote**: Production instance (data.greenland77.ge)
- **Link**: Connect CLI to remote project with `supabase link`

---

## API Reference

### Command 1: supabase init

**Purpose**: Initialize Supabase project in current directory

**When to use**:
- Starting new project
- Adding Supabase to existing Next.js app
- Setting up local development environment

**Syntax:**
```bash
supabase init
```

**Output:**
```
Generated supabase/config.toml
Finished supabase init.
```

**Example (Initialize Georgian Distribution System):**
```bash
cd Distribution-Managment
supabase init

# Creates:
# - supabase/config.toml
# - supabase/seed.sql
# - .gitignore entries
```

**Configuration (supabase/config.toml):**
```toml
# Project settings
project_id = "your-project-ref"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://localhost"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://greenland77.ge"]
jwt_expiry = 3600
enable_signup = true

[realtime]
enabled = true
```

**Best Practices**:
- Commit `config.toml` to version control
- Use `.env.local` for secrets
- Configure `auth.site_url` for your domain

---

### Command 2: supabase start

**Purpose**: Start local Supabase stack (Docker containers)

**When to use**:
- Beginning development session
- Testing migrations locally
- Running local integration tests

**Syntax:**
```bash
supabase start
```

**Output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example (Start with Custom Port):**
```bash
# Start on default ports
supabase start

# Check status
supabase status

# View logs
supabase logs -f
```

**Troubleshooting**:
```bash
# Port already in use
supabase stop
docker ps  # Check for running containers
docker stop $(docker ps -q)  # Stop all containers

# Reset local database
supabase db reset

# Clean restart
supabase stop
supabase start
```

**Best Practices**:
- Run `supabase start` before development
- Check `supabase status` to verify services
- Use `supabase logs` for debugging

---

### Command 3: supabase db reset

**Purpose**: Reset local database to clean state and reapply migrations

**When to use**:
- Testing migrations from scratch
- Fixing migration errors
- Resetting to seed data

**Syntax:**
```bash
supabase db reset
```

**Example (Reset with Seed Data):**
```bash
# Reset database and run seed.sql
supabase db reset

# Skip seed data
supabase db reset --no-seed

# View what will be reset (dry run)
supabase db reset --dry-run
```

**Seed Data (supabase/seed.sql):**
```sql
-- Insert test restaurants
INSERT INTO public.restaurants (id, name, email, phone, address, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test Restaurant 1', 'restaurant1@test.ge', '+995555111111', 'Batumi, Georgia', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Test Restaurant 2', 'restaurant2@test.ge', '+995555222222', 'Tbilisi, Georgia', 'active');

-- Insert test products
INSERT INTO public.products (name, price, category, description, image_url)
VALUES
  ('Fresh Tomatoes', 5.99, 'vegetables', 'Organic tomatoes from local farms', 'https://example.com/tomato.jpg'),
  ('Chicken Breast', 12.50, 'meat', 'Fresh chicken breast', 'https://example.com/chicken.jpg');

-- Insert test orders
INSERT INTO public.orders (restaurant_id, status, total_price, delivery_address)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'pending', 25.50, 'Batumi, Georgia'),
  ('22222222-2222-2222-2222-222222222222', 'delivered', 45.00, 'Tbilisi, Georgia');
```

**Best Practices**:
- Use seed data for consistent test environment
- Reset before running integration tests
- Keep seed.sql in version control

---

### Command 4: supabase migration new

**Purpose**: Create new migration file for schema changes

**When to use**:
- Adding new tables
- Modifying columns
- Creating RLS policies
- Adding indexes

**Syntax:**
```bash
supabase migration new <migration_name>
```

**Example (Create Orders Table Migration):**
```bash
# Create migration file
supabase migration new create_orders_table

# Output: Created new migration at supabase/migrations/20240129120000_create_orders_table.sql
```

**Migration File Content:**
```sql
-- supabase/migrations/20240129120000_create_orders_table.sql

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'in_delivery', 'delivered', 'cancelled')),
  total_price DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX orders_restaurant_id_idx ON public.orders(restaurant_id);
CREATE INDEX orders_driver_id_idx ON public.orders(driver_id);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_created_at_idx ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Restaurants can view their own orders
CREATE POLICY "Restaurants can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = restaurant_id);

-- RLS Policy: Drivers can view assigned orders
CREATE POLICY "Drivers can view assigned orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = driver_id
    OR (auth.jwt() ->> 'role') = 'driver'
  );

-- RLS Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin');

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

**Test Migration Locally:**
```bash
# Apply migration to local database
supabase db reset

# Verify table created
psql postgresql://postgres:postgres@localhost:54322/postgres
\dt public.orders
\d public.orders
```

**Best Practices**:
- Use descriptive migration names
- One logical change per migration
- Include rollback instructions in comments
- Test locally before deploying

---

### Command 5: supabase db push

**Purpose**: Apply local migrations to remote database

**When to use**:
- Deploying schema changes to production
- Syncing local changes to remote
- After testing migrations locally

**Syntax:**
```bash
supabase db push
```

**Example (Deploy Migrations to Production):**
```bash
# Link to remote project (first time)
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push

# Output:
# Applying migration 20240129120000_create_orders_table.sql...
# Finished supabase db push.
```

**Safety Checks:**
```bash
# Dry run (see what will be applied)
supabase db push --dry-run

# Check remote migrations
supabase db remote list

# Check local migrations
supabase migration list
```

**Production Deployment Workflow:**
```bash
# 1. Test locally
supabase db reset
npm run test

# 2. Commit migrations
git add supabase/migrations/
git commit -m "feat: add orders table"

# 3. Deploy to production
supabase db push

# 4. Generate types for frontend
supabase gen types typescript --local > types/supabase.ts
git add types/supabase.ts
git commit -m "chore: update database types"
```

**Best Practices**:
- Always test migrations locally first
- Use `--dry-run` before production push
- Backup database before major changes
- Deploy during low-traffic windows

---

### Command 6: supabase gen types

**Purpose**: Generate TypeScript types from database schema

**When to use**:
- After schema changes
- Setting up new project
- Keeping types in sync with database

**Syntax:**
```bash
supabase gen types typescript [--local | --linked | --project-ref <project-ref>]
```

**Example (Generate Types for Georgian Distribution):**
```bash
# Generate from local database
supabase gen types typescript --local > types/supabase.ts

# Generate from remote database
supabase gen types typescript --linked > types/supabase.ts

# Generate from specific project
supabase gen types typescript --project-ref your-project-ref > types/supabase.ts
```

**Generated Types (types/supabase.ts):**
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          restaurant_id: string
          driver_id: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'cancelled'
          total_price: number
          delivery_address: string
          delivery_notes: string | null
          created_at: string
          updated_at: string
          delivered_at: string | null
        }
        Insert: {
          id?: string
          restaurant_id: string
          driver_id?: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'cancelled'
          total_price: number
          delivery_address: string
          delivery_notes?: string | null
          created_at?: string
          updated_at?: string
          delivered_at?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string
          driver_id?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_delivery' | 'delivered' | 'cancelled'
          total_price?: number
          delivery_address?: string
          delivery_notes?: string | null
          created_at?: string
          updated_at?: string
          delivered_at?: string | null
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

**Usage in Code:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Type-safe queries
const { data } = await supabase
  .from('orders')  // TypeScript knows 'orders' table exists
  .select('*')     // Returns Order[] type
  .eq('status', 'pending')  // TypeScript validates status values
```

**Automation (package.json):**
```json
{
  "scripts": {
    "types:generate": "supabase gen types typescript --local > types/supabase.ts",
    "types:remote": "supabase gen types typescript --linked > types/supabase.ts",
    "db:reset": "supabase db reset && npm run types:generate"
  }
}
```

**Best Practices**:
- Regenerate types after schema changes
- Commit types to version control
- Use types in all Supabase queries
- Automate type generation in CI/CD

---

### Command 7: supabase link

**Purpose**: Link CLI to remote Supabase project

**When to use**:
- First time setup on new machine
- Connecting to production instance
- Before running `db push` or `db pull`

**Syntax:**
```bash
supabase link --project-ref <project-ref>
```

**Example (Link to Georgian Distribution Production):**
```bash
# Get project ref from Supabase Dashboard
# Settings > General > Reference ID

supabase link --project-ref abcdefghijklmno

# Enter database password when prompted
# Password: ******************

# Output: Linked to project abcdefghijklmno
```

**Verify Link:**
```bash
# Check linked project
supabase projects list

# Test connection
supabase db remote list
```

**Multiple Environments:**
```bash
# Link to staging
supabase link --project-ref staging-ref

# Link to production
supabase link --project-ref production-ref

# Switch between environments
supabase link --project-ref staging-ref
```

**Best Practices**:
- Store project ref in `.env.local` (not in version control)
- Document which project ref is staging/production
- Use different accounts for different environments

---

### Command 8: supabase db pull

**Purpose**: Pull remote database schema to local migrations

**When to use**:
- Syncing remote changes to local
- Another developer pushed changes
- Starting on existing project

**Syntax:**
```bash
supabase db pull
```

**Example (Pull Remote Schema):**
```bash
# Pull remote schema
supabase db pull

# Creates migration file:
# supabase/migrations/20240129123000_remote_schema.sql

# Review changes
cat supabase/migrations/20240129123000_remote_schema.sql

# Apply to local
supabase db reset
```

**Conflict Resolution:**
```bash
# If local and remote differ
supabase db pull

# Review generated migration
# Resolve conflicts manually
# Delete incorrect migration if needed
rm supabase/migrations/20240129123000_remote_schema.sql

# Re-pull if needed
supabase db pull
```

**Best Practices**:
- Pull before starting new features
- Review pulled migrations carefully
- Resolve conflicts before committing
- Communicate with team about schema changes

---

### Command 9: supabase functions new

**Purpose**: Create new Edge Function

**When to use**:
- Creating serverless functions
- Webhook handlers
- Background jobs
- API integrations

**Syntax:**
```bash
supabase functions new <function-name>
```

**Example (Order Notification Function):**
```bash
# Create function
supabase functions new order-notification

# Created: supabase/functions/order-notification/index.ts
```

**Function Code (supabase/functions/order-notification/index.ts):**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Parse request
    const { orderId } = await req.json()

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        restaurant:restaurants(name, phone),
        driver:drivers(full_name, phone)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    // Send notifications (Twilio, SendGrid, etc.)
    // ... notification logic

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**Test Locally:**
```bash
# Serve function locally
supabase functions serve order-notification

# Test with curl
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/order-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"orderId":"123"}'
```

**Deploy Function:**
```bash
# Deploy to production
supabase functions deploy order-notification

# Set environment variables
supabase secrets set TWILIO_AUTH_TOKEN=your-token

# View logs
supabase functions logs order-notification
```

**Best Practices**:
- Use environment variables for secrets
- Test locally before deploying
- Handle errors gracefully
- Set appropriate timeouts

---

### Command 10: supabase db diff

**Purpose**: Generate SQL diff between local and remote databases

**When to use**:
- Reviewing schema changes
- Creating migration from manual changes
- Verifying migrations before deployment

**Syntax:**
```bash
supabase db diff [options]
```

**Example (Generate Migration from Manual Changes):**
```bash
# Make changes in Supabase Studio (e.g., add column)

# Generate migration from changes
supabase db diff -f add_order_notes_column

# Created: supabase/migrations/20240129124000_add_order_notes_column.sql

# Review generated SQL
cat supabase/migrations/20240129124000_add_order_notes_column.sql
```

**Output:**
```sql
ALTER TABLE public.orders ADD COLUMN order_notes TEXT;
```

**Compare Local vs Remote:**
```bash
# Show differences without creating migration
supabase db diff

# Include schema changes
supabase db diff --schema auth,public,storage

# Use linked project
supabase db diff --linked
```

**Best Practices**:
- Use for migrating from Studio changes
- Review generated SQL before committing
- Prefer writing migrations manually for complex changes
- Use diff to verify migrations match expectations

---

## Use Cases for Georgian Distribution System

### Use Case 1: Setting Up Local Development

**Scenario**: New developer joins team and needs local environment

**Workflow:**
```bash
# 1. Clone repository
git clone https://github.com/your-org/distribution-management.git
cd Distribution-Managment

# 2. Install dependencies
npm install

# 3. Initialize Supabase
supabase init

# 4. Start local Supabase
supabase start

# 5. Link to production (optional, for pulling schema)
supabase link --project-ref your-project-ref

# 6. Pull remote schema
supabase db pull

# 7. Reset database with migrations
supabase db reset

# 8. Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts

# 9. Start Next.js dev server
npm run dev

# Local URLs:
# - Next.js: http://localhost:3000
# - Supabase Studio: http://localhost:54323
# - Supabase API: http://localhost:54321
```

---

### Use Case 2: Creating and Deploying Migration

**Scenario**: Add new `order_ratings` table for customer feedback

**Workflow:**
```bash
# 1. Create migration
supabase migration new add_order_ratings

# 2. Edit migration file
# supabase/migrations/20240129125000_add_order_ratings.sql
```

```sql
-- Create order_ratings table
CREATE TABLE public.order_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(order_id)  -- One rating per order
);

-- Index for faster queries
CREATE INDEX order_ratings_order_id_idx ON public.order_ratings(order_id);
CREATE INDEX order_ratings_restaurant_id_idx ON public.order_ratings(restaurant_id);

-- Enable RLS
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurants can view their ratings
CREATE POLICY "Restaurants view own ratings"
  ON public.order_ratings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = restaurant_id);

-- Policy: Customers can insert ratings for their orders
CREATE POLICY "Customers insert ratings"
  ON public.order_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id
      AND restaurant_id = auth.uid()
    )
  );
```

```bash
# 3. Test locally
supabase db reset

# 4. Verify in Studio
open http://localhost:54323

# 5. Generate types
supabase gen types typescript --local > types/supabase.ts

# 6. Test in Next.js app
npm run dev

# 7. Commit changes
git add supabase/migrations/ types/
git commit -m "feat: add order ratings table"

# 8. Deploy to production
supabase db push

# 9. Generate production types
supabase gen types typescript --linked > types/supabase.ts
git add types/
git commit -m "chore: update types from production"
```

---

### Use Case 3: CI/CD Pipeline with GitHub Actions

**Scenario**: Automate migrations and type generation on deployment

**GitHub Actions Workflow (.github/workflows/deploy.yml):**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Supabase project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Push database migrations
        run: supabase db push

      - name: Generate TypeScript types
        run: |
          supabase gen types typescript --linked > types/supabase.ts
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add types/supabase.ts
          git diff --quiet && git diff --staged --quiet || \
            (git commit -m "chore: update database types" && git push)

      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

**Setup GitHub Secrets:**
```bash
# Generate Supabase access token
supabase login

# Copy token and add to GitHub:
# Settings > Secrets > Actions > New repository secret
# SUPABASE_ACCESS_TOKEN: sbp_...
# SUPABASE_PROJECT_REF: your-project-ref
```

---

## Security Considerations

### 1. Protect Service Role Key

**Risk**: Service role key bypass RLS and has full access

**Mitigation**:
```bash
# Store in .env.local (never commit)
echo "SUPABASE_SERVICE_ROLE_KEY=your-key" >> .env.local
echo ".env.local" >> .gitignore

# Use GitHub Secrets for CI/CD
# Never log or expose service role key
```

---

### 2. Validate Migrations Before Deployment

**Risk**: Bad migration corrupts production database

**Mitigation**:
```bash
# Always test locally first
supabase db reset
npm run test

# Use dry-run to preview
supabase db push --dry-run

# Backup before major migrations
# (Use Supabase Dashboard > Database > Backups)
```

---

### 3. Use Migration Locks

**Risk**: Multiple developers deploy conflicting migrations

**Mitigation**:
```bash
# Check migration status before creating new one
supabase migration list

# Pull remote changes first
supabase db pull

# Coordinate with team via Slack/GitHub
```

---

## Performance Optimization

### 1. Efficient Seed Data

**Problem**: Large seed files slow down `db reset`

**Solution**:
```sql
-- supabase/seed.sql
-- Use COPY for bulk inserts
COPY public.products (name, price, category) FROM STDIN;
Product 1	10.99	vegetables
Product 2	15.50	meat
Product 3	8.99	dairy
\.

-- Disable triggers during seed
ALTER TABLE public.orders DISABLE TRIGGER ALL;
INSERT INTO public.orders (...) VALUES (...);
ALTER TABLE public.orders ENABLE TRIGGER ALL;
```

---

### 2. Optimize Migration Files

**Problem**: Slow migration execution

**Solution**:
```sql
-- Create indexes concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY orders_created_at_idx 
  ON public.orders(created_at DESC);

-- Use constraints instead of triggers when possible
ALTER TABLE public.orders
  ADD CONSTRAINT orders_total_price_positive
  CHECK (total_price > 0);
```

---

## Best Practices

### 1. **Migration Naming Convention**

```bash
# Use descriptive names
supabase migration new add_order_ratings_table  # ✅
supabase migration new update                    # ❌

# Include ticket number for traceability
supabase migration new DIST-123_add_order_ratings
```

---

### 2. **Idempotent Migrations**

```sql
-- Use IF NOT EXISTS for safety
CREATE TABLE IF NOT EXISTS public.orders (...);

-- Drop and recreate policies
DROP POLICY IF EXISTS "policy_name" ON public.orders;
CREATE POLICY "policy_name" ...;
```

---

### 3. **Document Complex Migrations**

```sql
-- Migration: Add order rating system
-- Ticket: DIST-123
-- Author: Your Name
-- Date: 2024-01-29

-- This migration adds customer ratings for orders
-- Allows customers to rate orders 1-5 stars

CREATE TABLE public.order_ratings (...);
```

---

## Troubleshooting

### Issue 1: "Port already in use"

**Symptoms**: `supabase start` fails with port error

**Solution**:
```bash
# Check what's using ports
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Stop Supabase
supabase stop

# Stop all Docker containers
docker stop $(docker ps -q)

# Start again
supabase start
```

---

### Issue 2: Migration fails on remote

**Symptoms**: `supabase db push` errors

**Solution**:
```bash
# Check migration syntax locally first
supabase db reset

# Review migration file
cat supabase/migrations/latest_migration.sql

# Test with psql
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/latest_migration.sql

# If still fails, rollback migration
# Delete migration file
rm supabase/migrations/latest_migration.sql

# Pull remote state
supabase db pull
```

---

### Issue 3: Type generation fails

**Symptoms**: `supabase gen types` produces errors

**Solution**:
```bash
# Ensure database is running
supabase status

# Check for schema errors
psql postgresql://postgres:postgres@localhost:54322/postgres
\dt public.*

# Regenerate with verbose output
supabase gen types typescript --local --debug > types/supabase.ts

# If still fails, check config.toml
# Ensure correct schemas are listed
```

---

## Related Documentation

- [07-database-design.md](./07-database-design.md) - Schema design and migrations
- [05-row-level-security.md](./05-row-level-security.md) - RLS policies in migrations
- [09-integration-patterns.md](./09-integration-patterns.md) - Using generated types in Next.js

---

## Official Resources

- **Official Docs**: https://supabase.com/docs/guides/cli
- **GitHub**: https://github.com/supabase/cli
- **CLI Reference**: https://supabase.com/docs/reference/cli

---

*Last Updated: October 29, 2025*  
*Supabase CLI Version: Latest*  
*Project: Georgian Distribution System*
