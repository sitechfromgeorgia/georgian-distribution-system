# Data Model: Analytics Dashboard KPIs

**Feature**: Analytics Dashboard KPIs  
**Branch**: `001-analytics-dashboard`  
**Phase**: 1 - Design & Contracts  
**Date**: 2025-11-01

## Overview

This document defines the data entities, relationships, and calculations for the Analytics Dashboard feature. The dashboard aggregates existing `orders` data into three key performance indicators (KPIs) without requiring new database tables.

## Entities

### Existing Entity: Order

**Table**: `orders`  
**Purpose**: Stores all order transactions in the distribution system

**Relevant Columns**:

| Column | Type | Description | Used For |
|--------|------|-------------|----------|
| `id` | UUID | Primary key | Order counting, CSV export |
| `restaurant_id` | UUID | Restaurant owner (FK to profiles) | RLS filtering, export details |
| `driver_id` | UUID | Assigned driver (FK to profiles) | Export details |
| `status` | order_status | Order lifecycle state | Status filtering, completion checks |
| `created_at` | TIMESTAMPTZ | Order creation timestamp | Date range filtering, duration calc |
| `delivery_time` | TIMESTAMPTZ | Delivery completion timestamp | On-time calculation, duration calc |
| `total_amount` | DECIMAL(10,2) | Order total in GEL | Export financial details |
| `delivery_fee` | DECIMAL(10,2) | Delivery charge | Export financial details |
| `tax_amount` | DECIMAL(10,2) | Tax portion | Export financial details |
| `updated_at` | TIMESTAMPTZ | Last modification | Audit trail |

**Existing Indexes** (relevant to analytics):
- `idx_orders_created_at` - Used for date range filtering
- `idx_orders_status` - Used for status filtering
- `idx_orders_restaurant_id` - Used for RLS enforcement

**New Index** (required for analytics):
- `idx_orders_analytics` - Composite index `(created_at, status, delivery_time)` with partial filter `WHERE status IN ('delivered', 'completed', 'cancelled')`

**RLS Policies** (relevant):
- Admin role can SELECT all orders (existing policy)
- Operations Manager role will use same policy as Admin (MVP implementation)

### Derived Entity: KPI Summary

**Not Stored**: Computed dynamically from `orders` table per request

**Structure**:

```typescript
interface KPISummary {
  orders_per_day: number;      // Average orders per calendar day in range
  on_time_rate: number;         // Percentage of orders delivered on time
  avg_delivery_time: number;    // Average duration in minutes
  total_orders: number;         // Count of orders matching filters
  excluded_count: number;       // Orders excluded due to missing data
  date_range: DateRange;        // Applied date filter
  filters: FilterCriteria;      // Applied status filters
}

interface DateRange {
  from: string;  // ISO 8601 timestamp (UTC+4 Georgia time)
  to: string;    // ISO 8601 timestamp (UTC+4 Georgia time)
}

interface FilterCriteria {
  status?: OrderStatus[];  // Optional status filter values
}

type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'priced' 
  | 'assigned' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'completed' 
  | 'cancelled';
```

### Derived Entity: Order Export Row

**Not Stored**: Generated on-demand for CSV export

**Structure**:

```typescript
interface OrderExportRow {
  order_id: string;             // UUID as string
  restaurant_name: string;      // Joined from profiles table
  driver_name: string | null;   // Joined from profiles table (nullable)
  status: OrderStatus;          // Current order status
  created_at: string;           // ISO 8601 formatted timestamp
  delivery_time: string | null; // ISO 8601 formatted timestamp (nullable)
  duration_minutes: number | null; // Calculated delivery duration
  total_amount: string;         // Formatted as "125.50 GEL"
  delivery_fee: string;         // Formatted as "10.00 GEL"
  tax_amount: string;           // Formatted as "15.50 GEL"
}
```

## Relationships

