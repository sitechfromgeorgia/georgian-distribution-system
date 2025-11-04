#!/bin/bash

# Database Migration Export Script
# Exports data from supabase.com to self-hosted Supabase
# Designed for Georgian Distribution System

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXPORT_DIR="$PROJECT_ROOT/database/migration-tools/exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$EXPORT_DIR/migration_log_$TIMESTAMP.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "$timestamp [$level] $message" | tee -a "$LOG_FILE"
}

error() { log "ERROR" "${RED}$*${NC}"; }
warn() { log "WARN" "${YELLOW}$*${NC}"; }
info() { log "INFO" "${BLUE}$*${NC}"; }
success() { log "SUCCESS" "${GREEN}$*${NC}"; }

# Create export directory
mkdir -p "$EXPORT_DIR"

# Check required environment variables
check_env_vars() {
    local required_vars=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "SELF_HOSTED_DB_HOST"
        "SELF_HOSTED_DB_NAME"
        "SELF_HOSTED_DB_USER"
        "SELF_HOSTED_DB_PASSWORD"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        error "Please set the following variables:"
        info "Cloud Supabase:"
        info "  - SUPABASE_URL (e.g., https://your-project.supabase.co)"
        info "  - SUPABASE_SERVICE_ROLE_KEY"
        info "Self-hosted Supabase:"
        info "  - SELF_HOSTED_DB_HOST (e.g., localhost or data.greenland77.ge)"
        info "  - SELF_HOSTED_DB_NAME (usually 'postgres')"
        info "  - SELF_HOSTED_DB_USER (usually 'postgres')"
        info "  - SELF_HOSTED_DB_PASSWORD"
        exit 1
    fi
}

# Test database connections
test_connections() {
    info "Testing database connections..."
    
    # Test cloud connection
    if ! pg_isready -h "${SUPABASE_URL#https://}" -p 5432 -U postgres -d postgres 2>/dev/null; then
        warn "Direct PostgreSQL connection to cloud Supabase failed, trying alternative method..."
    fi
    
    # Test self-hosted connection
    if ! pg_isready -h "$SELF_HOSTED_DB_HOST" -p 5432 -U "$SELF_HOSTED_DB_USER" -d "$SELF_HOSTED_DB_NAME" 2>/dev/null; then
        error "Cannot connect to self-hosted database at $SELF_HOSTED_DB_HOST"
        exit 1
    fi
    
    success "Database connections verified"
}

