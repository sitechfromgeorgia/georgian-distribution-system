#!/bin/bash

# Database Migration Import Script
# Imports data from cloud Supabase export to self-hosted Supabase
# Designed for Georgian Distribution System

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXPORT_DIR="$PROJECT_ROOT/database/migration-tools/exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$EXPORT_DIR/import_log_$TIMESTAMP.log"

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

# Default values
EXPORT_TIMESTAMP=""
SKIP_SCHEMA=false
SKIP_DATA=false
SKIP_RLS=false
SKIP_STORAGE=false
DRY_RUN=false
FORCE=false

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Import migration data from cloud Supabase to self-hosted Supabase.

OPTIONS:
    -t, --timestamp TIMESTAMP    Specific export timestamp to import (YYYYMMDD_HHMMSS)
    -s, --skip-schema            Skip schema import (existing tables)
    -d, --skip-data              Skip data import
    -r, --skip-rls               Skip RLS policies import
    -g, --skip-storage           Skip storage configuration import
    -n, --dry-run               Show what would be done without executing
    -f, --force                 Force import even if tables already exist
    -h, --help                  Show this help message

EXAMPLES:
    $0                          # Import latest export
    $0 -t 20251031_143022       # Import specific timestamp
    $0 --dry-run                # Preview import without executing
    $0 -f --skip-schema         # Force import, skip schema creation

ENVIRONMENT VARIABLES:
    SELF_HOSTED_DB_HOST         Database host (default: data.greenland77.ge)
    SELF_HOSTED_DB_NAME         Database name (default: postgres)
    SELF_HOSTED_DB_USER         Database user (default: postgres)
    SELF_HOSTED_DB_PASSWORD     Database password (required)
    BACKUP_BEFORE_IMPORT        Set to 'true' to backup before import

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--timestamp)
                EXPORT_TIMESTAMP="$2"
                shift 2
                ;;
            -s|--skip-schema)
                SKIP_SCHEMA=true
                shift
                ;;
            -d|--skip-data)
                SKIP_DATA=true
                shift
                ;;
            -r|--skip-rls)
                SKIP_RLS=true
                shift
                ;;
            -g|--skip-storage)
                SKIP_STORAGE=true
                shift
                ;;
            -n|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Check required environment variables
check_env_vars() {
    if [[ -z "${SELF_HOSTED_DB_PASSWORD:-}" ]]; then
        error "SELF_HOSTED_DB_PASSWORD environment variable is required"
        info "Set it with: export SELF_HOSTED_DB_PASSWORD='your_password'"
        exit 1
    fi
    
    # Set defaults
    : "${SELF_HOSTED_DB_HOST:=data.greenland77.ge}"
    : "${SELF_HOSTED_DB_NAME:=postgres}"
    : "${SELF_HOSTED_DB_USER:=postgres}"
    
    info "Target database: $SELF_HOSTED_DB_HOST/$SELF_HOSTED_DB_NAME"
}

# Find the export files
find_export_files() {
    if [[ -n "$EXPORT_TIMESTAMP" ]]; then
        local timestamp="$EXPORT_TIMESTAMP"
    else
        # Find the most recent export
        local latest_export=$(ls -t "$EXPORT_DIR"/migration_summary_*.txt 2>/dev/null | head -1)
        if [[ -z "$latest_export" ]]; then
            error "No export files found in $EXPORT_DIR"
            info "Run export-from-cloud.sh first to create an export"
            exit 1
        fi
        local timestamp=$(basename "$latest_export" | sed 's/migration_summary_\([0-9]*_[0-9]*\)\.txt/\1/')
    fi
    
    export SCHEMA_FILE="$EXPORT_DIR/schema_$timestamp.sql"
    export DATA_FILE="$EXPORT_DIR/data_$timestamp.sql"
    export RLS_FILE="$EXPORT_DIR/rls_policies_$timestamp.sql"
    export RLS_SCRIPT="$EXPORT_DIR/rls_policies_script_$timestamp.sql"
    export STORAGE_FILE="$EXPORT_DIR/storage_config_$timestamp.sql"
    export TIMESTAMP="$timestamp"
    
    info "Using export timestamp: $TIMESTAMP"
    
    # Check if files exist
    local missing_files=()
    if [[ "$SKIP_SCHEMA" == false ]] && [[ ! -f "$SCHEMA_FILE" ]]; then
        missing_files+=("schema_$TIMESTAMP.sql")
    fi
    if [[ "$SKIP_DATA" == false ]] && [[ ! -f "$DATA_FILE" ]]; then
        missing_files+=("data_$TIMESTAMP.sql")
    fi
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        error "Missing export files:"
        printf '%s\n' "${missing_files[@]}"
        exit 1
    fi
}

