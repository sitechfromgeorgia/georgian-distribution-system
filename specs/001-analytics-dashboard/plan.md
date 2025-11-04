# Implementation Plan: Analytics Dashboard KPIs

**Branch**: `001-analytics-dashboard` | **Date**: 2025-11-01 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-analytics-dashboard/spec.md`

## Summary

Implement an analytics dashboard for Operations Managers displaying three key KPIs: Orders per Day, On-time Delivery Rate, and Average Delivery Time. The dashboard provides date range selection (preset and custom), order status filtering, and CSV export capabilities. This MVP prioritizes immediate operational visibility (P1), followed by status filtering (P2) and export functionality (P3), ensuring each user story delivers independent value.

**Technical Approach**: Leverage Next.js App Router with server-side data aggregation, Supabase PostgreSQL for KPI queries with appropriate indexing, shadcn/ui for dashboard components, and TanStack Query for caching. Authentication restricts access to Admin/Operations Manager roles via RLS policies.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode), Next.js 15.1.6, React 19.2.0  
**Primary Dependencies**: Next.js, React, Supabase (@supabase/supabase-js ^2.77.0, @supabase/ssr ^0.7.0), TanStack Query (@tanstack/react-query ^5.90.5), shadcn/ui (Radix UI primitives), Recharts ^2.12.7, Zod ^4.1.12, date-fns ^4.1.0  
**Storage**: Supabase PostgreSQL (existing `orders` table with `created_at`, `delivery_time`, `status`, `restaurant_id` columns)  
**Testing**: Jest for unit tests, Puppeteer ^24.27.0 for E2E testing, manual QA with Chrome DevTools  
**Target Platform**: Web application (Next.js SSR), Chrome/Edge/Firefox support  
**Project Type**: Web application (frontend with backend API routes)  
**Performance Goals**: KPI cards load within 2 seconds for typical date ranges (≤30 days) at p90; CSV export completes within 10 seconds for ≤30 days  
**Constraints**: <2s p95 for dashboard load, RLS-enforced access control, zero TypeScript/lint errors, console hygiene  
**Scale/Scope**: Expected 100-500 orders per day; dashboard supports up to 12 months lookback (performance degrades gracefully with warnings beyond 3 months); ~5-10 concurrent Operations Manager users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- ✅ **Real-Time Check**: Real-time updates NOT required for initial MVP. KPIs are aggregated views refreshed manually. Future enhancement could add polling/channel subscriptions for live updates.
- ✅ **Security Check**: New RLS policy required on `orders` table to allow Admin/Operations Manager role to SELECT aggregated data. No new tables. Role matrix updated to document Analytics Dashboard access.
- ✅ **Type Safety Check**: Supabase types regenerated after any schema changes (none expected for MVP). TypeScript strict mode enforced. Zod schemas defined for filter parameters and CSV export data.
- ✅ **User Story Check**: Three user stories (P1: View KPIs, P2: Filter by status, P3: Export CSV) are independently testable and deployable. Each delivers standalone value.
- ✅ **Environment Check**: Compatible with dual environment setup (hosted Supabase for dev, self-hosted VPS for production). Date range and timezone handling consistent across environments (UTC+4 Georgia Standard Time).
- ✅ **Performance Check**: Latency budgets defined (2s p90 for dashboard, 10s for export). Database indexes on `orders.created_at`, `orders.status`, `orders.restaurant_id` already exist (verified in schema). Additional composite index `(created_at, status, delivery_time)` planned.
- ✅ **Localization Check**: Dashboard supports Georgian language strings (მონაცემები, შეკვეთები, დრო, etc.). Currency displays as GEL with ₾ symbol. Timezone displayed as "საქართველოს დრო (UTC+4)".
- ✅ **Authentication Check**: Supabase Auth enforced end-to-end. Dashboard route protected via middleware checking `role` claim. No mocks or bypasses. Unauthorized users see access denied message.
- ✅ **Observability Check**: Telemetry events logged for dashboard page view, filter changes, CSV export attempts (success/failure), and KPI load duration. Chrome DevTools console hygiene verified before release.
- ✅ **Quality Gate Check**: Zero TypeScript errors, zero ESLint warnings, no console errors required before merge. CI pipeline includes `npm run lint -- --max-warnings=0` and `npm run type-check`.

**Post-Gate Summary**: All gates pass. No constitution violations. Ready to proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-analytics-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (NEEDS CLARIFICATION resolutions)
├── data-model.md        # Phase 1 output (KPI entities and calculations)
├── quickstart.md        # Phase 1 output (setup and development instructions)
├── contracts/           # Phase 1 output (API contracts and types)
│   ├── kpi-api.json     # OpenAPI spec for KPI endpoint
│   └── csv-export.json  # OpenAPI spec for CSV export endpoint
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── analytics/           # New analytics route
│   │   │       └── page.tsx         # Analytics dashboard page
│   │   └── api/
│   │       └── analytics/           # New API routes
│   │           ├── kpis/
│   │           │   └── route.ts     # GET /api/analytics/kpis?from=&to=&status=
│   │           └── export/
│   │               └── route.ts     # GET /api/analytics/export?from=&to=&status=
│   ├── components/
│   │   ├── analytics/               # New analytics components
│   │   │   ├── KPICard.tsx          # KPI display card
│   │   │   ├── DateRangeFilter.tsx  # Date range selector
│   │   │   ├── StatusFilter.tsx     # Status dropdown filter
│   │   │   ├── ExportButton.tsx     # CSV export trigger
│   │   │   └── EmptyState.tsx       # No data state
│   │   └── ui/                      # Existing shadcn/ui components (reused)
│   ├── lib/
│   │   ├── validators/
│   │   │   └── analytics.ts         # New Zod schemas for analytics
│   │   └── supabase/
│   │       └── analytics.service.ts # New analytics data service
│   ├── types/
│   │   └── analytics.ts             # New TypeScript types for KPIs
│   └── hooks/
│       └── useAnalytics.ts          # New custom hook for analytics state
└── tests/
    ├── unit/
    │   └── analytics/               # Unit tests for analytics logic
    └── e2e/
        └── analytics-dashboard.spec.ts  # E2E test for dashboard workflow
```

