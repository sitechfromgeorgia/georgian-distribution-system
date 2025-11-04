# Restaurant Order Management Feature Specification

## Executive Summary

The Restaurant Order Management system enables restaurants to digitally order products from the distributor with a streamlined, real-time experience. This feature transforms the manual ordering process into an automated digital workflow that integrates with the existing admin and driver management systems.

## Feature Overview

### Scope
This feature provides restaurants with a complete ordering experience including product catalog browsing, cart management, order submission, and real-time order tracking. Orders are placed without price visibility, with pricing determined by the administrator after purchase.

### Success Criteria
- **User Experience**: Restaurant users can place orders in under 3 minutes (p95)
- **Reliability**: Order submission success rate > 99.5%
- **Real-time Updates**: Order status changes propagate within 1 second (p99)
- **Georgian Market**: Full Georgian language support and GEL currency formatting

## User Stories

### P1 - Core Order Placement (Critical)

**US-001: Product Catalog Browsing**
As a restaurant owner, I want to browse available products with categories and search functionality so I can find the items I need quickly.

**Acceptance Criteria:**
- Display all active products with names, categories, units, and images
- Support category filtering (meat, vegetables, dairy, grains, beverages, condiments, spices, other)
- Real-time search with debounced input (300ms)
- Mobile-responsive grid layout
- Georgian language product names supported

**Technical Requirements:**
- Database query optimization for product catalog (index on `category`, `is_active`, `name`)
- TypeScript types for Product interface with strict validation
- Real-time updates for product availability
- Error boundaries for grid rendering failures

**Real-time Requirements:**
- Channel: `product-catalog-changes`
- Payload: `{ product_id, action: 'created'|'updated'|'deleted', timestamp }`
- Subscriber: Product catalog component

**Security Requirements:**
- RLS Policy: Restaurants can only see active products (`is_active = true`)
- Type validation using Zod Product schemas
- No price information exposed during catalog browsing

---

**US-002: Shopping Cart Management**
As a restaurant owner, I want to add/remove products to/from my cart with quantities so I can build my order efficiently.

**Acceptance Criteria:**
- Add products to cart with quantity selection
- View current cart contents with total item count
- Remove items from cart
- Cart persists across browser sessions
- Quantity validation (minimum 1, maximum configurable per product)
- Georgian language unit labels

**Technical Requirements:**
- Client-side cart state management (Zustand)
- Cart persistence in localStorage with encrypted serialization
- Real-time cart updates (cross-tab synchronization)
- Quantity input validation with Georgian number formatting

**Real-time Requirements:**
- Channel: `cart-updates-{restaurant_id}`
- Payload: `{ cart_contents, timestamp }`
- Subscriber: Cart widget component

**Security Requirements:**
- Client-side only storage (no sensitive data)
- Server-side validation for order creation
- Input sanitization for all cart operations

---

**US-003: Order Submission**
As a restaurant owner, I want to submit my cart as an order with delivery details so I can place my order with the distributor.

**Acceptance Criteria:**
- Submit order with delivery address and special instructions
- No price information shown during submission
- Order confirmation with unique order ID
- Automatic redirect to order tracking page
- Email notification (optional)
- Georgian language order confirmation text

**Technical Requirements:**
- Order creation API endpoint with Zod validation
- Database transaction for order + order_items creation
- Unique order ID generation (UUID format)
- Real-time notification to admin dashboard
- Error handling with retry logic

**Real-time Requirements:**
- Channel: `new-orders`
- Payload: `{ order_id, restaurant_id, delivery_address, total_items, timestamp }`
- Subscriber: Admin dashboard order list

**Security Requirements:**
- RLS Policy: Restaurants can only create orders for their own account
- Authentication required for order submission
- Input sanitization for delivery address and instructions

### P2 - Order Tracking (Important)

**US-004: Order Status Tracking**
As a restaurant owner, I want to track my order status in real-time so I know when to expect my delivery.

**Acceptance Criteria:**
- Display current order status with Georgian status labels
- Real-time status updates via WebSocket
- Status history timeline
- Estimated delivery time (when available)
- Mobile-responsive tracking interface

