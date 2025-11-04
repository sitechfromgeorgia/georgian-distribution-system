#!/bin/bash

echo "🌐 Starting Frontend Development Server..."

# Change to frontend directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting Next.js development server..."
echo ""
echo "🔗 Frontend will be available at: http://localhost:3000"
echo "📊 Make sure Supabase backend is running on: http://localhost:8000"
echo ""

# Start the development server
npm run dev