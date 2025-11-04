# Georgian Distribution System - Supabase CLI Setup Guide

## Overview

This directory contains the complete Supabase CLI configuration for the Georgian Distribution System, enabling local development, testing, and deployment of the backend infrastructure.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** (v22+ recommended)
- **npm** or **yarn**
- **Docker** (for local Supabase services)
- **Supabase CLI** installed

### Installing Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

## 🚀 Quick Start

### 1. Login to Supabase

```bash
supabase login
```

This will open your browser and ask for authentication. Follow the prompts to complete login.

### 2. Initialize Local Project

```bash
# From the project root directory
supabase init

# Link to your cloud project (optional for local development)
supabase link --project-ref akxmacfsltzhbnunoepb
```

### 3. Start Local Services

```bash
# Start all Supabase services locally
supabase start

# Expected output:
# Started supabase local development setup.
#          API URL: http://localhost:54321
#          Studio URL: http://localhost:54323
# Inbucket URL: http://localhost:54324
#          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

### 4. Apply Migrations

```bash
# Apply database migrations
supabase db reset

# Or apply specific migration
supabase db push
```

### 5. Generate TypeScript Types

```bash
# Generate TypeScript types for frontend
supabase gen types typescript --local > ../frontend/src/types/database.types.ts
```

## 📁 Project Structure

```
supabase/
├── config.toml                 # Supabase CLI configuration
├── migrations/                 # Database migration files
│   ├── 20251102_initial_schema.sql
│   └── 20251103_seed_data.sql
├── functions/                  # Edge Functions
│   ├── _shared/               # Shared utilities
│   │   └── cors.ts
│   ├── webhook-handler/       # Webhook processing
│   ├── order-processor/       # Order management
│   └── product-manager/       # Product operations
└── types/                     # Generated TypeScript types
    └── database.types.ts
```

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | Georgian Support |
|-------|---------|------------------|
| `profiles` | User profiles with RBAC | ✅ Names, restaurants |
| `products` | Product catalog | ✅ Bilingual content |
| `orders` | Order management | ✅ Full lifecycle |
| `order_items` | Order line items | ✅ Pricing details |
| `notifications` | User notifications | ✅ Georgian messages |
| `demo_sessions` | Demo functionality | ✅ Testing support |

### User Roles

- **admin**: Full system access
- **restaurant**: Order management
- **driver**: Delivery operations
- **demo**: Testing and demonstrations

### Georgian Localization

All user-facing content supports both English and Georgian:

```sql
-- Products support bilingual names and descriptions
name TEXT,              -- English name
name_ka TEXT,           -- Georgian name (ქართული)
description TEXT,       -- English description
description_ka TEXT     -- Georgian description
```

## ⚡ Edge Functions

### Available Functions

1. **webhook-handler** - Processes external webhooks
2. **order-processor** - Handles order operations and notifications
3. **product-manager** - Manages inventory and product operations

### Deploying Functions

```bash
# Deploy specific function
supabase functions deploy webhook-handler

# Deploy all functions
supabase functions deploy

# View function logs
supabase functions logs webhook-handler
```

### Function URLs

Local development:
```
http://localhost:54321/functions/v1/webhook-handler
http://localhost:54321/functions/v1/order-processor
http://localhost:54321/functions/v1/product-manager
```

## 🔧 Development Workflow

### Daily Development

1. **Start services**:
   ```bash
   supabase start
   ```

2. **Run frontend**:
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Access services**:
   - Frontend: http://localhost:3000
   - Studio: http://localhost:54323
   - API: http://localhost:54321

### Making Changes

1. **Database changes**: Create new migration files
2. **Edge functions**: Edit files in `functions/`
3. **Apply changes**:
   ```bash
   supabase db reset        # Reset and apply all migrations
   supabase functions deploy # Deploy function changes
   ```

### Testing

```bash
# Run database tests
supabase test db

# Test edge functions
supabase test functions

# Reset database to clean state
supabase db reset
```

## 🔄 Environment Switching

### Development (Official Supabase)

Current setup uses the official Supabase platform:

```bash
# Frontend connects to cloud project
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
```

### Local Development

To switch to local Supabase:

1. **Uncomment local variables** in `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   SUPABASE_URL=http://localhost:54321
   ```

2. **Start local services**:
   ```bash
   supabase start
   ```

3. **Reset database**:
   ```bash
   supabase db reset
   ```

### Production (VPS)

For production deployment:
```bash
# Update environment variables for VPS
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
```

## 📝 Common Commands

### Database Operations

```bash
# Reset database
supabase db reset

# Apply migrations
supabase db push

# Generate types
supabase gen types typescript --local > ../frontend/src/types/database.types.ts

# View database
supabase db shell
```

### Function Management

```bash
# Deploy functions
supabase functions deploy

# View logs
supabase functions logs function-name

# Serve locally
supabase functions serve
```

### Services Control

```bash
# Start services
supabase start

# Stop services
supabase stop

# Restart services
supabase stop && supabase start

# View status
supabase status
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Kill processes using ports
   sudo lsof -ti:54321 | xargs kill
   ```

2. **Docker issues**:
   ```bash
   # Restart Docker
   # Windows: Restart Docker Desktop
   # macOS: docker kill $(docker ps -q)
   ```

3. **Permission errors**:
   ```bash
   # Fix permissions
   chmod +x supabase/migrations/*.sql
   ```

### Logs and Debugging

```bash
# View all logs
supabase logs

# Follow logs in real-time
supabase logs -f

# View specific function logs
supabase logs -f webhook-handler
```

### Reset Everything

If you encounter issues:

```bash
# Complete reset
supabase stop --no-backup
supabase start

# Or full reset
docker system prune -a
supabase start
```

## 🔐 Security Configuration

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can only access their own data
- Role-based access control at database level
- Admin users have full access

### Authentication

- Uses Supabase Auth (GoTrue)
- JWT tokens for API authentication
- Role-based permissions

## 📊 Performance

### Local Development

- **API Response**: ~50ms
- **Database Queries**: ~10ms
- **Edge Functions**: ~200ms

### Monitoring

Access local monitoring:
- **Studio Dashboard**: http://localhost:54323
- **API Health**: http://localhost:54321/health

## 🚀 Next Steps

1. **Customize the schema** for your specific needs
2. **Add more edge functions** for business logic
3. **Set up CI/CD** for automated deployments
4. **Configure backup** strategies
5. **Set up monitoring** and alerts

## 📚 Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Support

For issues:
1. Check the [troubleshooting section](#troubleshooting)
2. Review Supabase documentation
3. Check local logs: `supabase logs`
4. Reset and restart if needed

---

**Note**: This setup is optimized for the Georgian Distribution System with bilingual support and role-based access control. Modify configurations as needed for your specific requirements.