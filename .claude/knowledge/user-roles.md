# User Roles

> **მომხმარებლის როლები** | Detailed role descriptions and permissions

---

## 👥 Role Overview

The Georgian Distribution Management System has **4 distinct user roles**, each with specific permissions and workflows:

1. **Administrator** - System management and control
2. **Restaurant** - Client ordering and tracking
3. **Driver** - Delivery management
4. **Demo** - Read-only showcase access

---

## 👑 Administrator Role

### Purpose
Full system control for business owners and managers to oversee operations, pricing, and analytics.

### Capabilities

**Order Management:**
- ✅ View all orders across all restaurants
- ✅ Set custom pricing for each order
- ✅ Assign drivers to orders
- ✅ Override order statuses
- ✅ Cancel orders with reason
- ✅ View order history for all users
- ✅ Export order data (CSV, PDF)

**User Management:**
- ✅ Create/edit/delete restaurant accounts
- ✅ Create/edit/delete driver accounts
- ✅ View user activity logs
- ✅ Manage user permissions
- ✅ Reset user passwords
- ✅ Suspend/activate accounts

**Product Catalog:**
- ✅ Add/edit/delete products
- ✅ Upload product images
- ✅ Set product availability
- ✅ Organize by categories
- ✅ Manage pricing (base prices)
- ✅ Bulk import/export products

**Analytics & Reporting:**
- ✅ View comprehensive analytics dashboard
- ✅ Filter by date range (7/14/30/custom days)
- ✅ Filter by status, restaurant, driver
- ✅ Track KPIs (total orders, revenue, profitability)
- ✅ Export analytics data (CSV)
- ✅ View performance metrics
- ✅ Monitor system health

**System Configuration:**
- ✅ Configure system settings
- ✅ Manage notifications
- ✅ View system logs
- ✅ Access error tracking (Sentry)

### Access Areas
```
/dashboard/admin
├── /analytics        # Analytics dashboard
├── /orders          # Order management
├── /products        # Product catalog
├── /users           # User management
├── /performance     # System performance
└── /settings        # System settings
```

### RLS Permissions
```sql
-- Admin has full access to all tables
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### Typical Workflow
1. Review new orders from restaurants
2. Set competitive pricing with profitability calculation
3. Assign available driver
4. Monitor order progress via real-time dashboard
5. Review analytics and adjust business strategy

---

## 🍕 Restaurant Role

### Purpose
Enable restaurant clients to place orders digitally, track deliveries, and manage order history.

### Capabilities

**Ordering:**
- ✅ View product catalog with search/filter
- ✅ Add products to cart
- ✅ Place orders (no prices shown initially)
- ✅ Add notes to orders
- ✅ View order confirmation after admin pricing
- ❌ Cannot see prices until admin confirms
- ❌ Cannot edit orders after submission

**Order Tracking:**
- ✅ View own orders only
- ✅ Real-time status updates
- ✅ Track order progress (pending → confirmed → in_transit → delivered)
- ✅ Receive notifications for status changes
- ✅ View estimated delivery time

**Order History:**
- ✅ View past orders with full details
- ✅ Filter by date range and status
- ✅ Export order history (CSV, PDF)
- ✅ Reorder from previous orders (quick reorder)
- ✅ View invoices with pricing

**Account:**
- ✅ Update profile information
- ✅ Change password
- ✅ Manage notification preferences
- ❌ Cannot access other restaurants' data

### Access Areas
```
/dashboard/restaurant
├── /order           # Place new orders
├── /history         # Order history
└── /profile         # Account settings
```

### RLS Permissions
```sql
-- Restaurant can SELECT own orders
CREATE POLICY "restaurant_select_own" ON orders
  FOR SELECT
  USING (restaurant_id = auth.uid());

-- Restaurant can INSERT with self as restaurant_id
CREATE POLICY "restaurant_insert_own" ON orders
  FOR INSERT
  WITH CHECK (restaurant_id = auth.uid());

-- Restaurant CANNOT update or delete orders
```

### Typical Workflow
1. Browse product catalog
2. Add products to cart (specify quantities)
3. Submit order with notes
4. Wait for admin to set pricing and confirm
5. Receive notification when order confirmed
6. Track delivery progress in real-time
7. Confirm order received
8. Access invoice in order history

---

## 🚚 Driver Role

### Purpose
Enable delivery drivers to manage assigned deliveries efficiently and update order statuses.

### Capabilities

**Delivery Management:**
- ✅ View assigned deliveries only
- ✅ See delivery details (address, items, notes)
- ✅ Update order status (pickup → in_transit → delivered)
- ✅ Two-step confirmation (pickup + delivery)
- ✅ Contact restaurant for clarification
- ✅ Report delivery issues

**Delivery History:**
- ✅ View completed deliveries
- ✅ Track performance metrics
- ✅ View delivery timeline
- ❌ Cannot modify pricing or order items

**Mobile-Optimized:**
- ✅ Touch-friendly interface
- ✅ One-tap status updates
- ✅ GPS integration (planned)
- ✅ Offline capability (planned)
- ✅ Quick actions for common tasks

### Access Areas
```
/dashboard/driver
├── /deliveries      # Active deliveries
├── /history         # Delivery history
└── /profile         # Account settings
```

### RLS Permissions
```sql
-- Driver can SELECT assigned orders
CREATE POLICY "driver_select_assigned" ON orders
  FOR SELECT
  USING (driver_id = auth.uid());

