#!/bin/bash

# Georgian Distribution System - Supabase CLI Setup Script
# This script automates the initial Supabase CLI setup process

set -e

echo "🚀 Georgian Distribution System - Supabase CLI Setup"
echo "======================================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    
    # Detect OS and install Supabase CLI
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sSfL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xzO supabase > /tmp/supabase
        sudo mv /tmp/supabase /usr/local/bin/supabase
        sudo chmod +x /usr/local/bin/supabase
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo "Please install Homebrew first: https://brew.sh"
            exit 1
        fi
    else
        echo "Unsupported OS. Please install Supabase CLI manually."
        exit 1
    fi
fi

echo "✅ Supabase CLI installed successfully"

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please log in to Supabase..."
    supabase login
fi

# Initialize Supabase if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "📁 Initializing Supabase project..."
    supabase init
else
    echo "✅ Supabase already initialized"
fi

# Start services
echo "🚀 Starting Supabase services..."
supabase start

# Apply migrations
echo "📊 Applying database migrations..."
supabase db reset

# Generate TypeScript types
echo "🔧 Generating TypeScript types..."
supabase gen types typescript --local > ../frontend/src/types/database.types.ts

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Available services:"
echo "  Frontend:    http://localhost:3000"
echo "  Studio:      http://localhost:54323"
echo "  API:         http://localhost:54321"
echo "  Inbucket:    http://localhost:54324"
echo ""
echo "To stop services: supabase stop"
echo "To view logs: supabase logs"
echo ""
echo "Happy developing! 🚀"