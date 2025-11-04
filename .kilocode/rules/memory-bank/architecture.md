Architecture Documentation: Georgian Distribution System (v2.1)
1. Guiding Principles

This document outlines the software architecture for the Georgian Distribution System. The design is guided by the following core principles:

Simplicity & Maintainability: The architecture prioritizes a streamlined, easy-to-understand structure to facilitate solo or small-team development, reduce maintenance overhead, and ensure long-term viability.

Separation of Concerns: A clear boundary exists between the frontend (presentation and user interaction) and the backend (data, logic, and security). This allows each part to evolve independently.

Security by Design: Security is not an afterthought. It is embedded at the core of the architecture, primarily through a robust authorization layer at the database level.

Leverage Managed Services (within Self-Hosting): The architecture relies on the integrated Supabase stack, which bundles a collection of powerful, open-source tools. This provides the benefits of a managed service (cohesion, functionality) within a self-hosted, controlled environment.

Dual Environment Support: The architecture now supports both local development and production environments, enabling efficient development workflows while maintaining production stability.

2. System Architecture Overview

The system employs a multi-tier, containerized architecture with dual environment support:

**Local Development Environment:**
- Tier 1: Frontend Application running locally on http://localhost:3000
- Tier 2: Local Supabase stack running on http://localhost:8000
- Configuration: `supabase-local/` directory with Docker Compose

**Production Environment:**
- Tier 1: Frontend Application on VPS with domain greenland77.ge
- Tier 2: VPS-hosted Supabase stack with domain data.greenland77.ge
- Configuration: Production Docker deployment via Dokploy

Both environments maintain identical functionality with different data and configuration contexts.

Conceptual Diagram:
```
+--------------------------------------------------------------------------------------+
|                                   User's Browser                                     |
| (Admin, Restaurant, Driver, Demo)                                                    |
+------------------------------------------+-------------------------------------------+
                                           | HTTPS
                                           v
+--------------------------------------------------------------------------------------+
|                            VPS (Virtual Private Server)                              |
|                                                                                      |
|  +---------------------------+       (Internal Docker Network)       +-------------------------+
|  |   Frontend Container      | <-----------------------------------> |   Supabase Stack        |
|  |                           |                                       |   (Docker Compose)      |
|  |   +-------------------+   |                                       |                         |
|  |   | Next.js App       |   |        +----------------------------> |   +-----------------+   |
|  |   | (React, shadcn)   |   |        |                              |   | API Gateway     |   |
|  |   +-------------------+   |        |                              |   | (Kong)          |   |
|  |                           |        |                              |   +-------+---------+   |
|  +---------------------------+        |                                          |           |
|                                        |                                          v           |
|                                        |     +-------------+      +-------------+      +-------------+
|                                        +---> | Auth        |----->|             |----->| Realtime    |
|                                        |     | (GoTrue)    |      |             |      | (WebSockets)|
|                                        |     +-------------+      |  PostgreSQL |      +-------------+
|                                        |                          |  (Database   |
|                                        |     +-------------+      |   with RLS) |      +-------------+
|                                        +---> | REST API    |----->|             |----->| Storage     |
|                                              | (PostgREST) |      |             |      | (Images)    |
|                                              +-------------+      +-------------+      +-------------+
|                                                                                       |
+--------------------------------------------------------------------------------------+

=== LOCAL DEVELOPMENT ENVIRONMENT ===

+--------------------------------------------------------------------------------------+
|                                  Developer's Machine                                  |
|                                                                                      |
|  +---------------------------+               +---------------------------+
|  |   Frontend Container      | <-------------> |   Local Supabase Stack    |
|  |                           |                 |                           |
|  |   Next.js App             |                 |   Docker Compose         |
|  |   http://localhost:3000   |                 |   http://localhost:8000  |
|  |                           |                 |                           |
|  +---------------------------+                 +---------------------------+

Local Environment URLs:
- Frontend: http://localhost:3000
- Supabase Studio: http://localhost:3001  
- API Gateway: http://localhost:8000
- Database: localhost:5432
```

3. Component Breakdown

3.1. Frontend Application (Next.js)

