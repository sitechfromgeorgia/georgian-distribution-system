# Tasks Documentation - Georgian Distribution System

This file documents repetitive tasks and their workflows for future reference. Each task includes step-by-step instructions, files to modify, and important considerations.

---

## Task: Set Up Development Environment with Official Supabase

**Last performed:** 2025-10-30
**Files to modify:**
- `frontend/.env.local` - Frontend environment configuration for development
- Official Supabase project at https://supabase.com - Managed through dashboard and MCP tools

**Steps:**

### Initial Setup
1. Access official Supabase account at https://supabase.com
2. Create or access existing project for Georgian Distribution System
3. Configure project settings through Supabase dashboard
4. Use MCP tools for database management and schema operations

### Frontend Connection Setup
1. Update `frontend/.env.local` with official Supabase project credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
   ```
2. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Access the application at http://localhost:3000

### Development Workflow
- Use Supabase Studio (web dashboard) for database management
- Leverage MCP tools for schema changes and data operations
- Test features directly against official Supabase project
- No local infrastructure setup required

**Important notes:**
- Official Supabase provides managed hosting with automatic scaling
- MCP integration enables seamless database operations
- Development environment is isolated from production
- Real-time collaboration features available
- Built-in backup and recovery included

---

## Task: Switch Between Development and Production Environments

**Last performed:** 2025-10-30
**Files to modify:**
- `frontend/.env.local` - Development configuration
- `frontend/.env.production` - Production configuration (if needed)

**Steps:**

### Switch to Development
1. Access official Supabase account at https://supabase.com
2. Ensure project is active and MCP tools are connected
3. Update frontend environment:
   ```bash
   cd frontend
   # Use development .env.local with official Supabase URLs and keys
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-development-anon-key
   ```
4. Start frontend: `npm run dev`
5. Test connection to official Supabase project

### Switch to Production
1. Update frontend environment:
   ```bash
   cd frontend
   # Use production environment variables
   NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1Mzg1MTcsImV4cCI6MTg5MzQ1NjAwMCwiaXNzIjoiZG9rcGxveSJ9.H6yK0iElM0fRBKcQs_KIIDy4Zjj_fKOpx7QEibXVBsc
   ```
2. Deploy or access production frontend
3. Verify connection to https://data.greenland77.ge

### Verification Steps
1. Test authentication in the switched environment
2. Verify database connectivity
3. Check real-time functionality
4. Test user role permissions
5. Confirm API endpoints are responding correctly

**Important notes:**
- Development and production databases are completely separate
- User accounts and data don't sync between environments
- Always test in development environment before deploying to production
- Production environment requires proper domain configuration and SSL certificates
- MCP tools work with both development and production environments

---

*This file will be updated as new repetitive tasks are identified and documented.*