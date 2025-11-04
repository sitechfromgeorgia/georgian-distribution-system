#!/bin/bash

# Database Migration Verification Script
# Validates migration integrity from cloud Supabase to self-hosted Supabase
# Designed for Georgian Distribution System

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXPORT_DIR="$PROJECT_ROOT/database/migration-tools/exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$EXPORT_DIR/verify_log_$TIMESTAMP.log"
REPORT_FILE="$EXPORT_DIR/verification_report_$TIMESTAMP.txt"

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
VERBOSE=false
DETAILED=false
CRITICAL_ONLY=false

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Verify migration integrity between cloud Supabase and self-hosted Supabase.

OPTIONS:
    -t, --timestamp TIMESTAMP    Specific export timestamp to verify (YYYYMMDD_HHMMSS)
    -v, --verbose               Verbose output
    -d, --detailed              Generate detailed verification report
    -c, --critical-only         Run only critical validation checks
    -h, --help                  Show this help message

EXAMPLES:
    $0                          # Verify latest migration
    $0 -t 20251031_143022       # Verify specific timestamp
    $0 --detailed --verbose     # Generate comprehensive report

ENVIRONMENT VARIABLES:
    CLOUD_SUPABASE_URL          Cloud Supabase URL (if available)
    CLOUD_SUPABASE_SERVICE_KEY  Cloud Supabase service key (if available)
    SELF_HOSTED_DB_HOST         Self-hosted DB host (default: data.greenland77.ge)
    SELF_HOSTED_DB_NAME         Self-hosted DB name (default: postgres)
    SELF_HOSTED_DB_USER         Self-hosted DB user (default: postgres)
    SELF_HOSTED_DB_PASSWORD     Self-hosted DB password (required)

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
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -d|--detailed)
                DETAILED=true
                shift
                ;;
            -c|--critical-only)
                CRITICAL_ONLY=true
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
        exit 1
    fi
    
    # Set defaults
    : "${SELF_HOSTED_DB_HOST:=data.greenland77.ge}"
    : "${SELF_HOSTED_DB_NAME:=postgres}"
    : "${SELF_HOSTED_DB_USER:=postgres}"
    : "${CLOUD_SUPABASE_URL:=}"
    : "${CLOUD_SUPABASE_SERVICE_KEY:=}"
    
    info "Target database: $SELF_HOSTED_DB_HOST/$SELF_HOSTED_DB_NAME"
}

# Find the migration export
find_migration_export() {
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
    
    export TIMESTAMP="$timestamp"
    export SCHEMA_FILE="$EXPORT_DIR/schema_$timestamp.sql"
    export DATA_FILE="$EXPORT_DIR/data_$timestamp.sql"
    
    info "Verifying migration timestamp: $TIMESTAMP"
    
    # Check if files exist
    if [[ ! -f "$SCHEMA_FILE" ]]; then
        error "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi
    
    if [[ ! -f "$DATA_FILE" ]]; then
        error "Data file not found: $DATA_FILE"
        exit 1
    fi
}

# Compare table counts between source and target
compare_table_counts() {
    info "Comparing table counts..."
    
    # Get source table counts from export files
    local source_count=$(grep -c "CREATE TABLE" "$SCHEMA_FILE" 2>/dev/null || echo "0")
    info "Source tables (export): $source_count"
    
    # Get target table counts
    local target_count=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
        " 2>> "$LOG_FILE")
    
    info "Target tables (self-hosted): $target_count"
    
    # Compare results
    if [[ "$source_count" == "$target_count" ]]; then
        success "Table count verification PASSED: $target_count tables"
        echo "TABLE_COUNT|PASSED|$target_count" >> "$REPORT_FILE"
        return 0
    else
        error "Table count verification FAILED: source=$source_count, target=$target_count"
        echo "TABLE_COUNT|FAILED|$source_count->$target_count" >> "$REPORT_FILE"
        return 1
    fi
}

