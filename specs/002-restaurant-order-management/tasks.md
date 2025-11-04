# Tasks: Restaurant Order Management

**Input**: Design documents from `/specs/002-restaurant-order-management/`
**Prerequisites**: plan.md (✅ Complete), spec.md (✅ Complete), research.md, data-model.md, contracts/

**Tests**: Tests are included for each user story to ensure proper implementation and quality gates compliance.

**Quality Gates**: Every story MUST plan tasks for `npm run lint -- --max-warnings=0`, `npm run type-check`, `npm run test`, and Chrome DevTools console checks. Do not leave TypeScript or ESLint warnings unresolved.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] Create project structure per implementation plan in frontend/src/app/(dashboard)/restaurant/
- [ ] T002 [P] Configure TypeScript strict mode compliance and ESLint rules for new restaurant components
- [ ] T003 [P] Setup Georgian language constants and GEL currency formatting utilities in frontend/src/lib/constants/georgian.ts
- [ ] T004 [P] Configure Supabase Realtime channels structure in frontend/src/lib/realtime/channels.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create database migration for order_comments table in database/migrations/20251101_add_order_comments.sql
- [ ] T006 Create database migration for cart_snapshots table in database/migrations/20251101_add_cart_snapshots.sql
- [ ] T007 [P] Implement RLS policies for order_comments and cart_snapshots with role-based access control
- [ ] T008 [P] Create performance indexes for product catalog, orders, and new tables
- [ ] T009 [P] Generate TypeScript types from Supabase schema and update frontend/src/types/ files
- [ ] T010 Setup restaurant-specific Zod validators in frontend/src/lib/validators/restaurant/ directory
- [ ] T011 [P] Implement restaurant service layer in frontend/src/lib/services/restaurant/ directory
- [ ] T012 Create restaurant Zustand stores for cart and order state management in frontend/src/lib/store/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Product Catalog Browsing (Priority: P1) 🎯 MVP

**Goal**: Restaurant users can browse available products with categories and search functionality

**Independent Test**: Navigate to /restaurant/products and verify product grid displays with category filtering and search functionality

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Unit test for ProductGrid component in tests/unit/restaurant/ProductGrid.test.tsx
- [ ] T014 [P] [US1] Integration test for product catalog API in tests/integration/restaurant-catalog.test.ts
- [ ] T015 [P] [US1] Real-time test for product catalog changes channel in tests/integration/realtime-product-catalog.test.ts

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create ProductGrid component in frontend/src/components/restaurant/ProductGrid.tsx
- [ ] T017 [P] [US1] Create ProductCatalog page in frontend/src/app/(dashboard)/restaurant/products/page.tsx
- [ ] T018 [P] [US1] Create ProductCard component for individual products in frontend/src/components/restaurant/ProductCard.tsx
- [ ] T019 [P] [US1] Implement product service in frontend/src/lib/services/restaurant/product.service.ts
- [ ] T020 [US1] Create product API endpoint in frontend/src/app/api/products/route.ts
- [ ] T021 [US1] Add real-time subscription to product catalog changes in frontend/src/lib/realtime/restaurant.ts
- [ ] T022 [US1] Implement Georgian language product name rendering and GEL currency formatting

**Checkpoint**: Product catalog is fully functional with search, filtering, and real-time updates

---

## Phase 4: User Story 2 - Shopping Cart Management (Priority: P1) 🎯 MVP

**Goal**: Restaurant users can add/remove products to/from cart with quantities and persistent storage

**Independent Test**: Add products to cart, verify persistence across browser sessions, and confirm cross-tab synchronization

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T023 [P] [US2] Unit test for ShoppingCart component in tests/unit/restaurant/ShoppingCart.test.tsx
- [ ] T024 [P] [US2] Unit test for CartWidget component in tests/unit/restaurant/CartWidget.test.tsx
- [ ] T025 [P] [US2] Integration test for cart state management in tests/unit/restaurant/cart.store.test.ts

### Implementation for User Story 2

- [ ] T026 [P] [US2] Create CartWidget component in frontend/src/components/restaurant/CartWidget.tsx
- [ ] T027 [P] [US2] Create ShoppingCart component in frontend/src/components/restaurant/ShoppingCart.tsx
- [ ] T028 [P] [US2] Create CartItem component in frontend/src/components/restaurant/CartItem.tsx
- [ ] T029 [P] [US2] Implement cart service in frontend/src/lib/services/restaurant/cart.service.ts
- [ ] T030 [US2] Implement cart Zustand store with persistence and cross-tab synchronization in frontend/src/lib/store/cart.store.ts
- [ ] T031 [US2] Create cart API endpoints in frontend/src/app/api/cart/route.ts and /api/cart/save/route.ts
- [ ] T032 [US2] Add real-time cart synchronization via WebSocket in frontend/src/lib/realtime/restaurant.ts
- [ ] T033 [US2] Implement Georgian quantity formatting and validation

