text
# Deployment Architecture - VPS & Dockploy Configuration

**Last Updated:** 2025-11-01
**Environment:** Development → Production Migration Strategy

## Overview
The Georgian Distribution System uses a dual-environment architecture:
- **Development:** Official Supabase.com (akxmacfsltzhbnunoepb.supabase.co)
- **Production:** Self-hosted Supabase on VPS (data.greenland77.ge)

## Infrastructure Setup

### VPS Configuration
- **Provider:** Contabo VPS
- **Domain:** data.greenland77.ge
- **Deployment Manager:** Dockploy
- **Backend Stack:** Self-hosted Supabase (all services running)

### Dockploy Integration
- **Platform:** Dockploy (open-source deployment manager)
- **Installation:** Simple command-line setup
- **Supabase Deployment:** Docker-based self-hosted stack
- **Services Running:**
  - PostgreSQL Database
  - PostgREST API
  - Supabase Auth
  - Supabase Realtime
  - Supabase Storage
  - Kong Gateway

## Environment Strategy

### Current Phase: Development
**Backend:** supabase.com/akxmacfsltzhbnunoepb
**Purpose:** 
- Rapid development with Supabase MCP integration
- Free tier for initial development
- Full feature testing before production migration

**Environment Variables (.env.local):**
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

text

### Future Phase: Production
**Backend:** data.greenland77.ge
**Purpose:**
- Enterprise-grade self-hosted control
- Cost optimization for scale
- Data sovereignty and security
- Custom infrastructure tuning

**Environment Variables (.env.production):**
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=[self-hosted-anon-key]

text

## Migration Strategy

### Pre-Migration Checklist
- ✅ Development database fully populated and tested
- ✅ All features working on supabase.com
- ✅ Frontend fully developed and tested locally
- ✅ Dockploy and self-hosted Supabase running on VPS
- ⬜ Database schema exported from supabase.com
- ⬜ Data migrated to data.greenland77.ge
- ⬜ Environment variables updated for production
- ⬜ DNS and SSL certificates configured
- ⬜ Performance testing completed

### Migration Process (When Ready)
1. **Export from Supabase.com:**
Export schema
npx supabase db dump --db-url "postgres://[supabase.com-url]" --file dump/schema.sql

Export data
npx supabase db dump --db-url "postgres://[supabase.com-url]" --file dump/data.sql --data-only

text

2. **Import to Self-Hosted:**
Copy to VPS
scp dump/schema.sql user@data.greenland77.ge:/tmp/
scp dump/data.sql user@data.greenland77.ge:/tmp/

Import via Docker
docker exec -i [postgres-container] psql -U postgres -d postgres < /tmp/schema.sql
docker exec -i [postgres-container] psql -U postgres -d postgres < /tmp/data.sql

text

3. **Update Frontend Configuration:**
- Update NEXT_PUBLIC_SUPABASE_URL to data.greenland77.ge
- Update NEXT_PUBLIC_SUPABASE_ANON_KEY with self-hosted key
- Test authentication and realtime features
- Deploy to production

## Best Practices

### Development Phase (Current)
- Keep all backend work on supabase.com
- Use Supabase MCP for development workflow
- Maintain migration files in version control
- Test all features before migration

### Production Phase (Future)
- Never modify production database directly
- Always test migrations on development first
- Use CI/CD for automated deployments
- Monitor performance with Sentry

## Supabase MCP Integration

The Supabase MCP server is configured for supabase.com development instance:
{
"supabase": {
"command": "npx",
"args": ["-y", "@supabase/mcp-server-supabase@0.5.5", "--access-token", "[token]"],
"alwaysAllow": [
"search-docs",
"list-organizations",
"create-project",
"apply-migration",
"execute-sql",
"generate-typescript-types",
"list-tables"
]
}
}

text

**Capabilities:**
- Execute SQL directly on development database
- Generate TypeScript types automatically
- Apply migrations programmatically
- List and inspect database tables

## Troubleshooting

### MCP Connection Issues
If Supabase MCP shows "Not connected":
- Verify access token in .kilocode/mcp.json
- Regenerate token from supabase.com dashboard
- Restart Kilocode AI Agent

### Migration Verification
Always verify after migration:
-- Check table count
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies;

-- Verify data integrity
SELECT count() FROM orders;
SELECT count() FROM products;

text

## References
- Supabase Self-Hosting Guide: https://supabase.com/docs/guides/self-hosting
- Dockploy Documentation: https://dockploy.com/docs
- Migration Best Practices: https://supabase.com/docs/guides/deployment/database-migrations