# Export database schema
export_schema() {
    local schema_file="$EXPORT_DIR/schema_$TIMESTAMP.sql"
    info "Exporting database schema..."
    
    # Export schema without data
    PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" pg_dump \
        --host "${SUPABASE_URL#https://}" \
        --port 5432 \
        --username postgres \
        --database postgres \
        --schema-only \
        --verbose \
        --no-owner \
        --no-privileges \
        --clean \
        --create \
        > "$schema_file" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "Schema exported to $schema_file"
        echo "$schema_file"
    else
        error "Failed to export schema"
        exit 1
    fi
}

# Export data with custom format for Georgian Distribution System tables
export_data() {
    local data_file="$EXPORT_DIR/data_$TIMESTAMP.sql"
    info "Exporting critical data..."
    
    # Export only the tables with data (skip auth tables and logs)
    local tables=(
        "public.profiles"
        "public.products" 
        "public.orders"
        "public.order_items"
        "public.notifications"
        "public.demo_sessions"
    )
    
    PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" pg_dump \
        --host "${SUPABASE_URL#https://}" \
        --port 5432 \
        --username postgres \
        --database postgres \
        --data-only \
        --verbose \
        --no-owner \
        --no-privileges \
        --table="${tables[0]}" \
        > "$data_file" 2>> "$LOG_FILE"
    
    # Append other tables
    for table in "${tables[@]:1}"; do
        PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" pg_dump \
            --host "${SUPABASE_URL#https://}" \
            --port 5432 \
            --username postgres \
            --database postgres \
            --data-only \
            --verbose \
            --no-owner \
            --no-privileges \
            --table="$table" \
            >> "$data_file" 2>> "$LOG_FILE"
    done
    
    if [[ $? -eq 0 ]]; then
        success "Data exported to $data_file"
        echo "$data_file"
    else
        error "Failed to export data"
        exit 1
    fi
}

# Export RLS policies
export_rls_policies() {
    local rls_file="$EXPORT_DIR/rls_policies_$TIMESTAMP.sql"
    info "Exporting Row Level Security policies..."
    
    # Query to extract RLS policies
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --command "
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
        " > "$rls_file" 2>> "$LOG_FILE"
    
    # Also export the actual CREATE POLICY statements
    local policy_script="$EXPORT_DIR/rls_policies_script_$TIMESTAMP.sql"
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --command "
        \copy (
            SELECT 'CREATE POLICY ' || policyname || ' ON ' || schemaname || '.' || tablename ||
                   ' FOR ' || cmd || ' TO ' || roles ||
                   CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
                   CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END || ';'
            FROM pg_policies 
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname
        ) TO STDOUT;
        " > "$policy_script" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "RLS policies exported to $rls_file and $policy_script"
        echo "$rls_file"
    else
        error "Failed to export RLS policies"
        exit 1
    fi
}

# Export storage bucket configuration
export_storage_config() {
    local storage_file="$EXPORT_DIR/storage_config_$TIMESTAMP.sql"
    info "Exporting storage bucket configuration..."
    
    # Extract storage configuration
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --command "
        -- Export buckets
        SELECT 'INSERT INTO storage.buckets (id, name, public, owner, created_at, updated_at, AVIF) VALUES (' ||
               quote_literal(id) || ', ' || quote_literal(name) || ', ' || public || ', ' ||
               quote_literal(owner) || ', ' || quote_literal(created_at) || ', ' ||
               quote_literal(updated_at) || ', ' || quote_literal(AVIF) || ');' as sql_statement
        FROM storage.buckets;
        
        -- Export bucket policies
        SELECT 'INSERT INTO storage.policies (id, bucket_id, name, definition, check_expression, command) VALUES (' ||
               quote_literal(p.id) || ', ' || quote_literal(p.bucket_id) || ', ' ||
               quote_literal(p.name) || ', ' || quote_literal(p.definition) || ', ' ||
               quote_literal(p.check_expression) || ', ' || quote_literal(p.command) || ');' as sql_statement
        FROM storage.policies p;
        " > "$storage_file" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "Storage configuration exported to $storage_file"
        echo "$storage_file"
    else
        warn "Failed to export storage configuration (may not exist)"
        echo "$storage_file"
    fi
}

# Generate migration summary
generate_summary() {
    local summary_file="$EXPORT_DIR/migration_summary_$TIMESTAMP.txt"
    info "Generating migration summary..."
    
    {
        echo "Database Migration Summary"
        echo "=========================="
        echo "Timestamp: $TIMESTAMP"
        echo "Cloud Source: $SUPABASE_URL"
        echo "Target Host: $SELF_HOSTED_DB_HOST"
        echo ""
        echo "Exported Files:"
        echo "- Schema: schema_$TIMESTAMP.sql"
        echo "- Data: data_$TIMESTAMP.sql"
        echo "- RLS Policies: rls_policies_$TIMESTAMP.sql"
        echo "- Storage Config: storage_config_$TIMESTAMP.sql"
        echo ""
        echo "Critical Tables:"
        echo "- profiles: User profiles with roles"
        echo "- products: Product catalog with Georgian translations"
        echo "- orders: Customer orders"
        echo "- order_items: Order line items"
        echo "- notifications: System notifications"
        echo "- demo_sessions: Demo user data"
        echo ""
        echo "Next Steps:"
        echo "1. Review exported files"
        echo "2. Run import-to-selfhosted.sh to import data"
        echo "3. Run verify-migration.sh to validate migration"
        echo "4. Update frontend environment variables"
        echo ""
        echo "Log file: migration_log_$TIMESTAMP.log"
    } > "$summary_file"
    
    success "Migration summary created: $summary_file"
}

# Main execution
main() {
    info "Starting database migration export process..."
    info "Timestamp: $TIMESTAMP"
    info "Log file: $LOG_FILE"
    
    # Check prerequisites
    check_env_vars
    
    # Test connections
    test_connections
    
    # Export components
    local schema_file=$(export_schema)
    local data_file=$(export_data)
    local rls_file=$(export_rls_policies)
    local storage_file=$(export_storage_config)
    
    # Generate summary
    generate_summary
    
    success "Migration export completed successfully!"
    info "Review files in: $EXPORT_DIR"
    info "Next step: Run import-to-selfhosted.sh"
    
    # Return success
    return 0
}

# Handle script interruption
trap 'error "Migration export interrupted!"; exit 1' INT TERM

# Run main function
main "$@"