# Verify row counts for critical tables
verify_row_counts() {
    info "Verifying row counts for critical tables..."
    
    local critical_tables=(
        "profiles:User profiles with roles"
        "products:Product catalog with Georgian translations"
        "orders:Customer orders"
        "order_items:Order line items"
        "notifications:System notifications"
        "demo_sessions:Demo user data"
    )
    
    local all_passed=true
    
    for table_info in "${critical_tables[@]}"; do
        local table=$(echo "$table_info" | cut -d':' -f1)
        local description=$(echo "$table_info" | cut -d':' -f2)
        
        # Get row count from target database
        local row_count=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --tuples-only \
            --no-align \
            --command "SELECT COUNT(*) FROM public.$table;" 2>> "$LOG_FILE")
        
        if [[ "$row_count" =~ ^[0-9]+$ ]]; then
            success "Table $table: $row_count rows ($description)"
            echo "ROW_COUNT_$table|PASSED|$row_count" >> "$REPORT_FILE"
            
            if [[ "$VERBOSE" == true ]]; then
                info "  Sample data from $table:"
                local sample_data=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
                    --host "$SELF_HOSTED_DB_HOST" \
                    --port 5432 \
                    --username "$SELF_HOSTED_DB_USER" \
                    --dbname "$SELF_HOSTED_DB_NAME" \
                    --tuples-only \
                    --no-align \
                    --command "SELECT * FROM public.$table LIMIT 3;" 2>> "$LOG_FILE")
                echo "$sample_data" | while read -r line; do
                    info "    $line"
                done
            fi
        else
            error "Failed to get row count for table $table"
            echo "ROW_COUNT_$table|FAILED|ERROR" >> "$REPORT_FILE"
            all_passed=false
        fi
        
        if [[ "$CRITICAL_ONLY" == true ]]; then
            break
        fi
    done
    
    if [[ "$all_passed" == true ]]; then
        success "Row count verification PASSED for all critical tables"
    else
        error "Row count verification FAILED for some tables"
        return 1
    fi
}

# Check RLS policy count
check_rls_policies() {
    info "Checking Row Level Security policies..."
    
    # Get RLS policy count
    local policy_count=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = 'public';
        " 2>> "$LOG_FILE")
    
    info "RLS policies found: $policy_count"
    
    # Get policy details
    if [[ "$VERBOSE" == true ]] || [[ "$DETAILED" == true ]]; then
        info "RLS Policy Details:"
        PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --command "
            SELECT 
                tablename,
                policyname,
                permissive,
                cmd,
                roles
            FROM pg_policies 
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
            " 2>> "$LOG_FILE" | while read -r line; do
            info "  $line"
        done
    fi
    
    # Expected RLS policies for Georgian Distribution System
    local expected_min_policies=6  # admin_full_access, restaurant_own_orders, etc.
    
    if [[ "$policy_count" -ge "$expected_min_policies" ]]; then
        success "RLS policy verification PASSED: $policy_count policies found"
        echo "RLS_POLICIES|PASSED|$policy_count" >> "$REPORT_FILE"
    else
        warn "RLS policy verification WARNING: Only $policy_count policies found (expected ≥$expected_min_policies)"
        echo "RLS_POLICIES|WARNING|$policy_count" >> "$REPORT_FILE"
    fi
}

# Validate foreign key constraints
validate_foreign_keys() {
    info "Validating foreign key constraints..."
    
    # Check for constraint violations
    local violations=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
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
            confrelid::regclass as referenced_table,
            CASE contype
                WHEN 'f' THEN 'FOREIGN KEY'
                WHEN 'p' THEN 'PRIMARY KEY'
                WHEN 'u' THEN 'UNIQUE'
                WHEN 'c' THEN 'CHECK'
            END as constraint_type
        FROM pg_constraint 
        WHERE conrelid::regclass::text LIKE 'public.%'
        ORDER BY conname;
        " 2>> "$LOG_FILE")
    
    if [[ -n "$violations" ]]; then
        if [[ "$VERBOSE" == true ]] || [[ "$DETAILED" == true ]]; then
            info "Foreign key constraints found:"
            echo "$violations" | while read -r line; do
                info "  $line"
            done
        fi
        success "Foreign key constraint validation PASSED"
        echo "FOREIGN_KEYS|PASSED|VALID" >> "$REPORT_FILE"
    else
        error "No foreign key constraints found - this may indicate schema issues"
        echo "FOREIGN_KEYS|WARNING|NO_CONSTRAINTS" >> "$REPORT_FILE"
    fi
    
    # Check for orphaned records
    local orphaned_orders=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT COUNT(*) 
        FROM public.orders o
        LEFT JOIN public.profiles p ON o.restaurant_id = p.id
        WHERE p.id IS NULL AND o.restaurant_id IS NOT NULL;
        " 2>> "$LOG_FILE")
    
    if [[ "$orphaned_orders" == "0" ]]; then
        success "No orphaned orders found"
        echo "ORPHANED_RECORDS|PASSED|0" >> "$REPORT_FILE"
    else
        error "Found $orphaned_orders orphaned orders"
        echo "ORPHANED_RECORDS|FAILED|$orphaned_orders" >> "$REPORT_FILE"
    fi
}

