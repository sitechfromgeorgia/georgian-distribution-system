<!--
===============================================================================
SYNC IMPACT REPORT
===============================================================================
Version Change: 1.0.0 → 1.1.0
Action: Strengthen authentication and quality guardrails in constitution

Modified Principles:
- Real-Time First → Real-Time First (tightened SLA and channel documentation)
- Security by Design (Multi-Tenant) → Security by Design (Multi-Tenant) (policy lint + role matrix)
- Type Safety (NON-NEGOTIABLE) → Type Safety (NON-NEGOTIABLE) (zero-error TS + lint integration)
- Independent User Stories → Independent User Stories (story-level contracts clarified)
- Dual Environment Architecture → Dual Environment Architecture (environment parity for auth)
- Performance & Observability → Performance & Observability (console hygiene + SLO linkage)
- Georgian Market Standards → Georgian Market Standards (currency/timezone validation)

Added Principles:
- Authentication Integrity & Session Reliability
- Quality Gate Discipline

Added Sections:
- None

Removed Sections:
- None

Templates Updated:
✅ plan-template.md - Constitution checks include auth + quality gates
✅ spec-template.md - Specs capture realtime/auth/observability contracts
✅ tasks-template.md - Tasks include auth hardening + quality gate enforcement
⚠️ Command templates directory missing (`.specify/templates/commands`) - confirm coverage when files added

Follow-up TODOs:
- None

Last Updated: 2025-11-01
===============================================================================
-->

# Georgian Distribution System Constitution

## Core Principles

### I. Real-Time First

All order lifecycle, driver telematics, and inventory reconciliation events MUST publish through Supabase Realtime within 1 second of the originating database commit (p99). Each feature spec MUST document the channel name, payload shape, and subscriber expectations. Automated tests MUST exercise at least one subscriber per channel. Polling is only permitted for asynchronous backfill jobs scheduled outside the critical workflow.

**Rationale**: Live coordination between restaurants, drivers, and administrators is the product differentiator. Missing or delayed events directly erode trust and create operational losses.

### II. Security by Design (Multi-Tenant)

Row-Level Security (RLS) MUST remain enabled on every table, and every migration that introduces or alters a table MUST define its policies alongside role-specific tests. Supabase service-role keys MUST stay server-side, and API routes MUST authorize via the `role` claim emitted by Supabase Auth. Feature plans MUST include an updated Admin/Restaurant/Driver/Demo privileges matrix before work begins.

**Rationale**: The platform stores competitive and personally identifiable information. RLS-backed defenses and pre-approved role matrices prevent cross-tenant leakage and enforce least privilege at the data layer.

### III. Type Safety (NON-NEGOTIABLE)

TypeScript MUST run in `strict` mode across the monorepo. `npm run type-check`, `npm run lint -- --max-warnings=0`, and `supabase gen types typescript` MUST pass with zero errors before merge. Supabase queries MUST bind to generated types, and runtime validation MUST use the shared Zod schemas under `src/lib/validators`. `any` is prohibited unless the exception is documented with a removal ticket.

**Rationale**: Tight typing ensures the frontend, API routes, and database evolve together. Type gaps routinely mask bugs in pricing, routing, and logistics flows that the business cannot absorb.

### IV. Independent User Stories

Each user story MUST be independently implementable, testable, and deployable. Stories MUST enumerate the Supabase channels they emit or consume, the roles impacted, and the quality gates required for acceptance. Tasks MUST remain grouped by story to support parallel delivery and controlled rollout.

**Rationale**: Georgian market feedback cycles are short. Independent stories enable progressive releases without blocking on unrelated functionality.

### V. Dual Environment Architecture

Development MUST use the Official Supabase hosted platform (MCP-enabled) while production MUST run on the self-hosted Supabase stack at `data.greenland77.ge`. Schemas, seed data, auth providers, and storage policies MUST stay in sync via migrations and automated smoke tests. Environment configuration MUST live in `.env` files, and secrets MUST never be committed to the repository.

**Rationale**: Hosted Supabase accelerates development, while the VPS satisfies data residency and cost constraints. Parity between environments prevents regressions during promotion.

### VI. Performance & Observability

All API routes MUST achieve 500ms p95 latency or better, and core dashboard pages MUST maintain Lighthouse LCP under 2.5s on reference hardware. Database queries MUST index `restaurant_id`, `driver_id`, `status`, and `created_at` filters. Client and server errors MUST be logged with role, request ID, and timestamp, and Sentry MUST remain enabled in all environments. Chrome DevTools console MUST be free of errors before a release candidate ships.

**Rationale**: Distribution delays waste perishable goods and destroy customer trust. Observability shortens incident resolution time and protects recurring revenue.

### VII. Georgian Market Standards

All user-facing text MUST support the Georgian language and render correctly in UTF-8. Pricing MUST default to Georgian Lari (GEL) with two-decimal precision and compliant rounding rules. Date and time displays MUST default to Georgia Standard Time (UTC+4) with clear timezone labels. Compliance checks MUST verify marketing and transactional copy against updated Georgian terminology before launch.

**Rationale**: Localization failures immediately block adoption. Language, currency, and timezone fidelity are non-negotiable entry requirements in the Georgian food distribution market.

### VIII. Authentication Integrity & Session Reliability

All authentication flows (login, logout, session refresh, MFA, password reset) MUST use Supabase Auth end-to-end. Placeholder alerts, bypass routes, or mock sessions are prohibited outside integration tests. SSR entry points MUST hydrate with real session state and block protected routes when the user lacks a valid role. QA MUST verify the full role matrix after every auth change, including session persistence across browser reloads.