**Checkpoint**: Shopping cart system is fully functional with persistence and synchronization

---

## Phase 5: User Story 3 - Order Submission (Priority: P1) 🎯 MVP

**Goal**: Restaurant users can submit orders with delivery details and receive confirmation

**Independent Test**: Create new order from cart, verify order appears in admin dashboard, and receive real-time confirmation

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T034 [P] [US3] Integration test for order submission workflow in tests/integration/restaurant-order-submission.test.ts
- [ ] T035 [P] [US3] E2E test for complete order placement flow in tests/e2e/restaurant-order-flow.spec.ts
- [ ] T036 [P] [US3] Real-time test for new order notifications in tests/integration/realtime-new-orders.test.ts

### Implementation for User Story 3

- [ ] T037 [P] [US3] Create OrderPlacement page in frontend/src/app/(dashboard)/restaurant/orders/page.tsx
- [ ] T038 [P] [US3] Create OrderForm component with delivery details in frontend/src/components/restaurant/OrderForm.tsx
- [ ] T039 [P] [US3] Create OrderConfirmation component in frontend/src/components/restaurant/OrderConfirmation.tsx
- [ ] T040 [P] [US3] Implement order service in frontend/src/lib/services/restaurant/order.service.ts
- [ ] T041 [US3] Create order creation API endpoint in frontend/src/app/api/orders/route.ts
- [ ] T042 [US3] Implement order submission with transaction handling and RLS policy compliance
- [ ] T043 [US3] Add real-time notification to admin dashboard via new-orders channel
- [ ] T044 [US3] Implement unique order ID generation and email confirmation workflow

**Checkpoint**: Order submission is fully functional with admin notifications and confirmation

---

## Phase 6: User Story 4 - Order Status Tracking (Priority: P2)

**Goal**: Restaurant users can track order status in real-time with timeline and updates

**Independent Test**: Place order, verify real-time status updates, and confirm timeline accuracy

### Tests for User Story 4 (REQUIRED) ⚠️

- [ ] T045 [P] [US4] Unit test for OrderStatusTimeline component in tests/unit/restaurant/OrderStatusTimeline.test.tsx
- [ ] T046 [P] [US4] Integration test for order tracking API in tests/integration/restaurant-order-tracking.test.ts
- [ ] T047 [P] [US4] Real-time test for order status updates in tests/integration/realtime-order-status.test.ts

### Implementation for User Story 4

- [ ] T048 [P] [US4] Create OrderStatusTimeline component in frontend/src/components/restaurant/OrderStatusTimeline.tsx
- [ ] T049 [P] [US4] Create OrderTracking page in frontend/src/app/(dashboard)/restaurant/orders/tracking/[orderId]/page.tsx
- [ ] T050 [P] [US4] Create DriverInfo component for delivery details in frontend/src/components/restaurant/DriverInfo.tsx
- [ ] T051 [P] [US4] Implement tracking service in frontend/src/lib/services/restaurant/tracking.service.ts
- [ ] T052 [US4] Create order status API endpoint in frontend/src/app/api/orders/[orderId]/status/route.ts
- [ ] T053 [US4] Add real-time subscription to order-status-{orderId} channel
- [ ] T054 [US4] Implement Georgian status labels and timeline visualization
- [ ] T055 [US4] Add offline handling with status queue and reconnection logic

**Checkpoint**: Order tracking system is fully functional with real-time updates and Georgian localization

---

## Phase 7: User Story 5 - Order History (Priority: P2)

**Goal**: Restaurant users can view complete order history with search and CSV export

**Independent Test**: Navigate to order history, filter by date/status, and export CSV file

### Tests for User Story 5 (REQUIRED) ⚠️

- [ ] T056 [P] [US5] Unit test for OrderHistory component in tests/unit/restaurant/OrderHistory.test.tsx
- [ ] T057 [P] [US5] Integration test for order history API in tests/integration/restaurant-order-history.test.ts
- [ ] T058 [P] [US5] Performance test for large dataset queries in tests/performance/order-history-queries.test.ts

### Implementation for User Story 5

- [ ] T059 [P] [US5] Create OrderHistory page in frontend/src/app/(dashboard)/restaurant/orders/history/page.tsx
- [ ] T060 [P] [US5] Create OrderHistoryTable component in frontend/src/components/restaurant/OrderHistoryTable.tsx
- [ ] T061 [P] [US5] Create OrderHistoryFilters component for search and filtering in frontend/src/components/restaurant/OrderHistoryFilters.tsx
- [ ] T062 [P] [US5] Create CSVExport component in frontend/src/components/restaurant/CSVExport.tsx
- [ ] T063 [US5] Create order history API endpoint with pagination in frontend/src/app/api/orders/history/route.ts
- [ ] T064 [US5] Implement CSV export functionality with Georgian formatting
- [ ] T065 [US5] Add performance optimization for large datasets with virtualization
- [ ] T066 [US5] Implement date range filtering with UTC+4 timezone support

