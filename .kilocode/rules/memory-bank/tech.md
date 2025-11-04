Technology Stack (v2.2)
1. Core Architecture

The entire system is built on a modern, decoupled architecture with dual-environment support. A Next.js frontend application communicates with both an official Supabase development project and a production VPS Supabase backend. This provides flexibility for development while maintaining production stability.

**Environment Setup:**
- **Development**: Official Supabase project at https://supabase.com for easy development and testing
- **Production**: Self-hosted Supabase on VPS for live operations

2. Backend: Supabase (Dual Environment Setup)

Supabase serves as the unified backend-as-a-service (BaaS), providing all necessary functionality through a collection of integrated, open-source tools running in Docker environments.

**Development Environment (Official Supabase):**
- Platform: https://supabase.com (Official hosted platform)
- Project: Available through MCP integration
- Studio: Web-based dashboard at project URL
- Database: Hosted PostgreSQL with real-time features
- Configuration: Managed through Supabase dashboard
- Advantages: No local setup required, managed by Supabase, MCP integration available

**Production Environment (VPS):**
- Location: VPS at data.greenland77.ge
- URLs: 
  - Backend: https://data.greenland77.ge
  - Frontend: https://greenland77.ge
- Configuration: Production Docker deployment via Dokploy

**Common Features (Both Environments):**

Database: PostgreSQL 15+. The single source of truth for all application data, including users, products, orders, and relationships. Row-Level Security (RLS) is heavily utilized to enforce data access policies directly at the database level.

Authentication: Supabase Auth (GoTrue). Manages the entire user lifecycle, including secure authentication, session management using JWTs, and role-based access control (RBAC). It handles user sign-in and secures API access.

API Layer:

PostgREST: Automatically generates a secure, RESTful API directly from the PostgreSQL schema, allowing for rapid development and data access.

Storage API: Manages file storage, used primarily for product images. Integrates with database policies for access control.

Real-time Engine: Supabase Realtime. Provides real-time functionality using WebSockets, enabling instant notifications and live data synchronization across the platform for features like order status updates.

API Gateway: Kong. Sits in front of all Supabase services, managing API requests, routing, and security.

3. Frontend: Next.js Application

The user-facing application is a modern web app built with the following technologies.

Framework: Next.js (latest version) with the App Router. This enables a powerful combination of Server Components for performance and Client Components for interactivity.

UI Library: React (latest version).

Language: TypeScript. Enforces type safety across the entire frontend codebase.

Styling: Tailwind CSS. A utility-first CSS framework for rapid and consistent UI development.

Component Library: shadcn-ui. The exclusive component library used to build the entire user interface, providing accessible, reusable, and beautifully designed components.

**shadcn/ui Implementation Status:** ✅ **EXCELLENT** (99.3% registry compatibility)
- **Audit Completed:** 2025-10-31
- **Components Validated:** Button (100%), Card (100%), Alert (100%), Dialog (99%), Input (100%), Table (95%), Utils (100%)
- **Quality Level:** Professional-grade implementation following official patterns
- **Browser Compatibility:** Modern React 19 and Next.js 15.1.6 with Tailwind CSS v4
- **Performance:** Optimized with proper tree-shaking and code splitting
- **Accessibility:** Full ARIA support and keyboard navigation
- **Audit Report:** `frontend/shadcn-ui-audit-report.md`

State Management:

Zustand: For lightweight, simple client-side state management.

React Query (TanStack Query): For managing server state, including caching, refetching, and optimistic updates of data fetched from the Supabase API.

4. Development & Deployment (DevOps)

Containerization: Docker & Docker Compose. The production platform (VPS Supabase backend and Next.js application) is containerized. This ensures a consistent and reproducible environment for production deployment.

**Development Setup:**
- Backend: Official Supabase platform at https://supabase.com with MCP integration for seamless development
- Frontend: `frontend/` directory with `start-frontend.bat`
- Advantages: No local infrastructure setup required, managed hosting, MCP tools for database management

**Production Deployment:**
- Deployment Platform: Dokploy. Used to manage the deployment and orchestration of the Docker containers on the production VPS.
- Backend: VPS-hosted Supabase stack
- Frontend: Production Next.js deployment

Code Quality:

ESLint: For static code analysis and enforcing code style.

Prettier: For automated code formatting.

Testing:

Jest: As the primary testing framework.

React Testing Library: For testing UI components in a user-centric way.

5. Key Libraries & Tools

@supabase/supabase-js: The official JavaScript client library for interacting with the Supabase backend (authentication, database queries, real-time subscriptions, etc.).

zod: For schema declaration and validation, used to ensure data integrity for form inputs and API requests.

react-hook-form: For building robust and performant forms.

date-fns: For reliable and straightforward date manipulation.

lucide-react: For a clean and consistent icon library.

recharts: For creating the charts and graphs used in the Administrator's analytics dashboard.

6. Production Supabase Configuration (VPS)

The system uses a self-hosted Supabase instance running on a VPS with the following configuration:

Container Prefix: `distribution-supabase-yzoh2u-supabase`

**Domains:**
- Backend: data.greenland77.ge
- Frontend: greenland77.ge

**Database Configuration:**
- POSTGRES_HOST: db
- POSTGRES_DB: postgres
- POSTGRES_PORT: 5432
- POSTGRES_PASSWORD: d5zvvwy8y9kn80w2eid7qjhj21g6e4ia

**JWT & Security:**
- JWT_SECRET: 1a7tzs6y7ffxfipaj9muf6bhnafxqwf1
- ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1Mzg1MTcsImV4cCI6MTg5MzQ1NjAwMCwiaXNzIjoiZG9rcGxveSJ9.H6yK0iElM0fRBKcQs_KIIDy4Zjj_fKOpx7QEibXVBsc
- SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1Mzg1MTcsImV4cCI6MTg5MzQ1NjAwMCwiaXNzIjoiZG9rcGxveSJ9.H6yK0iElM0fRBKcQs_KIIDy4Zjj_fKOpx7QEibXVBsc

**API Configuration:**
- SUPABASE_PUBLIC_URL: https://data.greenland77.ge
- API_EXTERNAL_URL: https://data.greenland77.ge
- SITE_URL: https://data.greenland77.ge
- ADDITIONAL_REDIRECT_URLS: https://data.greenland7.ge/*,http://localhost:3000/*
- JWT_EXPIRY: 360

**Supavisor (Connection Pooler):**
- POOLER_PROXY_PORT_TRANSACTION: 6543
- POOLER_DEFAULT_POOL_SIZE: 20
- POOLER_MAX_CLIENT_CONN: 100

**Kong API Gateway:**
- KONG_HTTP_PORT: 8000
- KONG_HTTPS_PORT: 8443

**Authentication (GoTrue):**
- ENABLE_EMAIL_SIGNUP: true
- ENABLE_EMAIL_AUTOCONFIRM: false
- ENABLE_PHONE_SIGNUP: true
- ENABLE_PHONE_AUTOCONFIRM: true
- SMTP Configuration:
  - SMTP_HOST: supabase-mail
  - SMTP_PORT: 2500
 - SMTP_ADMIN_EMAIL: admin@example.com
  - SMTP_USER: fake_mail_user
 - SMTP_PASS: fake_mail_password
 - SMTP_SENDER_NAME: fake_sender

**Studio Dashboard:**
- DASHBOARD_USERNAME: supabase
- DASHBOARD_PASSWORD: y8d8mtm3x30gv4jz5wvxc3exxbqcgav2
- STUDIO_PORT: 3000

7. Development Environment Configuration

The development environment uses the official Supabase platform at https://supabase.com with MCP integration for seamless development and database management.

**Platform Access:**
- URL: https://supabase.com
- Project: Managed through Supabase dashboard
- MCP Integration: Full database management and schema operations via MCP tools
- Studio: Web-based dashboard for database management and API testing

**Development Advantages:**
- No local infrastructure setup required
- Managed hosting with automatic scaling
- MCP tools provide direct database operations
- Real-time collaboration features
- Built-in backup and recovery

**Frontend Development:**
- Start Frontend: `cd frontend && start-frontend.bat`
- Environment: Connects to official Supabase project via MCP

8. Infrastructure Details

**VPS Provider:**
- **Platform**: Contabo cloud hosting infrastructure
- **Purpose**: Production-grade hosting for self-hosted Supabase deployment
- **Capabilities**: High-performance containerized applications with reliable uptime
- **Region**: Optimized for European markets with excellent connectivity to Georgia

