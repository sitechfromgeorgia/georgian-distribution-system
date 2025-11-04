# Supabase Technical Documentation

## Overview

This directory contains comprehensive technical documentation for all Supabase services used in the **Georgian Distribution System** project. Each file provides in-depth coverage of a specific service with production-ready examples tailored to our B2B food distribution platform.

## Quick Reference

### Core Services
- [**01-supabase-auth.md**](./01-supabase-auth.md) - Authentication, JWT, RBAC for users (Admin, Restaurant, Driver, Demo)
- [**02-supabase-realtime.md**](./02-supabase-realtime.md) - WebSockets, Broadcast, Presence for real-time order tracking
- [**03-supabase-storage.md**](./03-supabase-storage.md) - File uploads for product images and restaurant logos
- [**04-postgrest-api.md**](./04-postgrest-api.md) - Auto-generated REST API for CRUD operations

### Database & Security
- [**05-row-level-security.md**](./05-row-level-security.md) - RLS policies for role-based data access
- [**07-database-design.md**](./07-database-design.md) - PostgreSQL schema, migrations, TypeScript types

### Development Tools
- [**06-supabase-client-js.md**](./06-supabase-client-js.md) - @supabase/supabase-js SDK for TypeScript/JavaScript
- [**08-supabase-cli.md**](./08-supabase-cli.md) - CLI commands for migrations and local development

### Advanced Topics
- [**09-integration-patterns.md**](./09-integration-patterns.md) - Next.js 15 + Supabase integration patterns
- [**10-security-best-practices.md**](./10-security-best-practices.md) - Production security guidelines
- [**11-performance-optimization.md**](./11-performance-optimization.md) - Query optimization, caching, indexing strategies

---

## Project Context

**Domains:**
- Frontend: greenland77.ge (Next.js 15.5.4 + React 19 + TypeScript)
- Backend: data.greenland77.ge (Self-hosted Supabase)

**Stack:**
- PostgreSQL 16 with Row-Level Security
- Supabase Auth (GoTrue) with JWT authentication
- Realtime via WebSockets for live order updates
- Storage API for product images and logos
- PostgREST for auto-generated REST APIs
- Kong API Gateway for API management

**Use Cases:**
- Real-time order tracking for restaurants and drivers
- Role-based dashboards (Admin, Restaurant, Driver, Demo)
- Dynamic pricing and order management
- File uploads (product images, restaurant logos)
- Business analytics and reporting
- Multi-tenant data isolation via RLS

---

## How to Use This Documentation

### For Development
When implementing a feature, read the relevant documentation file first to understand:
- Available methods and their parameters
- Best practices specific to the Georgian Distribution System
- Security considerations for multi-tenant applications
- Performance optimization strategies
- Common pitfalls and how to avoid them

### For AI Agents (Claude, Kilocode)
These files serve as reference material when context windows are limited. Reference specific files for detailed implementation guidance:

**Example Usage:**
```
Before implementing authentication:
"Read .kilocode/rules/memory-bank/supabasedocs/01-supabase-auth.md for Auth API and RBAC patterns"

Before setting up real-time order tracking:
"Read .kilocode/rules/memory-bank/supabasedocs/02-supabase-realtime.md for WebSocket patterns"

Before creating database schema:
"Read .kilocode/rules/memory-bank/supabasedocs/07-database-design.md and 05-row-level-security.md"
```

### For Troubleshooting
Each file includes a dedicated troubleshooting section with:
- Common errors and their solutions
- Performance bottlenecks and fixes
- Security vulnerabilities and mitigations
- Integration issues with Next.js

---

## Documentation Standards

All files follow a consistent structure:

1. **Overview & Core Concepts** - High-level explanation of the service
2. **API Reference** - Detailed method documentation with TypeScript examples
3. **Use Cases for Georgian Distribution System** - Project-specific implementations
4. **Security Considerations** - RLS policies, JWT validation, input sanitization
5. **Performance Optimization** - Query optimization, caching, connection management
6. **Best Practices & Patterns** - Production-ready patterns for the project
7. **Troubleshooting Guide** - Common issues and solutions
8. **TypeScript Types** - Auto-generated types and custom interfaces
9. **Next.js Integration Examples** - Server components, client components, API routes

---

## Keeping Documentation Updated

This documentation is based on Supabase as of **January 2025**. 

**Official Resources:**
- Main Docs: https://supabase.com/docs
- GitHub: https://github.com/supabase/supabase
- API Reference: https://supabase.com/docs/reference
- Community: https://github.com/supabase/supabase/discussions

**Check for updates when:**
- Supabase releases major version updates
- New features are added to the project
- Performance issues arise
- Security best practices evolve

---

## Contributing

When adding new features or patterns to the Georgian Distribution System:
1. Update the relevant documentation file
2. Add TypeScript examples using project context
3. Include security considerations
4. Add performance optimization tips
5. Update the troubleshooting section if new issues arise

---

## Documentation Benefits

1. **Context Window Management** - Detailed references without cluttering AI agent memory
2. **Production Patterns** - Battle-tested implementations, not tutorials
3. **Security First** - Every file includes security considerations for multi-tenant systems
4. **TypeScript Native** - All examples use proper TypeScript types
5. **Project-Specific** - Examples use Georgian Distribution System context (orders, restaurants, drivers, products)
6. **Role-Based Access** - Emphasis on RBAC patterns for Admin, Restaurant, Driver, Demo roles
7. **Real-Time Ready** - WebSocket patterns for live order tracking

---

## File Size Reference

Each documentation file is comprehensive (300-500+ lines) and includes:
- ✅ Detailed API reference with all major methods
- ✅ Real-world examples from Georgian Distribution System
- ✅ Security best practices
- ✅ Performance optimization strategies
- ✅ Troubleshooting guides
- ✅ TypeScript types and interfaces
- ✅ Next.js 15 integration patterns

---

*Last Updated: October 29, 2025*  
*Supabase Version: Latest (as of January 2025 knowledge cutoff)*  
*Project: Georgian Distribution System (greenland77.ge)*