**Checkpoint**: Order history system is fully functional with search, filtering, and export capabilities

---

## Phase 8: User Story 6 - Order Comments & Communication (Priority: P3)

**Goal**: Restaurant users can add comments to orders for communication with admin

**Independent Test**: Add comments to orders, verify real-time notifications to admin, and test comment moderation

### Tests for User Story 6 (REQUIRED) ⚠️

- [ ] T067 [P] [US6] Unit test for OrderCommentSection component in tests/unit/restaurant/OrderCommentSection.test.tsx
- [ ] T068 [P] [US6] Integration test for order comments API in tests/integration/restaurant-order-comments.test.ts
- [ ] T069 [P] [US6] RLS policy test for comment access control in tests/security/rls-order-comments.test.ts

### Implementation for User Story 6

- [ ] T070 [P] [US6] Create OrderCommentSection component in frontend/src/components/restaurant/OrderCommentSection.tsx
- [ ] T071 [P] [US6] Create CommentForm component in frontend/src/components/restaurant/CommentForm.tsx
- [ ] T072 [P] [US6] Create CommentList component in frontend/src/components/restaurant/CommentList.tsx
- [ ] T073 [US6] Create order comments API endpoint in frontend/src/app/api/orders/[orderId]/comments/route.ts
- [ ] T074 [US6] Implement real-time comment notifications via order-comments-{orderId} channel
- [ ] T075 [US6] Add comment validation and moderation with input sanitization
- [ ] T076 [US6] Implement comment audit logging and history tracking

**Checkpoint**: Order communication system is fully functional with real-time notifications and moderation

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and ensure production readiness

- [ ] T077 [P] Add comprehensive error boundaries for all restaurant components
- [ ] T078 [P] Implement loading states and skeleton screens for better UX
- [ ] T079 [P] Add accessibility testing and ARIA labels for restaurant interface
- [ ] T080 [P] Optimize mobile responsiveness and touch interactions
- [ ] T081 [P] Update documentation in specs/002-restaurant-order-management/quickstart.md
- [ ] T082 [P] Run performance optimization across all restaurant features
- [ ] T083 [P] Security hardening: validate all RLS policies and Supabase Auth flows
- [ ] T084 [P] Georgian localization verification: all text, dates, currency, and numbers
- [ ] T085 Verify Chrome DevTools console is error-free on all key flows
- [ ] T086 Run `npm run lint -- --max-warnings=0`, `npm run type-check`, and `npm run test` successfully
- [ ] T087 [P] Deploy to development environment and validate end-to-end workflows
- [ ] T088 [P] Generate Supabase types and update all TypeScript references

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1-3 (P1)**: Can start after Foundational (Phase 2) - MVP deliverables
- **User Story 4-5 (P2)**: Can start after Foundational (Phase 2) - Enhanced features
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - Nice-to-have features

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Components before services
- Services before API endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all P1 user stories can start in parallel
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3-5: User Stories 1-3 (P1 MVP)
4. **STOP and VALIDATE**: Test MVP independently with end-to-end workflow
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1-3 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 4-5 → Test independently → Deploy/Demo
4. Add User Story 6 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Product Catalog)
   - Developer B: User Story 2 (Shopping Cart)
   - Developer C: User Story 3 (Order Submission)
   - Developer D: User Story 4 (Order Tracking)
   - Developer E: User Story 5 (Order History)
   - Developer F: User Story 6 (Comments)
3. Stories complete and integrate independently

---

## Quality Gate Checklist

Before marking any phase as complete:

### Code Quality
- [ ] TypeScript compilation: `npm run type-check` passes with zero errors
- [ ] ESLint: `npm run lint -- --max-warnings=0` passes with zero warnings
- [ ] All components use proper TypeScript types and strict mode
- [ ] No console.error or console.warn statements in production code

### Testing
- [ ] All unit tests pass: `npm run test` with > 90% coverage
- [ ] Integration tests verify end-to-end workflows
- [ ] Real-time tests confirm WebSocket functionality
- [ ] RLS policy tests validate security

### Performance
- [ ] Product catalog loads < 200ms (p95)
- [ ] Cart operations < 100ms (p95)
- [ ] Order submission < 500ms (p95)
- [ ] Order status updates < 1 second (p99)

### Georgian Localization
- [ ] All text displays in Georgian language
- [ ] Currency formatting uses GEL with proper separators
- [ ] Date/time displays use UTC+4 timezone
- [ ] Number formatting follows Georgian conventions

### Security
- [ ] All RLS policies enforced and tested
- [ ] Supabase Auth integration without mocks
- [ ] Input validation and sanitization
- [ ] Cross-tenant data isolation verified

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

**Total Tasks**: 88 tasks across 9 phases  
**Estimated Duration**: 90 hours across 4 weeks  
**MVP Completion**: Tasks T001-T044 (Foundational + User Stories 1-3) in Week 1-2