**Status Flow:**
1. `pending` - Order submitted, awaiting admin review
2. `confirmed` - Admin confirmed order
3. `priced` - Pricing completed by admin
4. `out_for_delivery` - Driver assigned and en route
5. `delivered` - Driver marked as delivered
6. `received` - Restaurant confirmed receipt (final)

**Technical Requirements:**
- Real-time subscription to order status changes
- Order status query optimization (index on `status`, `restaurant_id`, `created_at`)
- Status change timestamp tracking
- Offline handling with status queue

**Real-time Requirements:**
- Channel: `order-status-{order_id}`
- Payload: `{ order_id, status, previous_status, driver_id, timestamp }`
- Subscriber: Order tracking component

**Security Requirements:**
- RLS Policy: Restaurants can only view their own orders
- Status change authorization for admin/driver roles
- Audit logging for all status changes

---

**US-005: Order History**
As a restaurant owner, I want to view my complete order history with details so I can track my purchasing patterns and costs.

**Acceptance Criteria:**
- Searchable order history with date range filtering
- Order details including items, quantities, and final prices
- CSV export for accounting purposes
- Pagination for large datasets
- Georgian language order status labels

**Technical Requirements:**
- Order history API with advanced filtering
- CSV generation endpoint
- Performance optimization for historical queries
- Date range validation with timezone handling (UTC+4)

**Real-time Requirements:**
- Channel: `order-history-updates-{restaurant_id}`
- Payload: `{ order_id, status: 'completed', final_amount, timestamp }`
- Subscriber: Order history component

**Security Requirements:**
- RLS Policy: Restaurants can only access their own order history
- Price information only visible for completed orders
- Audit trail for order history access

### P3 - Enhanced Features (Nice-to-Have)

**US-006: Order Comments & Communication**
As a restaurant owner, I want to add comments to my orders so I can communicate special requirements.

**Acceptance Criteria:**
- Add comments during order placement
- Add comments after order completion (for issues)
- View comment history for each order
- Real-time comment notifications to admin

**Technical Requirements:**
- Order comments table with foreign key relationships
- Comment CRUD API endpoints
- Real-time comment notifications
- Comment validation and moderation

**Real-time Requirements:**
- Channel: `order-comments-{order_id}`
- Payload: `{ order_id, comment_text, author_role, timestamp }`
- Subscriber: Admin dashboard and restaurant order details

**Security Requirements:**
- RLS Policy: Restaurants can only add/view comments on their own orders
- Input sanitization and length validation
- Comment audit logging

## Data Model

### Existing Tables
- `products` (id, name, category, unit, cost_price, markup_percentage, is_active, image_url)
- `orders` (id, restaurant_id, driver_id, status, delivery_address, special_instructions, total_amount, created_at)
- `order_items` (id, order_id, product_id, quantity, unit_price, total_price)
- `profiles` (id, role, restaurant_name, created_at)

### New Tables Required
```sql
-- Order comments for communication
CREATE TABLE order_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  comment_type text DEFAULT 'general' CHECK (comment_type IN ('general', 'issue', 'praise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shopping cart persistence (optional, for advanced features)
CREATE TABLE cart_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, product_id)
);
```

### Database Indexes Required
```sql
-- Product catalog performance
CREATE INDEX idx_products_category_active ON products(category, is_active);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('georgian', name));

-- Order tracking performance
CREATE INDEX idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_restaurant_created ON orders(restaurant_id, created_at DESC);

-- Order comments performance
CREATE INDEX idx_order_comments_order ON order_comments(order_id, created_at DESC);

-- Cart performance
CREATE INDEX idx_cart_snapshots_restaurant ON cart_snapshots(restaurant_id);
```

## API Contracts

### Order Creation Endpoint
```typescript
POST /api/orders
Content-Type: application/json

{
  "delivery_address": "string",
  "special_instructions": "string?",
  "items": [
    {
      "product_id": "uuid",
      "quantity": "number",
      "unit": "string",
      "special_instructions": "string?"
    }
  ]
}

Response: 201 Created
{
  "order_id": "uuid",
  "status": "pending",
  "created_at": "ISO string",
  "estimated_delivery": "ISO string?"
}
```