```
profiles (restaurant_id)
    ↓ 1:N
orders ← (filters: date_range, status) → [AGGREGATE QUERIES] → KPISummary
    ↓ 1:N
order_items (not used in MVP)

profiles (driver_id, optional)
    ↓ 1:N
orders → [JOIN for export] → OrderExportRow[]
```

**Key Relationships**:
- **orders.restaurant_id → profiles.id**: Used for RLS enforcement and export restaurant names
- **orders.driver_id → profiles.id**: Used for export driver names (nullable)
- **KPISummary aggregates orders**: Filtered by date range and status

## Calculations

### 1. Orders Per Day

**Formula**:
```sql
SELECT 
  COUNT(*) / NULLIF(DATE_PART('day', :to::timestamp - :from::timestamp) + 1, 0) AS orders_per_day
FROM orders
WHERE created_at >= :from
  AND created_at <= :to
  AND (:status IS NULL OR status = ANY(:status::order_status[]))
```

**Logic**:
- Count all orders matching filters
- Divide by number of calendar days in range (inclusive)
- `NULLIF` prevents division by zero for same-day ranges
- Round to 2 decimal places in application layer

**Example**: 
- 50 orders in 7-day range = 7.14 orders/day
- 0 orders in 30-day range = 0.00 orders/day

---

### 2. On-Time Delivery Rate

**Formula**:
```sql
WITH delivered_orders AS (
  SELECT 
    id,
    delivery_time,
    created_at + INTERVAL '90 minutes' AS promised_time
  FROM orders
  WHERE created_at >= :from
    AND created_at <= :to
    AND status IN ('delivered', 'completed')
    AND delivery_time IS NOT NULL
    AND (:status IS NULL OR status = ANY(:status::order_status[]))
)
SELECT 
  (COUNT(*) FILTER (WHERE delivery_time <= promised_time)::float / NULLIF(COUNT(*), 0) * 100) AS on_time_rate
FROM delivered_orders
```

**Logic**:
- **Promised Time**: `created_at + 60 minutes` (delivery window) + 30 minutes (tolerance) = 90 minutes total
- Count orders where `delivery_time <= promised_time`
- Divide by total delivered/completed orders with non-null `delivery_time`
- Multiply by 100 for percentage
- Exclude orders without `delivery_time` (counted in `excluded_count`)
- Round to 1 decimal place in application layer

**Example**:
- 85 on-time out of 100 delivered = 85.0% on-time rate
- 0 delivered orders = NULL (display as "N/A")

**Future Enhancement**: Replace hardcoded 90 minutes with database column `promised_delivery_time` when added

---

### 3. Average Delivery Time

**Formula**:
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (delivery_time - created_at)) / 60) AS avg_delivery_time_minutes
FROM orders
WHERE created_at >= :from
  AND created_at <= :to
  AND status IN ('delivered', 'completed')
  AND delivery_time IS NOT NULL
  AND created_at IS NOT NULL
  AND (:status IS NULL OR status = ANY(:status::order_status[]))
```

**Logic**:
- Calculate duration: `delivery_time - created_at`
- Convert PostgreSQL interval to seconds with `EXTRACT(EPOCH FROM ...)` 
- Divide by 60 to get minutes
- Average across all qualifying orders
- Exclude orders with NULL `delivery_time` or `created_at` (counted in `excluded_count`)
- Round to 0 decimal places (whole minutes) in application layer

**Example**:
- Order 1: 45 min, Order 2: 60 min, Order 3: 50 min → Avg: 52 minutes
- 0 completed orders = NULL (display as "N/A")

---

### 4. Excluded Orders Count

**Formula**:
```sql
SELECT COUNT(*) AS excluded_count
FROM orders
WHERE created_at >= :from
  AND created_at <= :to
  AND (:status IS NULL OR status = ANY(:status::order_status[]))
  AND (delivery_time IS NULL OR created_at IS NULL)