# Create backup of existing database
create_backup() {
    if [[ "${BACKUP_BEFORE_IMPORT:-false}" != "true" ]]; then
        return 0
    fi
    
    local backup_file="$EXPORT_DIR/backup_before_import_$TIMESTAMP.sql"
    info "Creating backup before import: $backup_file"
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would create backup to $backup_file"
        return 0
    fi
    
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" pg_dump \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --database "$SELF_HOSTED_DB_NAME" \
        --verbose \
        --clean \
        --create \
        > "$backup_file" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "Backup created: $backup_file"
    else
        error "Failed to create backup"
        exit 1
    fi
}

# Check for existing tables and conflicts
check_existing_tables() {
    if [[ "$FORCE" == true ]]; then
        warn "Force import enabled, will overwrite existing data"
        return 0
    fi
    
    info "Checking for existing tables..."
    
    local existing_tables=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
        " 2>> "$LOG_FILE")
    
    if [[ -n "$existing_tables" ]]; then
        error "Database contains existing tables:"
        echo "$existing_tables" | while read -r table; do
            error "  - $table"
        done
        error "Use --force to overwrite existing data or specify different database"
        exit 1
    fi
    
    success "No existing tables found, safe to proceed"
}

# Import database schema
import_schema() {
    if [[ "$SKIP_SCHEMA" == true ]]; then
        info "Skipping schema import as requested"
        return 0
    fi
    
    info "Importing database schema..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would import schema from $SCHEMA_FILE"
        return 0
    fi
    
    # Import schema
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --verbose \
        --quiet \
        < "$SCHEMA_FILE" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "Schema imported successfully"
    else
        error "Failed to import schema"
        exit 1
    fi
}

# Import data with integrity checks
import_data() {
    if [[ "$SKIP_DATA" == true ]]; then
        info "Skipping data import as requested"
        return 0
    fi
    
    info "Importing data..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would import data from $DATA_FILE"
        return 0
    fi
    
    # Import data with transaction
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --verbose \
        --quiet \
        --transaction \
        < "$DATA_FILE" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "Data imported successfully"
    else
        error "Failed to import data"
        exit 1
    fi
}

# Verify foreign key constraints after import
verify_constraints() {
    info "Verifying foreign key constraints..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would verify foreign key constraints"
        return 0
    fi
    
    local constraint_errors=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT 
            conname as constraint_name,
            conrelid::regclass as table_name,
            confrelid::regclass as referenced_table
        FROM pg_constraint 
        WHERE contype = 'f' 
        AND NOT validated;
        " 2>> "$LOG_FILE")
    
    if [[ -n "$constraint_errors" ]]; then
        error "Foreign key constraint violations found:"
        echo "$constraint_errors"
        warn "This may indicate data integrity issues"
    else
        success "All foreign key constraints validated"
    fi
}

# Import RLS policies
import_rls_policies() {
    if [[ "$SKIP_RLS" == true ]] || [[ ! -f "$RLS_SCRIPT" ]]; then
        info "Skipping RLS policies import"
        return 0
    fi
    
    info "Importing Row Level Security policies..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would import RLS policies from $RLS_SCRIPT"
        return 0
    fi
    
    # Drop existing policies first to ensure clean import
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --command "
        DROP POLICY IF EXISTS admin_full_access ON public.profiles;
        DROP POLICY IF EXISTS restaurant_own_orders ON public.orders;
        DROP POLICY IF EXISTS restaurant_own_order_items ON public.order_items;
        DROP POLICY IF EXISTS driver_own_deliveries ON public.orders;
        DROP POLICY IF EXISTS demo_read_only ON public.profiles;
        DROP POLICY IF EXISTS demo_read_products ON public.products;
        DROP POLICY IF EXISTS demo_read_orders ON public.orders;
        " 2>> "$LOG_FILE"
    
    # Import new policies
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --verbose \
        --quiet \
        < "$RLS_SCRIPT" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "RLS policies imported successfully"
    else
        error "Failed to import RLS policies"
        warn "This may affect security - manual review required"
    fi
}