### Order Tracking Endpoint
```typescript
GET /api/orders/{order_id}/status

Response: 200 OK
{
  "order_id": "uuid",
  "status": "pending" | "confirmed" | "priced" | "out_for_delivery" | "delivered" | "received",
  "status_history": [
    {
      "status": "string",
      "timestamp": "ISO string",
      "changed_by": "uuid"
    }
  ],
  "current_driver": {
    "id": "uuid",
    "name": "string",
    "phone": "string"
  }?
}
```

### Order History Endpoint
```typescript
GET /api/orders/history?page=1&limit=20&status=completed&start_date=2025-01-01&end_date=2025-12-31

Response: 200 OK
{
  "orders": [
    {
      "order_id": "uuid",
      "created_at": "ISO string",
      "status": "string",
      "total_amount": "number",
      "items_count": "number",
      "delivery_address": "string"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

## Real-time Channels

### Channel Specifications

**Channel: `product-catalog-changes`**
```typescript
{
  "product_id": "uuid",
  "action": "created" | "updated" | "deleted",
  "changes": {
    "name"?: "string",
    "category"?: "string", 
    "is_active"?: "boolean",
    "unit"?: "string",
    "image_url"?: "string"
  },
  "timestamp": "ISO string"
}
```

**Channel: `new-orders`**
```typescript
{
  "order_id": "uuid",
  "restaurant_id": "uuid",
  "restaurant_name": "string",
  "delivery_address": "string",
  "total_items": "number",
  "special_instructions": "string?",
  "timestamp": "ISO string"
}
```

**Channel: `order-status-{order_id}`**
```typescript
{
  "order_id": "uuid",
  "status": "pending" | "confirmed" | "priced" | "out_for_delivery" | "delivered" | "received",
  "previous_status": "string?",
  "driver_id": "uuid?",
  "estimated_delivery": "ISO string?",
  "timestamp": "ISO string"
}
```

## Security Requirements

### RLS Policies Required

**Order Comments Table:**
```sql
-- Allow restaurant to view comments on their own orders
CREATE POLICY "Restaurants can view own order comments"
ON order_comments FOR SELECT
USING (
  get_my_claim('role')::text = 'restaurant' AND
  order_id IN (
    SELECT id FROM orders WHERE restaurant_id = auth.uid()
  )
);

-- Allow restaurant to insert comments on their own orders
CREATE POLICY "Restaurants can insert own order comments"
ON order_comments FOR INSERT
WITH CHECK (
  get_my_claim('role')::text = 'restaurant' AND
  order_id IN (
    SELECT id FROM orders WHERE restaurant_id = auth.uid()
  ) AND
  author_id = auth.uid()
);