**Deployment Manager:**
- **Platform**: Dockploy container orchestration platform
- **Purpose**: Streamlined deployment and management of Supabase stack
- **Features**: 
  - Automated Docker container deployment
  - Health monitoring and auto-recovery
  - SSL certificate management
  - Environment variable management
  - One-click scaling capabilities

**Production Domain Configuration:**
- **Backend Domain**: https://data.greenland77.ge (self-hosted Supabase)
- **Frontend Domain**: https://greenland77.ge (Next.js application)
- **SSL Management**: Automated SSL certificate provisioning via Dockploy
- **DNS Configuration**: Custom DNS records pointing to VPS infrastructure

**Development Backend:**
- **Platform**: Official Supabase project
- **Project ID**: akxmacfsltzhbnunoepb
- **URL**: https://akxmacfsltzhbnunoepb.supabase.co
- **Features**: Live database with real-time capabilities, managed authentication, file storage
- **Management**: Full integration with MCP tools for schema operations

9. Deployment Strategy

**Current Phase: Development on Hosted Supabase**
- **Backend**: Official Supabase platform for rapid development
- **Advantages**: No infrastructure setup required, managed scaling, built-in backup
- **Database**: Hosted PostgreSQL with automatic updates and security patches
- **Integration**: MCP tools provide seamless database management

**Future Phase: Self-Hosted Supabase on VPS**
- **Infrastructure**: Contabo VPS with Dockploy deployment manager
- **Migration**: Planned transition using prepared migration scripts
- **Benefits**: Full control, custom configurations, cost optimization
- **Timeline**: After development completion and testing validation

**Migration Strategy:**
- **Preparation**: Complete with export/import scripts tested
- **Execution**: Zero-downtime migration using prepared runbooks
- **Validation**: Comprehensive testing with rollback procedures
- **Monitoring**: 48-hour post-migration monitoring and validation

**Code Portability:**
- **Environment Detection**: Explicit environment variable checking
- **Configuration Management**: Environment-agnostic settings
- **Database Abstraction**: Supabase client handles environment differences
- **Testing**: All code works in both hosted and self-hosted environments

10. Monitoring & Observability
8. Monitoring & Observability

Sentry @sentry/nextjs v10.21.0+ - Error tracking and performance monitoring (PRIMARY MONITORING TOOL)

Status: ✅ Fully configured and operational (2025-01-19)

Organization: sitech-bg

Project: georgian-distribution

Region: EU (Germany)

DSN: https://1e2cc3980506265afeb61e9168f31de5@o451024214669312.ingest.de.sentry.io/451024454588336

UptimeRobot: An external service used to monitor the public-facing availability of the application and send alerts in case of downtime.

9. Security Implementation

Security is multi-layered, leveraging both the application and backend capabilities.

**Development Security:**
- Official Supabase managed security settings
- Development-grade authentication for easy testing
- MCP integration for secure database operations

**Production Security:**
- Strong JWT secrets and secure database credentials
- Production-grade authentication with email verification
- Secure SMTP configuration
- VPS-level firewall and security measures

**Common Security Features:**
Authentication: Handled by Supabase Auth, which provides secure JWT-based authentication.

Authorization: Primarily enforced at the database level using PostgreSQL's Row-Level Security (RLS). Policies are written to ensure that users can only access or modify data they are explicitly permitted to (e.g., a restaurant can only see its own orders).

API Security: The Supabase API gateway (Kong) and PostgREST handle API security, respecting JWTs and RLS policies.

Input Validation: Zod is used to validate all user-submitted data before it is sent to the backend, preventing invalid data from entering the system.

10. Environment Switching

The system supports seamless switching between development and production environments:

**Environment Variables:**
- Development: Uses `frontend/.env.local` for development (connects to official Supabase)
- Production: Uses production environment variables on VPS

**API Endpoint Switching:**
- Development: Official Supabase project URL
- Production: https://data.greenland77.ge

**Database Switching:**
- Development: Official Supabase hosted PostgreSQL
- Production: VPS-hosted PostgreSQL

**Authentication Switching:**
- Development: Official Supabase authentication settings
- Production: Production authentication with proper email verification

This dual-environment setup allows developers to:
- Test changes in development without affecting production data
- Develop and debug issues quickly using official Supabase platform
- Deploy confident changes to the production VPS
- Maintain data isolation between development and production