**Rationale**: The previous diagnostic revealed disabled authentication, which blocks delivery operations and creates security gaps. Ensuring Supabase Auth integrity protects tenant data and unlocks real usage.

### IX. Quality Gate Discipline

No feature may merge while TypeScript errors, ESLint warnings, or Chrome DevTools console errors remain. CI pipelines MUST run `npm run lint -- --max-warnings=0`, `npm run type-check`, `npm run test`, and RLS policy checks. Performance budgets and observability dashboards MUST be updated when a feature changes its footprint. Exceptions require an executive override recorded in the plan's complexity table.

**Rationale**: Maintaining a zero-warning baseline prevents the regression avalanche observed in the October 2025 audits and keeps the team shipping confidently.

## Technology Stack Requirements

**Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)

- Development: Official Supabase hosted platform
- Production: Self-hosted Supabase on VPS
- Database: PostgreSQL 15+ with PostgREST API
- Real-time: WebSocket subscriptions via Supabase Realtime
- Auth & Security: Supabase Auth with RLS policies stored in migrations, pgTAP or equivalent policy tests

**Frontend**: Next.js 15+ with React 19+

- Framework: Next.js App Router (Server and Client Components)
- Styling: Tailwind CSS 4+ with shadcn/ui components
- State: Zustand for global state, TanStack Query for server state
- Validation: Shared Zod schemas under `src/lib/validators`
- Auth: Supabase SSR integration with role-aware middleware protection

**Development Tools**:

- TypeScript 5+ (strict mode)
- ESLint + Prettier with zero-warning policy
- Supabase CLI for migrations, policy linting, and type generation
- Git workflow: feature branches with PR reviews and CI quality gates

**Deployment**:

- Frontend: Vercel or VPS static hosting with environment parity
- Backend: Docker Compose on VPS (data.greenland77.ge)
- SSL/TLS: Let's Encrypt certificates
- CDN: Cloudflare for static assets (optional)

## Development Workflow

### Feature Development Process

1. **Specification Phase**: Create feature spec with prioritized user stories (P1, P2, P3...)
2. **Planning Phase**: Generate implementation plan with constitution check gate
3. **Task Breakdown Phase**: Organize tasks by user story for independent implementation
4. **Implementation Phase**:
   - Develop user stories in priority order
   - Ensure Supabase Auth flows, realtime channels, and role matrices are implemented per story
   - Database migrations MUST run successfully in development before production
5. **Schema & Type Generation**: Run `supabase db diff`, `supabase db push`, and `supabase gen types typescript` after schema changes
6. **Verification Phase**: Run `npm run lint -- --max-warnings=0`, `npm run type-check`, `npm run test`, and Chrome DevTools smoke tests (no console errors)
7. **Review Phase**: Code review MUST verify type safety, RLS policy coverage, realtime contracts, and authentication integrity
8. **Deployment**: Deploy to development first, validate telemetry, then promote to production

### Constitution Compliance Checks

All feature plans MUST pass constitution checks before Phase 0 research:

- ✅ **Real-Time Check**: Does the feature require real-time updates? If yes, are Supabase channels and payload contracts documented?
- ✅ **Security Check**: Are RLS policies defined for new tables and role matrices updated?
- ✅ **Type Safety Check**: Are Supabase types regenerated and TypeScript strictness preserved?
- ✅ **User Story Check**: Are stories independently testable with clear priorities?
- ✅ **Environment Check**: Is the feature compatible with dual environment setup?
- ✅ **Performance Check**: Are latency budgets and required indexes planned?
- ✅ **Localization Check**: Does the feature support Georgian language/currency?
- ✅ **Authentication Check**: Are Supabase Auth flows implemented end-to-end without mocks?
- ✅ **Observability Check**: Are logging, metrics, and alerts updated for the change?
- ✅ **Quality Gate Check**: Does the plan enforce zero TypeScript/lint errors and console hygiene?

## Quality Gates

- **Pre-Commit**: `npm run lint -- --max-warnings=0` and `npm run type-check` MUST pass locally
- **Pre-PR**: All affected user stories MUST have passing tests and no Chrome DevTools console errors
- **Pre-Merge**: Code review MUST verify constitution compliance, including realtime channels and auth integrity
- **Pre-Deploy**: Database migrations MUST run successfully in staging and RLS policy checks MUST pass
- **Post-Deploy**: Health checks and Sentry dashboards MUST confirm service availability without new alerts
- **Quarterly**: Run full performance audit (Lighthouse + API latency) and remediate breaches within two sprints

## Governance

This constitution supersedes all other development practices. Any deviation from these principles MUST be explicitly documented and justified in complexity tracking sections of feature plans.

**Amendment Process**:

1. Propose amendment with rationale in issue or PR discussion
2. Document impact on existing features and templates
3. Update `.specify/memory/constitution.md` with version bump:
   - MAJOR: Principle removal or backward-incompatible change
   - MINOR: New principle or section addition
   - PATCH: Clarifications or non-semantic refinements
4. Sync changes to all dependent templates (plan, spec, tasks, agent files)
5. Create migration checklist for applying changes to in-flight features

**Compliance Verification**:

- All feature plans MUST include constitution check section with documented pass/fail items
- Code reviews MUST verify adherence to security, realtime, authentication, and type safety principles
- Quarterly audits MUST review production against performance, observability, and localization standards, and log corrective actions

**Living Documentation**:

- Memory bank files (`.kilocode/rules/memory-bank/`) provide detailed context
- Supabase documentation (`.kilocode/rules/memory-bank/supabasedocs/`) serves as technical reference
- This constitution provides enforceable principles for consistent decision-making

**Version**: 1.1.0 | **Ratified**: 2025-10-31 | **Last Amended**: 2025-11-01
