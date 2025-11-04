# Analytics Dashboard Feature

## Overview

The Analytics Dashboard provides operations managers with key performance indicators (KPIs) for monitoring distribution operations. This feature allows users to view metrics, apply filters, and export data for further analysis.

## Features

### Implemented

- ✅ **View KPIs by Date Range**: Display Orders per Day, On-time Delivery Rate, and Average Delivery Time
- ✅ **Filter by Status**: Filter orders by status (pending, confirmed, delivered, etc.)
- ✅ **Date Range Selection**: Preset buttons (7/14/30 days) and custom date picker
- ✅ **CSV Export**: Export current view to CSV file for external analysis
- ✅ **Performance Warnings**: Alert users when querying large date ranges (>90 days)
- ✅ **Empty States**: Clear messaging when no data is available
- ✅ **Excluded Orders Notice**: Inform users when orders are excluded due to incomplete data

### Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/analytics/
│   │   │   └── page.tsx               # Main dashboard page
│   │   └── api/analytics/
│   │       ├── kpis/route.ts          # KPI metrics API
│   │       └── export/route.ts        # CSV export API
│   ├── components/analytics/
│   │   ├── KPICard.tsx                # KPI display card
│   │   ├── DateRangeFilter.tsx        # Date range selector
│   │   ├── StatusFilter.tsx           # Status dropdown filter
│   │   ├── ExportButton.tsx           # CSV export button
│   │   └── EmptyState.tsx             # No data placeholder
│   ├── hooks/
│   │   └── useAnalytics.ts            # Analytics state management hook
│   ├── lib/
│   │   ├── validators/analytics.ts    # Zod validation schemas
│   │   └── supabase/analytics.service.ts  # Analytics data service
│   └── types/
│       └── analytics.ts               # TypeScript type definitions
└── tests/
    └── unit/analytics/
        └── validators.test.ts         # Unit tests
```

### API Endpoints

#### GET /api/analytics/kpis

Fetch KPI metrics for specified date range and filters.

**Query Parameters:**
- `from` (required): ISO 8601 timestamp
- `to` (required): ISO 8601 timestamp
- `status` (optional): Comma-separated status values

**Response:**
```json
{
  "orders_per_day": 10.5,
  "on_time_rate": 85.2,
  "avg_delivery_time": 52,
  "total_orders": 150,
  "excluded_count": 3,
  "date_range": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-01-07T23:59:59Z"
  },
  "filters": {
    "status": ["delivered", "completed"]
  }
}
```

#### GET /api/analytics/export

Export analytics data as CSV file.

**Query Parameters:** Same as `/api/analytics/kpis`

**Response:** CSV file download

### KPI Calculations

#### Orders per Day
```
Formula: COUNT(orders) / number_of_calendar_days
Example: 70 orders / 7 days = 10.0 orders/day
```

#### On-time Delivery Rate
```
Formula: (COUNT(on_time_orders) / COUNT(delivered_orders)) * 100
On-time: delivered within 90 minutes of created_at (60min window + 30min tolerance)
Example: 85 on-time / 100 delivered = 85.0%
```

#### Average Delivery Time
```
Formula: AVG(delivery_time - created_at) for completed orders
Units: Minutes
Example: (45min + 60min + 50min) / 3 = 52 minutes
```

### Authentication & Authorization

- **Required Role**: Admin (or Operations Manager when role is added)
- **RLS Enforcement**: Server-side queries enforce Row Level Security policies
- **Token Validation**: JWT token verified on all API requests

### Usage

1. Navigate to `/analytics` in the application
2. Select date range using preset buttons or custom picker
3. Optionally filter by order status
4. View KPI metrics in dashboard cards
5. Export data to CSV using Export button

### Performance Considerations

- **Date Range Limits**: Max 365 days, warning at >90 days
- **Query Caching**: TanStack Query caches results for 5 minutes
- **Database Index**: Composite index on `(created_at, status, delivery_time)`
- **Target Load Time**: <2 seconds for typical ranges (7-30 days)

### Error Handling

- **Authentication Errors**: 401 Unauthorized
- **Authorization Errors**: 403 Forbidden (insufficient role)
- **Validation Errors**: 400 Bad Request with descriptive message
- **Server Errors**: 500 Internal Server Error with logged details

### Future Enhancements

1. **Promised Delivery Time Column**: Add explicit tracking instead of calculated value
2. **Percentile Metrics**: Add p50, p95 delivery times
3. **Trend Charts**: Visualize KPIs over time with line charts
4. **Comparative Analytics**: Compare current vs. previous period
5. **Driver Performance**: Break down KPIs by driver
6. **Geographic Analysis**: Segment KPIs by delivery zone

### Testing

Run unit tests (when Jest is configured):
```bash
npm run test:unit
```

Run E2E tests:
```bash
npm run test:e2e
```

### Troubleshooting

See `specs/001-analytics-dashboard/quickstart.md` for detailed troubleshooting guide.

### Related Documentation

- **Spec**: `specs/001-analytics-dashboard/spec.md`
- **Plan**: `specs/001-analytics-dashboard/plan.md`
- **Data Model**: `specs/001-analytics-dashboard/data-model.md`
- **Research**: `specs/001-analytics-dashboard/research.md`
- **Quickstart**: `specs/001-analytics-dashboard/quickstart.md`
- **Tasks**: `specs/001-analytics-dashboard/tasks.md`

---

**Status**: ✅ Implemented  
**Last Updated**: 2025-11-01  
**Branch**: `001-analytics-dashboard`