This is the presentation layer of the system, running in both local and production environments.

Technology: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn-ui.

Environment Configurations:

**Local Development:**
- Host: http://localhost:3000
- Environment File: `frontend/.env.local`
- Hot Reload: Enabled
- Debug Mode: Full debugging capabilities

**Production:**
- Host: https://greenland77.ge
- Environment File: Production environment variables
- Hot Reload: Disabled
- Debug Mode: Production error tracking

Responsibilities:

Rendering the user interface for all roles (Admin, Restaurant, Driver, Demo).

Handling user interactions and client-side state.

Communicating with the Supabase backend via the supabase-js client library.

Providing role-specific layouts and routing.

Seamlessly connecting to either local or production backend based on environment configuration.

Structure:

App Router (/app): The core of the application structure, leveraging nested layouts and server/client component patterns.

Feature-Based Directories (/src/features): Code is organized by feature (e.g., orders, products, auth) to improve modularity and maintainability. Each feature directory contains its own components, hooks, and utility functions.

Role-Specific Layouts: The App Router is used to create distinct layouts (e.g., AdminLayout, DriverLayout) that wrap the UI for each user role, providing consistent navigation and context.

Server vs. Client Components: Server Components are used by default for performance (e.g., fetching and displaying static data). Client Components are used for interactive elements that require state or browser APIs.

3.2. Backend Services (Dual Environment Supabase)

**Local Development Backend:**
This is the local development instance of the logical and data layer.

Technology: Local Docker Compose stack in `supabase-local/` directory.

Configuration:
- Container Prefix: `supabase`
- API Gateway: http://localhost:8000
- Studio: http://localhost:3001
- Database: localhost:5432
- Environment File: `supabase-local/.env`

**Production Backend:**
This is the production VPS instance of the logical and data layer.

Technology: The official Supabase Docker stack, including PostgreSQL, GoTrue, PostgREST, Realtime, Kong, and more, running on a VPS with the container prefix `distribution-supabase-yzoh2u-supabase`.

Configuration:
- API Gateway: https://data.greenland77.ge
- Studio: Available via Dokploy interface
- Database: VPS-hosted PostgreSQL
- Environment: Production Docker deployment

Common Responsibilities (Both Environments):

Data Persistence: PostgreSQL is the single source of truth for all application data.

Authentication & Authorization: GoTrue handles user authentication. Authorization is enforced by PostgreSQL's Row-Level Security (RLS).

Business Logic: While some logic resides in the frontend, the core business rules and data integrity are enforced at the database level through RLS policies, constraints, and functions.

Real-time Communication: The Realtime engine listens for database changes and broadcasts them to subscribed clients via WebSockets.

Data Model:

The database schema is designed with a relational-first approach.

Core tables include profiles (extending auth.users to include role), products, orders, and order_items.

Foreign key constraints are used to ensure data integrity.

The role column in the profiles table is the cornerstone of the entire security model.

**Production Configuration:**
- Domain: data.greenland77.ge
- Database: PostgreSQL with logical replication enabled
- Connection Pooling: Supavisor with transaction pooling on port 6543
- API Gateway: Kong on ports 800/843
- Authentication: GoTrue with email/phone signup enabled

**Local Configuration:**
- Domain: localhost
- Database: Local PostgreSQL container
- Connection Pooling: Local Supavisor instance
- API Gateway: Local Kong instance
- Authentication: Development-grade authentication settings

4. Data Flow & Workflows

4.1. User Authentication & Authorization Flow

**Local Development:**
A user enters their credentials into the Next.js login form on http://localhost:3000.

The supabase-js client calls the local Supabase Auth (GoTrue) endpoint at http://localhost:8000.

GoTrue verifies the credentials against the auth.users table in the local database.

Upon success, GoTrue generates a JSON Web Token (JWT) containing the user's ID and role information.

This JWT is returned to the client and stored securely in the browser.

For all subsequent API requests, the supabase-js client automatically attaches this JWT in the Authorization header.

The API Gateway (Kong) and PostgREST inspect the JWT. PostgreSQL uses the user ID from the JWT to apply the appropriate RLS policies for any database query.