-- Driver can UPDATE status of assigned orders
CREATE POLICY "driver_update_assigned" ON orders
  FOR UPDATE
  USING (driver_id = auth.uid())
  WITH CHECK (
    driver_id = auth.uid()
    AND status IN ('in_transit', 'delivered')
  );
```

### Typical Workflow
1. View assigned deliveries on dashboard
2. Review order details and delivery address
3. Update status to "in_transit" when picking up
4. Navigate to delivery location
5. Update status to "delivered" when completed
6. Move to next delivery
7. Review daily performance metrics

---

## 🎭 Demo Role

### Purpose
Provide read-only access for potential clients to explore the system without affecting real data.

### Capabilities

**Read-Only Access:**
- ✅ View demo product catalog
- ✅ See sample orders (last 7 days only)
- ✅ Explore analytics dashboard (demo data)
- ✅ View demo order workflow
- ❌ Cannot create, edit, or delete anything
- ❌ Cannot access real customer data

**Demo Features:**
- ✅ Demo banner displayed on all pages
- ✅ Guided tour of key features
- ✅ Conversion prompts to upgrade
- ✅ Feedback form for demo users
- ✅ Time-limited demo sessions
- ✅ Feature limitations clearly explained

### Access Areas
```
/dashboard/demo
├── /              # Demo dashboard overview
├── /catalog       # Demo product catalog
├── /orders        # Demo order samples
└── /feedback      # Feedback form
```

### RLS Permissions
```sql
-- Demo can SELECT recent data only
CREATE POLICY "demo_read_recent" ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'demo'
    )
    AND created_at > NOW() - INTERVAL '7 days'
  );

-- Demo CANNOT insert, update, or delete
```

### Typical Demo Flow
1. Sign up for demo account
2. Watch guided tour (optional)
3. Explore product catalog
4. View sample orders and tracking
5. Check analytics dashboard
6. Provide feedback
7. Upgrade to paid account (conversion)

---

## 🔄 Role Comparison Matrix

| Feature | Admin | Restaurant | Driver | Demo |
|---------|-------|------------|--------|------|
| View all orders | ✅ | ❌ Own only | ❌ Assigned only | ✅ Demo data |
| Create orders | ✅ | ✅ | ❌ | ❌ |
| Set pricing | ✅ | ❌ | ❌ | ❌ |
| Assign drivers | ✅ | ❌ | ❌ | ❌ |
| Update delivery status | ✅ | ❌ | ✅ | ❌ |
| View analytics | ✅ | ❌ | ❌ | ✅ Demo |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage products | ✅ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ Own | ✅ Own | ❌ |
| Real-time updates | ✅ | ✅ | ✅ | ✅ |

---

## 🔐 Security Considerations

### Role Enforcement
- **Primary enforcement:** Database RLS policies
- **Secondary enforcement:** API route authorization checks
- **UI enforcement:** Conditional rendering based on role
- **Never trust client-side role checks**

### Role Switching
- Users cannot switch roles without authentication
- Role is stored in JWT token and database
- Role changes require re-authentication
- Audit log tracks role changes

### Common Security Patterns
```typescript
// 1. Check role in API route
export async function GET(request: NextRequest) {
  const session = await getSession(request)

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Proceed with admin logic
}

// 2. Conditional UI rendering
{session?.user.role === 'admin' && (
  <AdminPanel />
)}

// 3. RLS policy (primary enforcement)
CREATE POLICY "role_based_access" ON orders
  USING (
    CASE auth.jwt() ->> 'role'
      WHEN 'admin' THEN true
      WHEN 'restaurant' THEN restaurant_id = auth.uid()
      WHEN 'driver' THEN driver_id = auth.uid()
      ELSE false
    END
  );
```

---

## 📞 Role-Specific Support

### Admin Support
- Full system documentation
- Advanced troubleshooting
- Database access guidance
- Analytics interpretation

### Restaurant Support
- Quick start guide
- Ordering tutorials
- FAQ for common questions
- Contact support via dashboard

### Driver Support
- Mobile app guide
- Delivery best practices
- Status update instructions
- Technical support hotline

### Demo Support
- Interactive guided tour
- Feature explanation videos
- Conversion assistance
- Sales team contact

---

**Last Updated:** 2025-11-03
**Roles Implemented:** 4 (Admin, Restaurant, Driver, Demo)
**Security:** RLS enforced at database level
