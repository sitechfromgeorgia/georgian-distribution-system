@echo off
echo 🌐 Starting Frontend Development Server...

REM Change to frontend directory
cd /d "%~dp0"

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo 🚀 Starting Next.js development server...
echo.
echo 🔗 Frontend will be available at: http://localhost:3000
echo 📊 Make sure Supabase backend is running on: http://localhost:8000
echo.

npm run dev