**Production:**
Same flow as local development, but all requests go to https://data.greenland77.ge instead of localhost URLs.

4.2. Order Processing & Real-time Update Flow

**Local Development:**
Placement: A Restaurant user submits a new order on http://localhost:3000. The Next.js app sends a request via supabase-js to insert a new row into the orders table.

Database Trigger: The insertion into the orders table is successful (as permitted by RLS policies).

Real-time Broadcast: The local Supabase Realtime engine detects the INSERT event.

Notification Push: Realtime broadcasts a payload to all subscribed clients on localhost.

Admin UI Update: The Administrator's Next.js app receives the payload and updates the UI instantly.

**Production:**
Same flow as local development, but executed on the production VPS environment.

4.3. Environment Switching Workflow

**Development Workflow:**
1. Developer starts local environment: `cd supabase-local && start.bat`
2. Developer starts frontend: `cd frontend && npm run dev`
3. Developer makes changes and tests locally
4. After validation, changes are deployed to production VPS

**Switching Between Environments:**
The frontend can switch between local and production by changing environment variables:
- Local: `NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000`
- Production: `NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge`

5. Security Architecture

**Local Development Security:**
Development-specific JWT secrets and database credentials
Local authentication settings for easy testing
Development-only SMTP configuration
No production data exposure

**Production Security:**
Strong JWT secrets and secure database credentials
Production-grade authentication with email verification
Secure SMTP configuration
VPS-level firewall and security measures

**Common Security Features (Both Environments):**
Authentication: Handled by Supabase Auth (JWTs).

Authorization (The Core of Security): The system relies on Row-Level Security (RLS) in PostgreSQL. This is a "deny by default" model. No data can be accessed unless an explicit RLS policy allows it.

Example RLS Policy:

```sql
-- Policy: Allow a restaurant to see only its own orders.
CREATE POLICY "Allow restaurants to see their own orders"
ON "public"."orders" FOR SELECT
TO authenticated
USING (
  -- Check if the user's role is 'restaurant' and the order's restaurant_id matches their own id
  (get_my_claim('role')::text = 'restaurant') AND (restaurant_id = auth.uid())
);
```

API Security: The API generated by PostgREST is stateless and respects all RLS policies. No custom API endpoints need to be written or secured, drastically reducing the attack surface.

Data Validation: All data from the frontend is validated using Zod schemas before being sent to the backend. This prevents malformed data from ever reaching the API.

Secrets Management: All sensitive information (database passwords, JWT secrets, API keys) is managed through environment variables and passed securely to the Docker containers at runtime. These secrets are not part of the codebase.

6. Scalability & Performance

**Frontend Performance:**

Local Development:
- Hot reload for instant feedback
- Source maps for debugging
- Development build optimizations

Production:
- Next.js Optimization: Leverages Server Components, automatic code splitting, and image optimization to ensure fast initial page loads.
- Client-Side Caching: TanStack Query provides a powerful caching layer, reducing redundant API calls and making the UI feel instantaneous.

**Backend Scalability:**

Local Development:
- Suitable for development workloads
- Resource limits based on development machine capabilities
- Easy reset and restart for testing

Production:
- Connection Pooling: The Supabase stack includes Supavisor, a connection pooler that allows the system to handle thousands of concurrent database connections efficiently.
- Stateless Backend: The API layer is stateless, allowing for horizontal scaling if ever needed.
- Database Performance: Proper indexing of database tables is critical and will be a key area of focus to ensure queries remain fast as data grows.

**Environment Isolation:**
- Complete data separation between local and production
- Independent testing without affecting live data
- Consistent behavior across both environments
- Easy rollback and reset capabilities in development

7. Development Workflow Benefits

**Rapid Development:**
- Local testing without VPS dependency
- Instant feedback on code changes
- Safe environment for experimentation

**Data Safety:**
- Production data never affected by development activities
- Easy reset and restart capabilities
- Independent database contexts

**Quality Assurance:**
- Full feature parity between environments
- Consistent testing methodology
- Confidence in production deployments

This dual-environment architecture ensures developers can work efficiently while maintaining the security and stability of the production environment.