# Configure storage buckets
import_storage_config() {
    if [[ "$SKIP_STORAGE" == true ]] || [[ ! -f "$STORAGE_FILE" ]]; then
        info "Skipping storage configuration import"
        return 0
    fi
    
    info "Importing storage bucket configuration..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would import storage configuration from $STORAGE_FILE"
        return 0
    fi
    
    # Import storage configuration
    PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --verbose \
        --quiet \
        < "$STORAGE_FILE" 2>> "$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        success "Storage configuration imported successfully"
    else
        warn "Failed to import storage configuration (may not be critical)"
    fi
}

# Post-import validation
post_import_validation() {
    info "Performing post-import validation..."
    
    if [[ "$DRY_RUN" == true ]]; then
        info "DRY RUN: Would perform post-import validation"
        return 0
    fi
    
    # Check critical table counts
    local validation_results=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT 
            'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
        UNION ALL
        SELECT 
            'products', COUNT(*) FROM public.products
        UNION ALL
        SELECT 
            'orders', COUNT(*) FROM public.orders
        UNION ALL
        SELECT 
            'order_items', COUNT(*) FROM public.order_items
        UNION ALL
        SELECT 
            'notifications', COUNT(*) FROM public.notifications
        UNION ALL
        SELECT 
            'demo_sessions', COUNT(*) FROM public.demo_sessions
        ORDER BY table_name;
        " 2>> "$LOG_FILE")
    
    info "Table row counts after import:"
    echo "$validation_results" | while IFS='|' read -r table count; do
        info "  - $table: $count rows"
    done
    
    success "Post-import validation completed"
}

# Generate import summary
generate_summary() {
    local summary_file="$EXPORT_DIR/import_summary_$TIMESTAMP.txt"
    info "Generating import summary..."
    
    {
        echo "Database Migration Import Summary"
        echo "================================="
        echo "Timestamp: $TIMESTAMP"
        echo "Import Date: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Target Host: $SELF_HOSTED_DB_HOST"
        echo "Database: $SELF_HOSTED_DB_NAME"
        echo ""
        echo "Import Options:"
        echo "- Schema: $([ "$SKIP_SCHEMA" = true ] && echo "SKIPPED" || echo "IMPORTED")"
        echo "- Data: $([ "$SKIP_DATA" = true ] && echo "SKIPPED" || echo "IMPORTED")"
        echo "- RLS Policies: $([ "$SKIP_RLS" = true ] && echo "SKIPPED" || echo "IMPORTED")"
        echo "- Storage Config: $([ "$SKIP_STORAGE" = true ] && echo "SKIPPED" || echo "IMPORTED")"
        echo "- Dry Run: $([ "$DRY_RUN" = true ] && echo "YES" || echo "NO")"
        echo "- Force Import: $([ "$FORCE" = true ] && echo "YES" || echo "NO")"
        echo ""
        echo "Files Processed:"
        echo "- Schema: schema_$TIMESTAMP.sql"
        echo "- Data: data_$TIMESTAMP.sql"
        echo "- RLS Policies: rls_policies_script_$TIMESTAMP.sql"
        echo "- Storage: storage_config_$TIMESTAMP.sql"
        echo ""
        echo "Next Steps:"
        echo "1. Run verify-migration.sh to validate migration integrity"
        echo "2. Update frontend environment variables to point to new database"
        echo "3. Test application functionality with migrated data"
        echo "4. Remove old cloud Supabase data if migration is successful"
        echo ""
        echo "Log file: import_log_$TIMESTAMP.log"
    } > "$summary_file"
    
    success "Import summary created: $summary_file"
}

# Main execution
main() {
    info "Starting database migration import process..."
    info "Timestamp: $TIMESTAMP"
    info "Log file: $LOG_FILE"
    
    # Parse arguments and check environment
    parse_args "$@"
    check_env_vars
    
    # Find export files
    find_export_files
    
    # Pre-import checks and backup
    create_backup
    check_existing_tables
    
    # Import process
    if [[ "$SKIP_SCHEMA" == false ]]; then
        import_schema
    fi
    
    if [[ "$SKIP_DATA" == false ]]; then
        import_data
        verify_constraints
    fi
    
    if [[ "$SKIP_RLS" == false ]]; then
        import_rls_policies
    fi
    
    if [[ "$SKIP_STORAGE" == false ]]; then
        import_storage_config
    fi
    
    # Post-import validation
    post_import_validation
    
    # Generate summary
    generate_summary
    
    success "Migration import completed successfully!"
    info "Review files in: $EXPORT_DIR"
    info "Next step: Run verify-migration.sh to validate migration"
    
    return 0
}

# Handle script interruption
trap 'error "Migration import interrupted!"; exit 1' INT TERM

# Run main function
main "$@"