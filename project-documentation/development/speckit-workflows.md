# .Speckit Workflow Configuration

**Documented:** 2025-10-31  
**Workflow Files Location:** `.specify/` directory

## Overview

The .speckit framework provides structured development workflows for the Georgian Distribution System, implementing a feature-driven development methodology with comprehensive planning and quality gates. This system enforces best practices and ensures consistency across development phases.

## Core Configuration Files

### 1. Constitution Document
**File:** `.specify/memory/constitution.md`  
**Version:** 1.1.0 (Last updated: 2025-11-01)  
**Purpose:** Master development principles and quality gates

#### Core Principles
- **Real-Time First:** All events publish within 1 second via Supabase Realtime
- **Security by Design:** RLS policies on every table with role-based tests
- **Type Safety (NON-NEGOTIABLE):** TypeScript strict mode, zero-error policy
- **Independent User Stories:** Each story independently testable and deployable
- **Dual Environment Architecture:** Dev on official Supabase, Prod on VPS
- **Performance & Observability:** 500ms p95 latency, Sentry integration
- **Georgian Market Standards:** Georgian language, Lari currency, UTC+4 timezone
- **Authentication Integrity:** End-to-end Supabase Auth, no mock sessions
- **Quality Gate Discipline:** Zero warnings policy, CI quality gates

#### Technology Stack Requirements
**Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- Development: Official Supabase hosted platform with MCP integration
- Production: Self-hosted Supabase at `data.greenland77.ge`
- Database: PostgreSQL 15+ with PostgREST API
- Real-time: WebSocket subscriptions via Supabase Realtime
- Auth & Security: Supabase Auth with RLS policies in migrations

**Frontend:** Next.js 15+ with React 19+
- Framework: Next.js App Router (Server and Client Components)
- Styling: Tailwind CSS 4+ with shadcn/ui components
- State: Zustand for global state, TanStack Query for server state
- Validation: Shared Zod schemas under `src/lib/validators`
- Auth: Supabase SSR integration with role-aware middleware

### 2. Template System
**Location:** `.specify/templates/`

#### Feature Specification Template
**File:** `spec-template.md`  
**Purpose:** Structured feature specification with user story prioritization

**Key Sections:**
- User Scenarios & Testing (mandatory)
- Real-Time, Auth & Observability Contracts (mandatory)
- Requirements (functional requirements with IDs)
- Success Criteria (measurable outcomes)

**User Story Requirements:**
- Prioritized as P1, P2, P3... (P1 = most critical)
- Each story independently implementable and testable
- Must deliver viable MVP if implemented alone
- Independent test criteria for each story
- Acceptance scenarios with Given/When/Then format

#### Implementation Plan Template
**File:** `plan-template.md`  
**Purpose:** Technical planning with constitution compliance

**Constitution Check Gates (10-point checklist):**
1. Real-Time Check: Supabase channels and payload contracts
2. Security Check: RLS policies and role matrices
3. Type Safety Check: TypeScript strictness and type generation
4. User Story Check: Independent testability
5. Environment Check: Dual environment compatibility
6. Performance Check: Latency budgets and indexes
7. Localization Check: Georgian language/currency support
8. Authentication Check: End-to-end Supabase Auth
9. Observability Check: Logging, metrics, and alerts
10. Quality Gate Check: Zero warnings policy

### 3. Task Generation Workflow
**File:** `.kilocode/workflows/speckit.tasks.md`  
**Purpose:** Automated task generation based on specifications

#### Task Generation Process
1. **Setup:** Check prerequisites and parse feature directory
2. **Load Design Documents:** 
   - Required: plan.md, spec.md
   - Optional: data-model.md, contracts/, research.md, quickstart.md
3. **Execute Task Generation:**
   - Extract tech stack from plan.md
   - Extract user stories with priorities from spec.md
   - Map entities and contracts to user stories
   - Generate dependency graph
4. **Generate tasks.md:** Organized by user story phases

