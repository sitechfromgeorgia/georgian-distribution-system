Architecture Documentation: Georgian Distribution System (v2.0)
1. Guiding Principles

This document outlines the software architecture for the Georgian Distribution System. The design is guided by the following core principles:

Simplicity & Maintainability: The architecture prioritizes a streamlined, easy-to-understand structure to facilitate solo or small-team development, reduce maintenance overhead, and ensure long-term viability.

Separation of Concerns: A clear boundary exists between the frontend (presentation and user interaction) and the backend (data, logic, and security). This allows each part to evolve independently.

Security by Design: Security is not an afterthought. It is embedded at the core of the architecture, primarily through a robust authorization layer at the database level.

Leverage Managed Services (within Self-Hosting): The architecture relies on the integrated Supabase stack, which bundles a collection of powerful, open-source tools. This provides the benefits of a managed service (cohesion, functionality) within a self-hosted, controlled environment.

2. System Architecture Overview

The system employs a two-tier, containerized architecture running on a single Virtual Private Server (VPS).

Tier 1: Frontend Application: A Docker container running a Next.js web application. This is the user-facing component that browsers interact with.

Tier 2: Backend Services: A Docker Compose stack running the complete self-hosted Supabase platform. This tier handles all data, authentication, and real-time communication.

Conceptual Diagram:
code
Code
download
content_copy
expand_less
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
|  |   | Next.js App       |   |                                       |   +-----------------+   |
|  |   | (React, shadcn)   |   |        +----------------------------> |   | API Gateway     |   |
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
3. Component Breakdown
3.1. Frontend Application (Next.js)

This is the presentation layer of the system.

Technology: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn-ui.

Responsibilities:

Rendering the user interface for all roles (Admin, Restaurant, Driver, Demo).

Handling user interactions and client-side state.

Communicating with the Supabase backend via the supabase-js client library.

Providing role-specific layouts and routing.

Structure:

App Router (/app): The core of the application structure, leveraging nested layouts and server/client component patterns.

Feature-Based Directories (/src/features): Code is organized by feature (e.g., orders, products, auth) to improve modularity and maintainability. Each feature directory contains its own components, hooks, and utility functions.

Role-Specific Layouts: The App Router is used to create distinct layouts (e.g., AdminLayout, DriverLayout) that wrap the UI for each user role, providing consistent navigation and context.

Server vs. Client Components: Server Components are used by default for performance (e.g., fetching and displaying static data). Client Components are used for interactive elements that require state or browser APIs.

3.2. Backend Services (Self-Hosted Supabase)

This is the logical and data layer of the system.

Technology: The official Supabase Docker stack, including PostgreSQL, GoTrue, PostgREST, Realtime, Kong, and more, running on a VPS with the container prefix `distribution-supabase-yzoh2u-supabase`.

Responsibilities:

Data Persistence: PostgreSQL is the single source of truth for all application data.

Authentication & Authorization: GoTrue handles user authentication. Authorization is enforced by PostgreSQL's Row-Level Security (RLS).

Business Logic: While some logic resides in the frontend, the core business rules and data integrity are enforced at the database level through RLS policies, constraints, and functions.

Real-time Communication: The Realtime engine listens for database changes and broadcasts them to subscribed clients via WebSockets.

Data Model:

The database schema is designed with a relational-first approach.

Core tables include profiles (extending auth.users to include role), products, orders, and order_items.

Foreign key constraints are used to ensure data integrity.

The role column in the profiles table is the cornerstone of the entire security model.

Production Configuration:
- Domain: data.greenland77.ge
- Database: PostgreSQL with logical replication enabled
- Connection Pooling: Supavisor with transaction pooling on port 6543
- API Gateway: Kong on ports 800/843
- Authentication: GoTrue with email/phone signup enabled

4. Data Flow & Workflows
4.1. User Authentication & Authorization Flow

A user enters their credentials into the Next.js login form.

The supabase-js client calls the Supabase Auth (GoTrue) endpoint.

GoTrue verifies the credentials against the auth.users table in the database.

Upon success, GoTrue generates a JSON Web Token (JWT) containing the user's ID and role information.

This JWT is returned to the client and stored securely in the browser.

For all subsequent API requests, the supabase-js client automatically attaches this JWT in the Authorization header.

The API Gateway (Kong) and PostgREST inspect the JWT. PostgreSQL uses the user ID from the JWT to apply the appropriate RLS policies for any database query.

4.2. Order Processing & Real-time Update Flow

Placement: A Restaurant user submits a new order. The Next.js app sends a request via supabase-js to insert a new row into the orders table.

Database Trigger: The insertion into the orders table is successful (as permitted by RLS policies).

Real-time Broadcast: The Supabase Realtime engine, which is listening for database changes, detects the INSERT event.

Notification Push: Realtime broadcasts a payload to all subscribed clients, specifically targeting the Administrator's client.

Admin UI Update: The Administrator's Next.js app, which has a real-time subscription active, receives the payload and updates the UI instantly (e.g., shows a "New Order" notification and adds it to the list) without needing a page refresh.

5. Security Architecture

Authentication: Handled by Supabase Auth (JWTs).

Authorization (The Core of Security): The system relies on Row-Level Security (RLS) in PostgreSQL. This is a "deny by default" model. No data can be accessed unless an explicit RLS policy allows it.

Example RLS Policy:

code
SQL
download
content_copy
expand_less
-- Policy: Allow a restaurant to see only its own orders.
CREATE POLICY "Allow restaurants to see their own orders"
ON "public"."orders" FOR SELECT
TO authenticated
USING (
  -- Check if the user's role is 'restaurant' and the order's restaurant_id matches their own id
  (get_my_claim('role')::text = 'restaurant') AND (restaurant_id = auth.uid())
);

API Security: The API generated by PostgREST is stateless and respects all RLS policies. No custom API endpoints need to be written or secured, drastically reducing the attack surface.

Data Validation: All data from the frontend is validated using Zod schemas before being sent to the backend. This prevents malformed data from ever reaching the API.

Secrets Management: All sensitive information (database passwords, JWT secrets, API keys) is managed through environment variables and passed securely to the Docker containers at runtime. These secrets are not part of the codebase.

6. Scalability & Performance

Frontend Performance:

Next.js Optimization: Leverages Server Components, automatic code splitting, and image optimization to ensure fast initial page loads.

Client-Side Caching: TanStack Query provides a powerful caching layer, reducing redundant API calls and making the UI feel instantaneous.

Backend Scalability:

Connection Pooling: The Supabase stack includes Supavisor, a connection pooler that allows the system to handle thousands of concurrent database connections efficiently.

Stateless Backend: The API layer is stateless, allowing for horizontal scaling if ever needed (though not a primary concern for the initial architecture).

Database Performance: Proper indexing of database tables is critical and will be a key area of focus to ensure queries remain fast as data grows.