**Structure Decision**: Web application structure (Option 2). Analytics dashboard is a new route under `(dashboard)` layout, leveraging existing authentication and layout components. API routes provide server-side aggregation to protect database load and enforce RLS. Components follow established patterns (shadcn/ui, service layer, Zod validation).

## Complexity Tracking

> **No constitution violations detected. This table remains empty.**

## Phase 0: Outline & Research

### Research Tasks

Based on NEEDS CLARIFICATION items from Functional Requirements:

1. **FR-011 Clarification**: Define "on-time" threshold
   - **Research Task**: Determine business definition of on-time delivery
   - **Key Questions**:
     - What is the promised delivery window? (e.g., ±15 minutes, ±30 minutes)
     - Is on-time based on `delivery_time <= promised_delivery_time` or a tolerance window?
     - How are orders with missing `promised_delivery_time` handled?

2. **FR-012 Clarification**: Define "Average Delivery Time" calculation
   - **Research Task**: Identify start and end timestamps for delivery duration
   - **Key Questions**:
     - Is delivery time measured from order creation (`orders.created_at`) to delivery (`orders.delivery_time`)?
     - Or from pickup/assignment timestamp to delivery?
     - Are pending/cancelled orders excluded from this calculation?

3. **FR-013 Clarification**: Maximum historical lookback window
   - **Research Task**: Establish performance and cost boundaries for historical queries
   - **Key Questions**:
     - What is the maximum date range users should query without warnings?
     - Should queries beyond 3 or 6 months trigger performance warnings?
     - Is there a hard limit (e.g., 12 months) enforced by the system?

4. **Best Practices Research**: CSV export patterns for large datasets
   - **Research Task**: Identify streaming vs. batch export approaches
   - **Key Questions**:
     - Should CSV export be server-side or client-side generated?
     - For large date ranges, should the system paginate or stream results?
     - What file naming convention and headers should be used?

