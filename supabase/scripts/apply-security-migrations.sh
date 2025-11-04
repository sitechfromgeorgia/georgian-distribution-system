#!/bin/bash

#
# Apply Security Migrations Script
# Applies audit_logs and api_keys table migrations
#

set -e  # Exit on error

echo "========================================="
echo "Security Migrations Application Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}This script will apply the following migrations:${NC}"
echo "  1. 20251104000001_create_audit_logs_table.sql"
echo "  2. 20251104000002_create_api_keys_table.sql"
echo ""

# Check if migrations exist
if [ ! -f "supabase/migrations/20251104000001_create_audit_logs_table.sql" ]; then
    echo -e "${RED}Error: audit_logs migration file not found${NC}"
    exit 1
fi

if [ ! -f "supabase/migrations/20251104000002_create_api_keys_table.sql" ]; then
    echo -e "${RED}Error: api_keys migration file not found${NC}"
    exit 1
fi

# Ask for confirmation
read -p "Do you want to proceed with migration? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Checking Supabase connection...${NC}"

# Test connection
if ! supabase db push --dry-run; then
    echo -e "${RED}Error: Cannot connect to Supabase${NC}"
    echo "Make sure you have:"
    echo "  1. Initialized Supabase (supabase init)"
    echo "  2. Linked to your project (supabase link)"
    echo "  3. Set up your .env file with correct credentials"
    exit 1
fi

echo -e "${GREEN}✓ Connection successful${NC}"
echo ""

# Apply migrations
echo -e "${YELLOW}Applying migrations...${NC}"

if supabase db push; then
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}Migrations applied successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "Created tables:"
    echo "  ✓ audit_logs - Comprehensive security audit logging"
    echo "  ✓ api_keys - API key management with rotation"
    echo ""
    echo "Next steps:"
    echo "  1. Verify tables in Supabase dashboard"
    echo "  2. Check RLS policies are enabled"
    echo "  3. Test audit logging functionality"
    echo "  4. Generate first API keys for testing"
    echo ""
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}Migration failed!${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Please check the error messages above"
    echo "Common issues:"
    echo "  - Database connection failed"
    echo "  - Tables already exist"
    echo "  - Permission issues"
    echo ""
    exit 1
fi