-- Allow admin and restaurant to view comments on orders
CREATE POLICY "Admins can view all order comments"
ON order_comments FOR SELECT
USING (get_my_claim('role')::text = 'admin');
```

**Cart Snapshots Table:**
```sql
-- Allow restaurant to manage their own cart
CREATE POLICY "Restaurants can manage own cart"
ON cart_snapshots FOR ALL
USING (
  get_my_claim('role')::text = 'restaurant' AND
  restaurant_id = auth.uid()
);
```

### Role Matrix
| Action | Admin | Restaurant | Driver | Demo |
|--------|-------|------------|--------|------|
| Browse Products | ✅ | ✅ (active only) | ❌ | ✅ (limited) |
| Add to Cart | ❌ | ✅ | ❌ | ❌ |
| Create Order | ❌ | ✅ | ❌ | ❌ |
| View Order Status | ✅ | ✅ (own only) | ✅ (assigned only) | ✅ (read-only) |
| Add Order Comments | ✅ | ✅ (own only) | ✅ (assigned only) | ❌ |
| View Order History | ✅ | ✅ (own only) | ❌ | ❌ |
| Export Order History | ✅ | ✅ (own only) | ❌ | ❌ |

## Performance Requirements

### API Latency Targets
- Product catalog loading: < 200ms (p95)
- Cart operations: < 100ms (p95)
- Order submission: < 500ms (p95)
- Order status updates: < 300ms (p95)

### Database Query Optimization
- Products: Indexed queries with category filtering
- Orders: Pagination with created_at ordering
- Order status: Real-time subscriptions preferred over polling
- Comments: Threaded queries with pagination

### Client Performance
- Product images: Lazy loading with placeholder
- Cart: Local storage with sync across tabs
- Status updates: WebSocket with fallback to polling
- Mobile: Touch-optimized interfaces with 44px minimum touch targets

## Georgian Market Standards

### Localization Requirements
- Product names: Full Georgian language support
- Status labels: Georgian translations (მოლოდინში, დადასტურებული, ფასდაუდებელი, მიწოდებაზე, მიწოდებული, მიღებული)
- Currency: GEL formatting with 2 decimal precision
- Date/time: Georgia Standard Time (UTC+4) with timezone labels
- Units: Georgian language unit labels (კგ, ცალი, პაკეტი, ლიტრი)

### Number Formatting
- Quantities: Georgian number formatting
- Prices: GEL currency with comma decimal separator
- Dates: DD/MM/YYYY format with Georgian month names

## Quality Gates

### Pre-Implementation Checklist
- ✅ Real-time channels documented with payload contracts
- ✅ RLS policies defined for new tables
- ✅ TypeScript types generated for new data structures
- ✅ Georgian language support verified
- ✅ Performance indexes identified and planned
- ✅ Authentication flows verified without mocks

### Testing Requirements
- Unit tests for cart state management
- Integration tests for order submission workflow
- Real-time tests for order status updates
- RLS policy tests for data isolation
- Georgian language rendering tests
- Performance tests for catalog queries (p95 < 200ms)

### Build Verification
- `npm run type-check` passes with zero errors
- `npm run lint -- --max-warnings=0` passes
- Supabase types regenerated successfully
- Chrome DevTools console clean (no errors)
- Mobile responsive testing completed

## Dependencies

### External Dependencies
- Supabase Realtime: WebSocket connections for live updates
- Supabase Auth: Role-based authentication
- Supabase Storage: Product images (if implemented)

### Internal Dependencies
- Existing database schema (products, orders, order_items, profiles)
- Analytics dashboard: Order completion metrics
- Admin dashboard: Order management interface
- Driver workflow: Delivery assignment and tracking

### Future Dependencies
- Payment processing: Future enhancement for automated billing
- Inventory management: Product availability tracking
- Route optimization: Driver delivery route calculation

## Risk Assessment

### Technical Risks
1. **Real-time Performance**: High volume of order status updates
   - Mitigation: WebSocket connection pooling and efficient payload design
2. **Mobile Performance**: Product catalog loading on mobile networks
   - Mitigation: Image optimization and pagination
3. **Data Consistency**: Order status synchronization across clients
   - Mitigation: Database-level state management with transactions

### Business Risks
1. **User Adoption**: Resistance to digital ordering from traditional restaurants
   - Mitigation: Intuitive UI and comprehensive training materials
2. **Order Accuracy**: Digital orders may have higher error rates initially
   - Mitigation: Robust validation and order confirmation workflow
3. **Price Sensitivity**: Restaurants expecting immediate price visibility
   - Mitigation: Clear communication about pricing workflow in UI

## Implementation Timeline

### Phase 1: Core Ordering (Week 1)
- US-001: Product catalog browsing
- US-002: Shopping cart management  
- US-003: Order submission

### Phase 2: Order Tracking (Week 2)
- US-004: Order status tracking
- Order history API and UI
- Real-time channel integration

### Phase 3: Enhanced Features (Week 3)
- US-005: Order history with export
- US-006: Order comments and communication
- Performance optimization and testing

### Phase 4: Polish and Testing (Week 4)
- Georgian language verification
- Mobile responsive optimization
- Performance testing and tuning
- Production deployment preparation

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-01  
**Feature ID**: 002-restaurant-order-management  
**Constitution Compliance**: ✅ All principles addressed