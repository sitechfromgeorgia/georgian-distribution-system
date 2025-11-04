@echo off

REM Georgian Distribution System - Supabase CLI Setup Script (Windows)
REM This script automates the initial Supabase CLI setup process

echo 🚀 Georgian Distribution System - Supabase CLI Setup
echo ======================================================

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found. Installing...
    
    REM Check if npm is available
    where npm >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo npm not found. Please install Node.js first: https://nodejs.org
        exit /b 1
    )
    
    REM Install Supabase CLI via npm
    npm install -g supabase
    echo ✅ Supabase CLI installed successfully
) else (
    echo ✅ Supabase CLI already installed
)

REM Check if user is logged in (simple check)
echo 🔐 Checking Supabase authentication...
supabase projects list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Please log in to Supabase...
    supabase login
    if %ERRORLEVEL% NEQ 0 (
        echo Authentication failed. Please try again.
        exit /b 1
    )
)

REM Initialize Supabase if not already done
if not exist "supabase\config.toml" (
    echo 📁 Initializing Supabase project...
    supabase init
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to initialize Supabase project
        exit /b 1
    )
) else (
    echo ✅ Supabase already initialized
)

REM Start services
echo 🚀 Starting Supabase services...
supabase start
if %ERRORLEVEL% NEQ 0 (
    echo Failed to start Supabase services
    exit /b 1
)

REM Apply migrations
echo 📊 Applying database migrations...
supabase db reset
if %ERRORLEVEL% NEQ 0 (
    echo Failed to apply migrations
    exit /b 1
)

REM Generate TypeScript types
echo 🔧 Generating TypeScript types...
supabase gen types typescript --local > ..\frontend\src\types\database.types.ts
if %ERRORLEVEL% NEQ 0 (
    echo Failed to generate TypeScript types
    exit /b 1
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo Available services:
echo   Frontend:    http://localhost:3000
echo   Studio:      http://localhost:54323
echo   API:         http://localhost:54321
echo   Inbucket:    http://localhost:54324
echo.
echo To stop services: supabase stop
echo To view logs: supabase logs
echo.
echo Happy developing! 🚀

pause