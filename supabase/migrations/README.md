# Security Migrations

This directory contains database migrations for the security infrastructure.

## Migrations

### 20251104000001_create_audit_logs_table.sql

Creates the `audit_logs` table for comprehensive security and compliance logging.

**Features:**
- Event type categorization (auth, security, user management, etc.)
- Severity levels (info, warning, error, critical)
- Rich context (IP address, user agent, resource details)
- RLS policies for secure access
- Statistics functions
- Automatic cleanup function

**Tables Created:**
- `audit_logs`

**Functions Created:**
- `cleanup_old_audit_logs()` - Remove old logs (retention policy)
- `get_audit_log_statistics()` - Aggregated metrics

### 20251104000002_create_api_keys_table.sql

Creates the `api_keys` table for API key management and rotation.

**Features:**
- Secure key storage (SHA-256 hashing)
- Automatic expiration
- Scope-based permissions
- Usage tracking
- RLS policies
- Helper functions

**Tables Created:**
- `api_keys`

**Functions Created:**
- `get_expired_api_keys()` - Find expired keys
- `get_expiring_api_keys()` - Find keys expiring soon
- `revoke_all_user_api_keys()` - Emergency revocation
- `cleanup_inactive_api_keys()` - Remove old inactive keys
- `get_api_key_statistics()` - Usage statistics

## Applying Migrations

### Option 1: Using the Migration Script (Recommended)

```bash
cd /home/user/georgian-distribution-system
./supabase/scripts/apply-security-migrations.sh
```

### Option 2: Using Supabase CLI

```bash
# Push all pending migrations
supabase db push

# Or apply specific migration
supabase db push --include-all
```

### Option 3: Manual Application

If you need to apply migrations manually:

```sql
-- Connect to your Supabase database
-- Then run each migration file in order:

-- 1. Audit logs
\i supabase/migrations/20251104000001_create_audit_logs_table.sql

-- 2. API keys
\i supabase/migrations/20251104000002_create_api_keys_table.sql
```

## Verification

After applying migrations, verify the tables exist:

```sql
-- Check audit_logs table
SELECT * FROM audit_logs LIMIT 1;

-- Check api_keys table
SELECT * FROM api_keys LIMIT 1;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('audit_logs', 'api_keys');
```

## Rollback

If you need to rollback these migrations:

```sql
-- Remove tables (in reverse order)
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Remove functions
DROP FUNCTION IF EXISTS public.cleanup_old_audit_logs;
DROP FUNCTION IF EXISTS public.get_audit_log_statistics;
DROP FUNCTION IF EXISTS public.get_expired_api_keys;
DROP FUNCTION IF EXISTS public.get_expiring_api_keys;
DROP FUNCTION IF EXISTS public.revoke_all_user_api_keys;
DROP FUNCTION IF EXISTS public.cleanup_inactive_api_keys;
DROP FUNCTION IF EXISTS public.get_api_key_statistics;
```

## Post-Migration Tasks

1. **Verify RLS Policies:**
   - Check that Row Level Security is enabled on both tables
   - Test policies with different user roles

2. **Test Audit Logging:**
   ```typescript
   import { AuditLogger, AuditEventType } from '@/lib/security/audit-logger';

   await AuditLogger.logAuth(AuditEventType.AUTH_LOGIN, userId, true);
   ```

3. **Generate Test API Key:**
   ```typescript
   import { APIKeyManager } from '@/lib/security/api-key-manager';

   const apiKey = await APIKeyManager.generateKey(
     userId,
     'Test Key',
     ['read:orders'],
     'Testing purposes'
   );
   ```

4. **Set Up Cron Jobs:**
   - Audit log cleanup (weekly): `SELECT cleanup_old_audit_logs(90);`
   - API key auto-rotation (daily): Call `APIKeyManager.autoRotateExpiredKeys()`

## Troubleshooting

### Migration fails with "relation already exists"

The tables already exist. Either:
- Skip the migration
- Drop the existing tables (see Rollback section)
- Modify the migration to use `CREATE TABLE IF NOT EXISTS`

### RLS policies prevent access

Make sure you're using the service role key for admin operations:

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient(); // Uses service role for backend
```

### Functions not working

Verify they were created:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%audit%' OR routine_name LIKE '%api_key%';
```

## Maintenance

### Audit Log Retention

Default retention is 90 days. To change:

```sql
-- Run cleanup with different retention
SELECT cleanup_old_audit_logs(180); -- 180 days
```

### API Key Cleanup

Remove old inactive keys:

```sql
-- Remove keys inactive for 90 days
SELECT cleanup_inactive_api_keys(90);
```

## Security Considerations

1. **Never expose service role key** - Only use on server
2. **Regular audits** - Review audit logs weekly
3. **Monitor failed events** - Alert on critical security events
4. **Key rotation** - Enforce regular API key rotation
5. **Backup** - Regular database backups including these tables

## Related Documentation

- [Security Implementation Guide](/docs/SECURITY.md)
- [API Key Management](/docs/SECURITY.md#api-key-management--rotation)
- [Audit Logging](/docs/SECURITY.md#audit-logging)