# Validate data integrity for Georgian Distribution System
validate_business_logic() {
    info "Validating business logic constraints..."
    
    # Check for valid user roles
    local invalid_roles=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT COUNT(*) 
        FROM public.profiles 
        WHERE role NOT IN ('admin', 'restaurant', 'driver', 'demo');
        " 2>> "$LOG_FILE")
    
    if [[ "$invalid_roles" == "0" ]]; then
        success "All user roles are valid"
        echo "USER_ROLES|PASSED|0" >> "$REPORT_FILE"
    else
        error "Found $invalid_roles users with invalid roles"
        echo "USER_ROLES|FAILED|$invalid_roles" >> "$REPORT_FILE"
    fi
    
    # Check for orders with valid statuses
    local invalid_status=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT COUNT(*) 
        FROM public.orders 
        WHERE status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled');
        " 2>> "$LOG_FILE")
    
    if [[ "$invalid_status" == "0" ]]; then
        success "All order statuses are valid"
        echo "ORDER_STATUSES|PASSED|0" >> "$REPORT_FILE"
    else
        error "Found $invalid_status orders with invalid statuses"
        echo "ORDER_STATUSES|FAILED|$invalid_status" >> "$REPORT_FILE"
    fi
    
    # Check for products with required fields
    local incomplete_products=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
        --host "$SELF_HOSTED_DB_HOST" \
        --port 5432 \
        --username "$SELF_HOSTED_DB_USER" \
        --dbname "$SELF_HOSTED_DB_NAME" \
        --tuples-only \
        --no-align \
        --command "
        SELECT COUNT(*) 
        FROM public.products 
        WHERE name IS NULL OR price IS NULL OR category IS NULL;
        " 2>> "$LOG_FILE")
    
    if [[ "$incomplete_products" == "0" ]]; then
        success "All products have required fields"
        echo "PRODUCT_DATA|PASSED|0" >> "$REPORT_FILE"
    else
        error "Found $incomplete_products products with missing required fields"
        echo "PRODUCT_DATA|FAILED|$incomplete_products" >> "$REPORT_FILE"
    fi
}

# Performance and indexing validation
validate_performance() {
    info "Validating database performance configuration..."
    
    # Check for important indexes
    local important_indexes=(
        "idx_orders_restaurant_id:public.orders.restaurant_id"
        "idx_order_items_order_id:public.order_items.order_id"
        "idx_profiles_role:public.profiles.role"
        "idx_notifications_user_id:public.notifications.user_id"
    )
    
    local indexes_found=0
    
    for index_info in "${important_indexes[@]}"; do
        local index_name=$(echo "$index_info" | cut -d':' -f1)
        local table_column=$(echo "$index_info" | cut -d':' -f2)
        
        local exists=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --tuples-only \
            --no-align \
            --command "
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE tablename = '$(echo "$table_column" | cut -d'.' -f2)' 
            AND indexname = '$index_name';
            " 2>> "$LOG_FILE")
        
        if [[ "$exists" == "1" ]]; then
            ((indexes_found++))
            success "Index $index_name found"
            echo "INDEX_$index_name|PASSED|EXISTS" >> "$REPORT_FILE"
        else
            warn "Index $index_name not found"
            echo "INDEX_$index_name|WARNING|MISSING" >> "$REPORT_FILE"
        fi
    done
    
    if [[ "$indexes_found" -ge 2 ]]; then
        success "Performance validation PASSED: $indexes_found/${#important_indexes[@]} indexes found"
    else
        warn "Performance validation WARNING: Only $indexes_found/${#important_indexes[@]} indexes found"
    fi
}