#### Task Organization Structure
**Phase 1:** Setup (project initialization)
**Phase 2:** Foundational (blocking prerequisites)
**Phase 3+:** User Stories (P1, P2, P3... in priority order)
**Final Phase:** Polish & Cross-Cutting Concerns

#### Task Format Requirements
**CRITICAL:** Every task MUST follow this exact format:
```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Format Components:**
1. **Checkbox:** Always start with `- [ ]`
2. **Task ID:** Sequential number (T001, T002, T003...)
3. **[P] marker:** Only if task is parallelizable
4. **[Story] label:** Required for user story tasks only
   - Format: [US1], [US2], [US3]...
   - Setup/Foundational/Polish phases: NO story label
5. **Description:** Clear action with exact file path

**Examples:**
- ✅ CORRECT: `- [ ] T001 Create project structure per implementation plan`
- ✅ CORRECT: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ CORRECT: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ❌ WRONG: `- [ ] Create User model` (missing ID and Story label)

## Development Workflow Integration

### Feature Development Process
1. **Specification Phase:** Create feature spec with prioritized user stories
2. **Planning Phase:** Generate implementation plan with constitution check
3. **Task Breakdown Phase:** Organize tasks by user story for independent implementation
4. **Implementation Phase:** 
   - Develop user stories in priority order
   - Ensure Supabase Auth flows, realtime channels, and role matrices
   - Database migrations must run successfully before production
5. **Schema & Type Generation:** Run `supabase db diff`, `supabase db push`, `supabase gen types typescript`
6. **Verification Phase:** Run lint, type-check, tests, and Chrome DevTools smoke tests
7. **Review Phase:** Code review with constitution compliance verification
8. **Deployment:** Deploy to development, validate telemetry, promote to production

### Quality Gates
- **Pre-Commit:** `npm run lint -- --max-warnings=0` and `npm run type-check`
- **Pre-PR:** All affected user stories have passing tests and no console errors
- **Pre-Merge:** Code review verifies constitution compliance
- **Pre-Deploy:** Database migrations run successfully in staging
- **Post-Deploy:** Health checks and Sentry confirm service availability
- **Quarterly:** Full performance audit and remediation

## Constitution Compliance Framework

### Amendment Process
1. Propose amendment with rationale in issue or PR
2. Document impact on existing features and templates
3. Update constitution.md with version bump (MAJOR/MINOR/PATCH)
4. Sync changes to all dependent templates
5. Create migration checklist for in-flight features

### Compliance Verification
- All feature plans include constitution check section
- Code reviews verify security, realtime, auth, and type safety
- Quarterly audits review production against standards

### Living Documentation
- **Memory bank files:** `.kilocode/rules/memory-bank/` provide detailed context
- **Supabase docs:** `.kilocode/rules/memory-bank/supabasedocs/` serve as technical reference
- **Constitution:** Provides enforceable principles for decision-making

## Workflow Benefits for Georgian Distribution System

### Operational Advantages
1. **Independent Development:** User stories can be developed and tested separately
2. **Quality Assurance:** Built-in constitution checks prevent common issues
3. **Scalability:** Clear task organization supports team growth
4. **Maintainability:** Structured documentation reduces technical debt
5. **Compliance:** Automatic enforcement of security and performance standards

### Business Benefits
1. **Faster Development:** Template-driven planning reduces setup time
2. **Better Quality:** Zero-warning policy prevents regression issues
3. **Consistent Architecture:** Constitution ensures architectural decisions are followed
4. **Risk Mitigation:** Quality gates catch issues before deployment
5. **Knowledge Preservation:** Structured documentation aids onboarding and maintenance

### Technical Benefits
1. **Type Safety:** Strict TypeScript enforcement catches errors early
2. **Security:** RLS policies and auth flows are mandatory
3. **Performance:** Built-in performance budgets and monitoring
4. **Real-time:** WebSocket integration is planned from the start
5. **Testing:** Independent test criteria for each user story

This .speckit workflow implementation provides a robust foundation for the Georgian Distribution System's development lifecycle, ensuring quality, consistency, and maintainability while enabling rapid feature development and deployment.