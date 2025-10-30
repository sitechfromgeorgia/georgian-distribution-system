<!-- SYNC_IMPACT_REPORT: Version change: 0.0.0 → 1.0.0; Added 5 core principles focused on clean code and user experience; Modified governance section; Templates requiring updates: .specify/templates/plan-template.md (⚠ pending), .specify/templates/spec-template.md (⚠ pending), .specify/templates/tasks-template.md (⚠ pending); No placeholders deferred -->

# Georgian Distribution System Constitution

## Core Principles

### I. Clean Code & Maintainability
All code must be written with clarity, simplicity, and long-term maintainability in mind. Follow the principles of "Simplicity & Maintainability" from our architecture: prioritize streamlined, easy-to-understand structures that facilitate solo or small-team development. Code should be self-documenting where possible, with meaningful variable names, clear function responsibilities, and well-organized modules. Refactoring is not a one-time task but an ongoing responsibility to keep technical debt minimal.

### II. User-Centric Design (NON-NEGOTIABLE)
Every feature and interface element must be designed with the end user's needs and experience as the primary consideration. The system serves three distinct user types (Admin, Restaurant, Driver), each with specific workflows and pain points. All UI/UX decisions must enhance the user journey, reduce cognitive load, and provide clear value. Mobile-first design is essential, ensuring full functionality on any device with Georgian and English language support.

### III. Performance-First Development
Performance is a feature, not an afterthought. All code must be optimized for fast loading times and responsiveness, especially considering slower internet connections common in the Georgian market. Leverage Next.js optimizations (Server Components, automatic code splitting, image optimization), implement proper database indexing, use caching strategies (TanStack Query), and minimize bundle sizes. Every new feature must be evaluated for its performance impact before implementation.

### IV. Security by Design
Security must be embedded at every level of the application, from the frontend to the database. Follow the "Security by Design" principle from our architecture with robust authorization through PostgreSQL's Row-Level Security (RLS). All user inputs must be validated using Zod schemas before reaching the backend. Authentication is handled securely through Supabase Auth with JWT tokens. Never expose sensitive information in client-side code or logs.

### V. Test-Driven Development & Quality Assurance
All code must be accompanied by appropriate tests following TDD principles: write tests first, ensure they fail, then implement the feature. This includes unit tests for individual functions, integration tests for component interactions, and end-to-end tests for critical user workflows. Code without adequate test coverage will not be accepted. Quality gates must be passed before any deployment, ensuring 99%+ accuracy in orders and 99.9% uptime.

## Technical Standards

### Code Quality Requirements
- TypeScript must be used strictly throughout the codebase for type safety
- Follow consistent code formatting using ESLint and Prettier
- Use shadcn-ui as the exclusive component library to ensure design consistency
- Implement proper error boundaries and comprehensive logging
- All components must be accessible and follow WCAG guidelines
- Use React Query for server state management and Zustand for client state

### Database & Backend Standards
- All database interactions must respect Row-Level Security policies
- Use PostgreSQL functions and stored procedures for complex business logic
- Implement proper indexing strategies for query optimization
- Follow the feature-based directory structure for maintainability
- Use Supabase Realtime for real-time notifications and status updates

## Development Workflow

### Code Review Process
All pull requests must undergo peer review with a focus on:
- Code clarity and maintainability
- Performance implications
- Security considerations
- User experience impact
- Test coverage adequacy
- Adherence to established patterns

### Deployment & Release Management
- Use semantic versioning for all releases
- Implement zero-downtime deployment strategies
- Maintain comprehensive backup and recovery procedures
- Monitor system performance and user feedback post-deployment
- Follow the documented 20-phase VPS setup guide for consistency

## Governance

This constitution serves as the foundational document that supersedes all other development practices. All team members must verify compliance with these principles during development and review processes. Changes to this constitution require documentation of the rationale, approval from project leadership, and a migration plan for existing code. All new features and refactoring efforts must align with these principles.

**Version**: 1.0.0 | **Ratified**: 2025-01-19 | **Last Amended**: 2025-10-29