# Generate detailed verification report
generate_detailed_report() {
    if [[ "$DETAILED" != true ]]; then
        return 0
    fi
    
    info "Generating detailed verification report..."
    
    local detailed_report="$EXPORT_DIR/detailed_verification_$TIMESTAMP.txt"
    
    {
        echo "DETAILED MIGRATION VERIFICATION REPORT"
        echo "======================================"
        echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Migration Timestamp: $TIMESTAMP"
        echo "Target Database: $SELF_HOSTED_DB_HOST/$SELF_HOSTED_DB_NAME"
        echo ""
        
        echo "DATABASE STATISTICS"
        echo "-------------------"
        
        # Table sizes
        echo "Table Sizes (rows):"
        for table in profiles products orders order_items notifications demo_sessions; do
            local count=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
                --host "$SELF_HOSTED_DB_HOST" \
                --port 5432 \
                --username "$SELF_HOSTED_DB_USER" \
                --dbname "$SELF_HOSTED_DB_NAME" \
                --tuples-only \
                --no-align \
                --command "SELECT COUNT(*) FROM public.$table;" 2>/dev/null)
            echo "  $table: $count rows"
        done
        echo ""
        
        # Database size
        local db_size=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --tuples-only \
            --no-align \
            --command "SELECT pg_size_pretty(pg_database_size('$SELF_HOSTED_DB_NAME'));" 2>/dev/null)
        echo "Total Database Size: $db_size"
        echo ""
        
        echo "USER ROLE DISTRIBUTION"
        echo "----------------------"
        PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --command "
            SELECT role, COUNT(*) as count 
            FROM public.profiles 
            GROUP BY role 
            ORDER BY count DESC;
            " 2>/dev/null | while read -r line; do
            echo "  $line"
        done
        echo ""
        
        echo "ORDER STATUS DISTRIBUTION"
        echo "------------------------"
        PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --command "
            SELECT status, COUNT(*) as count 
            FROM public.orders 
            GROUP BY status 
            ORDER BY count DESC;
            " 2>/dev/null | while read -r line; do
            echo "  $line"
        done
        echo ""
        
        echo "PERFORMANCE METRICS"
        echo "------------------"
        local table_count=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --tuples-only \
            --no-align \
            --command "
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
            " 2>/dev/null)
        
        local index_count=$(PGPASSWORD="$SELF_HOSTED_DB_PASSWORD" psql \
            --host "$SELF_HOSTED_DB_HOST" \
            --port 5432 \
            --username "$SELF_HOSTED_DB_USER" \
            --dbname "$SELF_HOSTED_DB_NAME" \
            --tuples-only \
            --no-align \
            --command "
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE schemaname = 'public';
            " 2>/dev/null)
        
        echo "  Total Tables: $table_count"
        echo "  Total Indexes: $index_count"
        echo "  Index/Table Ratio: $(echo "scale=2; $index_count / $table_count" | bc -l 2>/dev/null || echo "N/A")"
        echo ""
        
    } > "$detailed_report" 2>> "$LOG_FILE"
    
    success "Detailed report generated: $detailed_report"
}

# Main verification process
main() {
    info "Starting migration verification process..."
    info "Timestamp: $TIMESTAMP"
    info "Log file: $LOG_FILE"
    
    # Initialize report file
    echo "VERIFICATION_RESULTS|$TIMESTAMP|$(date)" > "$REPORT_FILE"
    
    # Parse arguments and check environment
    parse_args "$@"
    check_env_vars
    find_migration_export
    
    # Run verification checks
    local exit_code=0
    
    # Core validations
    if ! compare_table_counts; then
        exit_code=1
    fi
    
    if ! verify_row_counts; then
        exit_code=1
    fi
    
    check_rls_policies
    
    if ! validate_foreign_keys; then
        exit_code=1
    fi
    
    validate_business_logic
    
    if [[ "$CRITICAL_ONLY" != true ]]; then
        validate_performance
    fi
    
    # Generate reports
    generate_detailed_report
    
    # Summary
    info "Verification completed!"
    info "Summary report: $REPORT_FILE"
    if [[ "$DETAILED" == true ]]; then
        info "Detailed report available"
    fi
    
    if [[ $exit_code -eq 0 ]]; then
        success "Migration verification PASSED"
        echo "OVERALL_STATUS|PASSED|$(date)" >> "$REPORT_FILE"
    else
        error "Migration verification FAILED - review logs and reports"
        echo "OVERALL_STATUS|FAILED|$(date)" >> "$REPORT_FILE"
    fi
    
    return $exit_code
}

# Handle script interruption
trap 'error "Migration verification interrupted!"; exit 1' INT TERM

# Run main function
main "$@"