5. **Best Practices Research**: Database query optimization for aggregate KPIs
   - **Research Task**: Review PostgreSQL indexing strategies for time-series aggregations
   - **Key Questions**:
     - Are existing indexes on `orders(created_at, status)` sufficient?
     - Should a composite index `(created_at, status, delivery_time)` be added?
     - Are materialized views or pre-aggregated tables necessary for performance?

6. **Best Practices Research**: Date range selector UX patterns
   - **Research Task**: Review industry standards for date range selection
   - **Key Questions**:
     - Should the dashboard use a calendar picker or preset buttons (7/14/30 days)?
     - How should timezone context be displayed to users?
     - Should there be a "max range exceeded" warning with auto-adjustment?

### Expected Research Outputs

`research.md` will document:

- **Decision**: On-time definition (e.g., delivered within 30 minutes of promised window)
- **Rationale**: Business requirement, customer expectations, operational SLAs
- **Alternatives Considered**: ±15 minutes, ±60 minutes, exact match

- **Decision**: Average Delivery Time = `delivery_time - created_at` for completed orders only
- **Rationale**: Aligns with business "order-to-door" metric, excludes incomplete data
- **Alternatives Considered**: Pickup-to-delivery, assignment-to-delivery

- **Decision**: Maximum lookback 12 months, warnings at 3+ months
- **Rationale**: Balances historical analysis needs with query performance
- **Alternatives Considered**: 6-month hard limit, unlimited with pagination

- **Decision**: Server-side CSV generation with streaming for >1000 rows
- **Rationale**: Protects client memory, enforces RLS, supports large exports
- **Alternatives Considered**: Client-side CSV.js, paginated downloads

- **Decision**: Add composite index `(created_at, status, delivery_time)` on `orders` table
- **Rationale**: Covers common filter patterns for KPI queries
- **Alternatives Considered**: Materialized views (overkill for current scale), separate time-series table

- **Decision**: Preset buttons (7/14/30/custom) with calendar picker for custom range
- **Rationale**: Fast access for common ranges, flexibility for ad-hoc queries
- **Alternatives Considered**: Calendar-only, relative date inputs ("last N days")

## Phase 1: Design & Contracts

### Prerequisites

- `research.md` completed with all NEEDS CLARIFICATION resolved

### Data Model

Generate `data-model.md` with:

**Entities**:

- **Order** (existing): `id`, `restaurant_id`, `driver_id`, `status`, `created_at`, `delivery_time`, `total_amount`, `delivery_fee`, `tax_amount`
- **KPI Summary** (derived, not stored):
  - `orders_per_day`: `COUNT(DISTINCT DATE(created_at)) / date_range_days`
  - `on_time_rate`: `COUNT(on_time_orders) / COUNT(delivered_orders) * 100`
  - `avg_delivery_time`: `AVG(delivery_time - created_at)` for completed orders
  - `date_range`: `{ from: TIMESTAMPTZ, to: TIMESTAMPTZ }`
  - `filters`: `{ status: order_status[] }`
  - `excluded_count`: Count of orders with missing data excluded from calculations

**Relationships**:

- KPI Summary aggregates from `orders` table filtered by date range and status
- Orders reference `profiles` table for role-based access (RLS)

**Validation Rules**:

- Date range: `from <= to`, max 12 months span
- Status filter: Must be valid `order_status` enum values
- Excluded orders: Missing `delivery_time` or `created_at` excluded from time-based KPIs

**State Transitions**: N/A (read-only queries, no state changes)

### API Contracts

Generate OpenAPI schemas in `/contracts/`:

