# Project Structure Analysis

**Documented:** 2025-10-31  
**Project:** Georgian Distribution System

## Root Directory Structure

```
Distribution-Managment/
├── .kilocode/                    # Kilocode AI Agent configuration and rules
│   ├── rules/
│   │   └── memory-bank/          # Project knowledge base and documentation
│   │       ├── brief.md          # Project brief and requirements
│   │       ├── architecture.md   # System architecture documentation
│   │       ├── tech.md          # Technology stack documentation
│   │       ├── context.md       # Current project context
│   │       ├── nextjs.instructions.md # Next.js best practices
│   │       ├── supabasedocs/    # Supabase technical documentation
│   │       └── tasks.md         # Documented tasks and workflows
│   ├── workflows/
│   │   └── speckit.tasks.md     # Speckit workflow configurations
│   └── mcp.json                 # MCP servers configuration
├── .vscode/                     # VS Code workspace configuration
│   ├── settings.json           # VS Code workspace settings
│   └── mcp.json                # VS Code MCP configuration
├── frontend/                    # Next.js application
│   ├── src/                     # Source code directory
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── (auth)/          # Authentication routes
│   │   │   ├── (dashboard)/     # Dashboard routes with layouts
│   │   │   ├── (public)/        # Public routes
│   │   │   ├── api/             # API routes
│   │   │   └── globals.css      # Global styles
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── admin/           # Admin dashboard components
│   │   │   ├── orders/          # Order management components
│   │   │   └── notifications/   # Notification components
│   │   ├── lib/                 # Utility libraries
│   │   │   ├── supabase/        # Supabase client and services
│   │   │   ├── validators/      # Zod validation schemas
│   │   │   └── utils.ts         # Utility functions
│   │   ├── services/            # Business logic services
│   │   │   ├── auth/            # Authentication service
│   │   │   ├── orders/          # Order management service
│   │   │   └── admin/           # Admin service
│   │   ├── types/               # TypeScript type definitions
│   │   ├── constants/           # Application constants
│   │   └── hooks/               # Custom React hooks
│   ├── public/                  # Static assets
│   ├── package.json             # Dependencies and scripts
│   ├── next.config.ts           # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── eslint.config.mjs        # ESLint configuration
│   ├── postcss.config.mjs       # PostCSS configuration
│   └── .env.local               # Environment variables
├── database_migration_initial_schema.sql  # Initial database schema
├── start-frontend.bat           # Frontend startup script
└── project-documentation/       # This documentation
```

## File Type Analysis

### Configuration Files
- **package.json** - Node.js dependencies and npm scripts
- **next.config.ts** - Next.js application configuration
- **tailwind.config.ts** - Tailwind CSS framework configuration  
- **tsconfig.json** - TypeScript compiler configuration
- **eslint.config.mjs** - ESLint code quality configuration
- **postcss.config.mjs** - PostCSS processor configuration
- **.env.local** - Environment variables for development

### Source Code Files
- **.tsx files** - React components with TypeScript
- **.ts files** - TypeScript modules, services, utilities
- **.css files** - Styling and layout definitions
- **.json files** - Configuration and data files

### Documentation Files
- **.md files** - Markdown documentation and README files
- **SQL files** - Database schema and migration files

### Build and Deployment Files
- **.bat files** - Windows batch scripts for automation
- **Docker configurations** - Container deployment (referenced in docs)

## Component Architecture

### Next.js App Router Structure
```
frontend/src/app/
├── (auth)/              # Authentication section
│   ├── login/           # Login page
│   └── register/        # Registration page
├── (dashboard)/         # Dashboard section with layouts
│   ├── admin/           # Admin dashboard
│   ├── restaurant/      # Restaurant dashboard  
│   ├── driver/          # Driver dashboard
│   └── demo/            # Demo user dashboard
├── (public)/            # Public routes
│   └── landing/         # Landing page
├── api/                 # API routes
│   └── auth/            # Authentication endpoints
├── layout.tsx           # Root layout
├── page.tsx             # Root page
└── globals.css          # Global styles
```

### Component Organization
```
frontend/src/components/
├── ui/                  # shadcn/ui base components
│   ├── button.tsx       # Button component
│   ├── card.tsx         # Card component
│   ├── dialog.tsx       # Dialog component
│   ├── alert.tsx        # Alert component
│   └── ...
├── auth/                # Authentication components
│   ├── AuthProvider.tsx # Authentication context
│   ├── LoginForm.tsx    # Login form
│   └── SessionTimeoutModal.tsx # Session management
├── admin/               # Admin dashboard components
│   ├── ProductForm.tsx  # Product management
│   └── ...
├── orders/              # Order management components
│   └── OrderTable.tsx   # Order listing and management
└── notifications/       # Notification components
    └── NotificationCenter.tsx # Notification system
```

### Service Layer Architecture
```
frontend/src/services/
├── auth/                # Authentication service
│   └── auth.service.ts  # Auth logic and API calls
├── orders/              # Order management service
│   └── order.service.ts # Order CRUD operations
└── admin/               # Admin functionality
    └── admin.service.ts # Admin-specific operations
```

### Library Organization
```
frontend/src/lib/
├── supabase/            # Supabase integration
│   ├── client.ts        # Supabase client configuration
│   └── realtime.service.ts # Real-time subscriptions
├── validators/          # Data validation schemas
│   ├── auth/            # Auth validation
│   ├── orders/          # Order validation
│   ├── products/        # Product validation
│   └── index.ts         # Validator exports
└── utils.ts             # Shared utilities
```

## Data Flow Architecture

### Frontend to Backend Communication
1. **Services Layer** - Business logic and API calls
2. **Supabase Client** - Database and auth integration
3. **React Components** - UI rendering and user interaction
4. **Validation Layer** - Zod schemas for data integrity

### State Management
- **React Context** - Authentication state
- **React Query** - Server state management
- **Zustand** - Client-side state management
- **Local State** - Component-level state with useState

### Real-time Features
- **Supabase Realtime** - WebSocket connections for live updates
- **React Query** - Automatic data synchronization
- **Custom Hooks** - Real-time subscription management

## Security Architecture

### Authentication Flow
1. **Login/Register** - Supabase Auth integration
2. **Session Management** - JWT token handling
3. **Route Protection** - Role-based access control
4. **API Security** - RLS policies on database level

### Data Validation
- **Zod Schemas** - Client-side validation
- **Supabase RLS** - Server-side authorization
- **TypeScript** - Type safety enforcement

## Development Workflow Integration

### VS Code Integration
- **Extensions** - 34 development extensions installed
- **MCP Servers** - 9 specialized servers for AI assistance
- **Workspace Settings** - Optimized for Next.js development

### AI-Assisted Development
- **Kilocode AI Agent** - Primary development assistant
- **GitHub Copilot** - Code completion and suggestions
- **Continue AI** - Alternative AI development assistant
- **Perplexity MCP** - Research and documentation lookup

### Quality Assurance
- **ESLint** - Code quality enforcement
- **TypeScript** - Static type checking
- **Prettier** - Code formatting
- **shadcn/ui Audit** - 99.3% compatibility score

This structure supports the Georgian Distribution System's requirements for a modern, scalable, and maintainable web application with role-based access control and real-time features.