```

**Logic**:
- Count orders matching date and status filters
- But missing required timestamps (`delivery_time` or `created_at`)
- Displayed as informational note: "3 orders excluded due to incomplete data"
- Helps users understand why totals may not add up

---

## Validation Rules

### Input Validation

**Date Range** (`DateRange`):
- `from` MUST be valid ISO 8601 timestamp
- `to` MUST be valid ISO 8601 timestamp
- `from` MUST be <= `to`
- `to - from` MUST NOT exceed 12 months (365 days)
- Validation: Zod schema in `src/lib/validators/analytics.ts`

**Status Filter** (`FilterCriteria.status`):
- MUST be array of valid `order_status` enum values
- Empty array or omitted = no status filter (all statuses)
- Validation: Zod schema with enum constraint

### Output Validation

**KPISummary**:
- All numeric fields MUST be non-negative or NULL
- `on_time_rate` MUST be 0-100 or NULL
- `excluded_count` MUST be non-negative integer
- NULL values displayed as "N/A" in UI

**OrderExportRow**:
- `order_id` MUST be valid UUID string
- Timestamps MUST be ISO 8601 formatted
- Currency amounts MUST include "GEL" suffix
- NULL values rendered as empty cells in CSV

---

## State Transitions

**Not Applicable**: This feature performs read-only queries. No state transitions occur.

The `orders.status` field has its own state machine (managed by order management feature), but analytics dashboard only observes status values, never modifies them.

---

## Data Quality Considerations

### Missing Timestamps

**Issue**: Orders may have NULL `delivery_time` if:
- Order is still in progress (`pending`, `assigned`, `out_for_delivery`)
- Order was cancelled before delivery
- Data entry error (historical data)

**Handling**: Exclude from time-based KPIs (`on_time_rate`, `avg_delivery_time`), count in `excluded_count`

### Timezone Consistency

**Requirement**: All date calculations MUST use Georgia Standard Time (UTC+4)

**Implementation**:
- Store timestamps in PostgreSQL as `TIMESTAMPTZ` (UTC internally)
- Convert to UTC+4 for display: `AT TIME ZONE 'Asia/Tbilisi'`
- Date range filters use UTC+4 start-of-day boundaries

### Historical Data Accuracy

**Challenge**: Orders created before this feature may lack complete data

**Mitigation**:
- Display excluded count prominently
- Consider data quality audit for historical backfill (future work)
- Focus on forward-looking data quality (new orders have complete timestamps)

---

## Performance Optimization

### Index Strategy

**Composite Index** (new):
```sql
CREATE INDEX CONCURRENTLY idx_orders_analytics 
ON orders(created_at, status, delivery_time)
WHERE status IN ('delivered', 'completed', 'cancelled');
```

**Benefits**:
- Covers date range + status filters in single index scan
- Partial index reduces size and improves maintenance
- Allows index-only scans for COUNT queries

### Query Caching

**Client-Side** (TanStack Query):
- Cache KPI results for 5 minutes (`staleTime: 300000`)
- Invalidate cache on manual refresh
- Share cache across dashboard components

**Server-Side** (future enhancement):
- Consider PostgreSQL materialized views for daily rollups
- Defer until query times exceed 5s consistently

---

## Future Enhancements

1. **Promised Delivery Time Column**: Add `orders.promised_delivery_time` for explicit tracking instead of calculated value
2. **Percentile Metrics**: Add p50, p95 delivery times for more detailed analysis
3. **Trend Charts**: Visualize KPIs over time with Recharts line charts
4. **Comparative Analytics**: Compare current period to previous period (e.g., last 7 days vs. prior 7 days)
5. **Driver Performance**: Break down KPIs by driver for performance reviews
6. **Geographic Analysis**: Segment KPIs by delivery zone or restaurant location

---

## Summary

The Analytics Dashboard data model leverages the existing `orders` table with a new composite index for performance. All KPIs are computed dynamically without requiring new storage. Clear validation rules and data quality handling ensure reliable metrics for operations managers.

**Next Step**: Generate API contracts in `contracts/` directory.

---

**Status**: ✅ Complete  
**Date**: 2025-11-01