**1. `kpi-api.json`** - GET `/api/analytics/kpis`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Analytics KPI API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/analytics/kpis": {
      "get": {
        "summary": "Get KPI metrics for date range and filters",
        "parameters": [
          {
            "name": "from",
            "in": "query",
            "required": true,
            "schema": { "type": "string", "format": "date-time" }
          },
          {
            "name": "to",
            "in": "query",
            "required": true,
            "schema": { "type": "string", "format": "date-time" }
          },
          {
            "name": "status",
            "in": "query",
            "required": false,
            "schema": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["pending", "confirmed", "priced", "assigned", "out_for_delivery", "delivered", "completed", "cancelled"]
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "KPI metrics",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "orders_per_day": { "type": "number" },
                    "on_time_rate": { "type": "number" },
                    "avg_delivery_time": { "type": "number", "description": "Average delivery time in minutes" },
                    "total_orders": { "type": "integer" },
                    "excluded_count": { "type": "integer" },
                    "date_range": {
                      "type": "object",
                      "properties": {
                        "from": { "type": "string", "format": "date-time" },
                        "to": { "type": "string", "format": "date-time" }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": { "description": "Invalid parameters" },
          "401": { "description": "Unauthorized" },
          "403": { "description": "Forbidden - insufficient role" }
        }
      }
    }
  }
}
```

**2. `csv-export.json`** - GET `/api/analytics/export`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Analytics CSV Export API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/analytics/export": {
      "get": {
        "summary": "Export current view as CSV",
        "parameters": [
          {
            "name": "from",
            "in": "query",
            "required": true,
            "schema": { "type": "string", "format": "date-time" }
          },
          {
            "name": "to",
            "in": "query",
            "required": true,
            "schema": { "type": "string", "format": "date-time" }
          },
          {
            "name": "status",
            "in": "query",
            "required": false,
            "schema": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "CSV file download",
            "content": {
              "text/csv": {
                "schema": {
                  "type": "string",
                  "description": "CSV with headers: Order ID, Restaurant, Status, Created At, Delivery Time, Duration (min), Total Amount"
                }
              }
            }
          },
          "400": { "description": "Invalid parameters" },
          "401": { "description": "Unauthorized" },
          "403": { "description": "Forbidden - insufficient role" }
        }
      }
    }
  }
}
```

### Quickstart Generation

Generate `quickstart.md` with:

- **Prerequisites**: Node.js 20+, Supabase CLI, database access
- **Environment Setup**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- **Database Migration**: Run composite index creation (if needed): `CREATE INDEX idx_orders_analytics ON orders(created_at, status, delivery_time);`
- **Development Server**: `cd frontend && npm run dev`, navigate to `/analytics`
- **Testing**: `npm run test:unit` for unit tests, `npm run test:e2e` for E2E tests
- **Verification**: Log in as Admin, access `/analytics`, verify KPIs load within 2 seconds

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh copilot` to update AI agent context:

- Add analytics dashboard feature to agent memory
- Document new API endpoints and types
- Update known routes and component structure
- Preserve manual additions in agent file

**Note**: Script auto-detects AI agent (Copilot, Continue, Kilocode) and updates appropriate context file.

## Phase 2: Task Breakdown

**STOP**: Phase 2 (task breakdown) is handled by the `/speckit.tasks` command, NOT by `/speckit.plan`.

This plan concludes after Phase 1. The `tasks.md` file will be generated in the next workflow step.

## Artifacts Generated

This plan generates:

1. ✅ `plan.md` (this file)
2. 🔄 `research.md` (Phase 0 - next step)
3. 🔄 `data-model.md` (Phase 1)
4. 🔄 `quickstart.md` (Phase 1)
5. 🔄 `contracts/kpi-api.json` (Phase 1)
6. 🔄 `contracts/csv-export.json` (Phase 1)
7. ⏸️ `tasks.md` (Phase 2 - separate command)

## Next Steps

1. **Review and Approve Plan**: Stakeholders review this plan and constitution check
2. **Execute Phase 0**: Resolve NEEDS CLARIFICATION items, generate `research.md`
3. **Execute Phase 1**: Generate data model, contracts, and quickstart documentation
4. **Update Agent Context**: Run update script to inform AI assistants
5. **Re-check Constitution**: Verify all gates still pass after design decisions
6. **Proceed to `/speckit.tasks`**: Break down implementation into user story tasks

---

**Status**: ✅ Ready for Phase 0 Research  
**Branch**: `001-analytics-dashboard`  
**Last Updated**: 2025-11-01
