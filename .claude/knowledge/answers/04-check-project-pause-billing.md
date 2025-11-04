# How to Check if Your Supabase Project is Paused or Has Billing Issues

## Overview
Project pause and billing issues are common causes of "Invalid API key" errors and service disruptions. This guide helps you diagnose and resolve these issues.

---

## Quick Status Check

### Method 1: Dashboard Visual Indicators

#### Project List View
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Look at your project list

**Status Indicators:**
```
✅ Active          - Green indicator, fully operational
⏸️ Paused          - Yellow/orange, service suspended  
🔴 Degraded        - Red, experiencing issues
⚠️ Overdue         - Red warning, billing issues
🔧 Restoring       - Blue, being restored from pause
```

#### Individual Project View
1. Click into your project
2. Look at the top banner area

**Active Project:**
```
✅ Project Active
Last deployed: 2 hours ago
```

**Paused Project:**
```
⏸️ This project is paused
[Restore Project] button
Reason: Inactivity / Billing / Manual pause
```

---

## Understanding Project Pause States

### 1. Free Plan Inactivity Pause

**Trigger:**
- No activity for 7+ consecutive days
- Applies only to Free Plan projects
- Automatic process

**Indicators:**
```
Project Status: Paused
Reason: Inactivity
Message: "Your project was paused due to inactivity"
```

**What "Activity" Means:**
- API requests to database
- Authentication events
- Storage operations
- Realtime connections
- Dashboard access does NOT count as activity

**Resolution:**
1. Click **Restore Project** button
2. Project restores within a few minutes
3. All data preserved (within 90-day window)

**Prevention:**
```javascript
// Set up a cron job to ping your database
// Run daily to prevent auto-pause

const keepAlive = async () => {
  const { data } = await supabase
    .from('any_table')
    .select('id')
    .limit(1)
}

// Or use GitHub Actions to ping weekly
```

**Important Notes:**
- Restored for free (no charges)
- Can pause and restore unlimited times
- After 90 days without restore: data may be lost
- Pro/Team/Enterprise plans: no auto-pause

---

### 2. Billing-Related Pause

**Trigger:**
- Overdue invoices
- Payment method declined
- Insufficient funds
- Suspended account

**Indicators:**
```
⚠️ Billing Issues
Status: Service Suspended
Message: "Payment required to restore service"
Outstanding balance: $XX.XX
```

**Dashboard Warnings:**
- Red banner at top of dashboard
- "Payment Required" messages
- Unable to access project resources

**Resolution Steps:**

1. **Check Billing Status**
   - Go to **Organization Settings**
   - Click **Billing** in sidebar
   - View outstanding invoices

2. **Verify Payment Method**
   ```
   Billing → Payment Methods
   
   Check for:
   ❌ Expired credit card
   ❌ Insufficient funds
   ❌ Failed payment attempts
   ```

3. **Update Payment Method**
   - Click **Add payment method**
   - Enter valid credit/debit card
   - Set as default payment method

4. **Pay Outstanding Invoices**
   - View **Invoices** tab
   - Pay all overdue invoices
   - May require manual payment if auto-payment failed

5. **Wait for Restoration**
   - Automatic restoration after payment clears
   - Usually within 15-30 minutes
   - Check email for confirmation

**Common Billing Issues:**

#### Expired Card
```
Error: "Your card has expired"
Solution: Update payment method with new card
```

#### Declined Payment
```
Error: "Payment was declined"
Reasons:
- Insufficient funds
- Card blocked for online purchases
- Bank fraud protection triggered
- Wrong billing address

Solution: 
- Contact your bank
- Try different card
- Verify billing address matches card
```

#### International Payments
```
Note: Payments are in USD from Singapore
- Ensure card supports international transactions
- Verify bank allows Singapore payments
- Check for foreign transaction blocks
```

---

### 3. Manual Pause (User-Initiated)

**How Projects Get Manually Paused:**
1. Dashboard → Project Settings → General
2. Click **Pause Project** button
3. Confirm action

**Status:**
```
⏸️ Manually Paused
Paused by: your-email@example.com
Paused on: Oct 15, 2025
```

**Resolution:**
1. Go to Project Settings → General
2. Click **Resume Project** button
3. Wait 2-5 minutes for restoration

---

### 4. Fair Use Policy Suspension

**Trigger:**
- Excessive resource usage
- Abuse detection
- Violation of terms of service
- Unusual traffic patterns

**Indicators:**
```
⚠️ Service Restricted
Status: Fair Use Policy Applied
Code: 429 or 54X
```

**What Gets Restricted:**
- API request rate limiting
- Database connection limits
- Storage operations throttled
- May include temporary pause

**Resolution:**
1. Check email for Fair Use Policy notice
2. Review usage in Dashboard → Usage
3. Optimize queries and reduce load
4. Contact support for details
5. May require plan upgrade

---

## Detailed Billing Checks

### Check 1: Organization Billing Status

**Navigation:**
1. Dashboard → Organization dropdown (top left)
2. Select your organization
3. Click **Billing** in left sidebar

**What to Review:**

#### Current Plan
```
Plan: Free / Pro / Team / Enterprise
Status: Active / Overdue / Suspended
```

#### Billing Cycle
```
Current cycle: Oct 1 - Oct 31, 2025
Next billing date: Nov 1, 2025
```

#### Outstanding Balance
```
Current balance: $0.00 ✅
Overdue amount: $X.XX ❌
```

---

### Check 2: Invoice History

**Navigation:**
Billing → Invoices tab

**Review Each Invoice:**
```
Invoice #1234
Date: Oct 1, 2025
Amount: $25.00
Status: Paid ✅ / Overdue ❌ / Pending
```

**Red Flags:**
- Any invoice marked "Overdue"
- Multiple failed payment attempts
- "Awaiting Payment" for >7 days

---

### Check 3: Payment Method Status

**Navigation:**
Billing → Payment Methods tab

**Verify:**
```
💳 Visa ending in 1234
Expires: 12/2025
Status: Active ✅
Default: Yes
```

**Issues to Fix:**
```
❌ Card expired
❌ Card ending in XXXX (failed last payment)
❌ No default payment method set
```

---

### Check 4: Usage and Costs

**Navigation:**
Organization → Usage

**Review Current Usage:**
```
Database Size: 150 MB / 500 MB
Egress: 2.3 GB / 5 GB
Active Connections: 15 / 100
Compute Hours: 50 / ∞

Estimated cost this month: $0.00 (Free tier)
```

**Overages:**
- Free Plan: Limited resources, no overages charged
- Pro/Team: Usage beyond quota = extra charges
- Check if unexpected charges caused payment failures

---

## HTTP Status Codes Related to Pause/Billing

### 54X Codes (Supabase Specific)

```
540: Project Paused
Message: "The project the request was being made against has been paused"
Cause: Inactivity, billing, or manual pause
```

### 401 with Billing Context

```json
{
  "message": "Invalid API key",
  "code": 401,
  "details": "overdue_payment",
  "hint": "Your organization has overdue bills"
}
```

### 429 Rate Limiting (Fair Use)

```
Status: 429 Too Many Requests
Message: "Rate limit exceeded"
Cause: Fair Use Policy restrictions
```

---

## How to Restore a Paused Project

### Standard Restoration (Free Plan)

1. **Navigate to Project**
   - Dashboard → Select paused project

2. **Click Restore Button**
   ```
   [Restore Project] button
   ```

3. **Confirm Action**
   - May require re-authentication
   - Acknowledge any warnings

4. **Wait for Process**
   ```
   Status: Restoring... (takes 2-5 minutes)
   ↓
   Status: Active ✅
   ```

5. **Verify Connection**
   ```bash
   # Test API connectivity
   curl https://YOUR_PROJECT.supabase.co/rest/v1/
   ```

---

### Restoration After Billing Issues

1. **Resolve Payment Issues First**
   - Add/update payment method
   - Pay outstanding invoices
   - Confirm payment cleared

2. **Automatic Restoration**
   - System automatically restores after payment
   - Usually within 15-30 minutes
   - No manual restore button needed

3. **Manual Support Request (if needed)**
   - If not auto-restored after 1 hour
   - Contact support with:
     - Project ref
     - Payment confirmation
     - Organization ID

---

## 90-Day Restoration Window

### Important Timeline

```
Day 0: Project paused
  ↓
Day 1-89: Can restore anytime (data safe)
  ↓
Day 90: Final day to restore
  ↓
Day 91+: Project deleted, data lost permanently
```

### What Happens After 90 Days

**Lost Forever:**
- All database data
- Storage files
- Project configuration
- Historical backups
- Cannot be recovered

**Not Lost:**
- Organization settings
- Billing history
- Project slot (can create new project)

### Checking Days Remaining

Dashboard shows warning:
```
⚠️ Project Paused
Days until permanent deletion: 45
[Restore Now]
```

---

## Pro/Team/Enterprise Pause Behavior

### Key Difference
**Cannot be auto-paused by inactivity**

However, can be:
- Manually paused by owner
- Suspended due to billing issues
- Affected by Fair Use Policy

### Manual Pause for Paid Plans

**When to Use:**
- Temporarily not needed
- Testing/development hiatus
- Cost savings (but still charged base)

**Important:**
- Must transfer to Free org first (if <500MB)
- Or download backup and delete
- Paid projects cannot be paused in place

---

## Monitoring and Alerts

### Set Up Billing Alerts

1. **Organization Billing Settings**
2. Enable **Usage alerts**
3. Set thresholds:
   ```
   Alert when usage exceeds:
   - 80% of quota
   - 90% of quota
   - 100% of quota
   ```

### Email Notifications

**Automatic Emails for:**
- Project paused
- Billing issues
- Payment failures
- Fair Use Policy notices
- Restoration confirmations

**Check Spam Folder:**
- Emails from: `no-reply@supabase.io`
- Subject contains: "Supabase", "Project paused", "Billing"

---

## Prevention Strategies

### For Free Plan Projects

**1. Keep-Alive Script**
```javascript
// GitHub Actions workflow
// .github/workflows/keep-supabase-alive.yml
name: Keep Supabase Active
on:
  schedule:
    - cron: '0 9 * * 1,4' # Monday and Thursday at 9 AM
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl "${{ secrets.SUPABASE_URL }}/rest/v1/" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

**2. Regular Access**
- Log into dashboard weekly
- Run test queries
- Check analytics

**3. Upgrade to Pro**
- Eliminates auto-pause
- $25/month
- Worth it for production apps

---

### For Billing Issues

**1. Payment Method Best Practices**
- Use credit card (better for recurring)
- Keep card details current
- Set expiration reminders
- Have backup card on file

**2. Monitor Usage**
- Check usage weekly
- Set up alerts
- Understand billing cycle
- Budget for overages

**3. Automatic Payments**
- Ensure auto-pay is enabled
- Sufficient funds on billing date
- Email notifications enabled

---

## Troubleshooting Specific Scenarios

### Scenario 1: "Restore" Button Not Working

**Possible Causes:**
```
1. Still processing previous action
   → Wait 5 minutes, try again

2. Billing issues not resolved
   → Pay outstanding invoices first

3. Browser/cache issue
   → Clear cache, try different browser

4. Account permissions
   → Must be Owner or Admin

5. Project past 90-day window
   → Contact support immediately
```

---

### Scenario 2: Project Shows Active but APIs Fail

**Diagnosis:**
```bash
# Test direct connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/

# If returns 540:
# Project is actually still paused (cache issue)

# If returns 401:
# Key issue, not pause issue
```

**Solution:**
1. Hard refresh dashboard (Ctrl+Shift+R)
2. Wait additional 5 minutes
3. Check Supabase status page
4. Contact support if persists >1 hour

---

### Scenario 3: Restored but Data Missing

**Free Plan Projects:**
- Backup created at pause time
- Data restored from backup
- Changes made while paused are lost

**What to Check:**
```sql
-- Check if database was restored from backup
SELECT * FROM _backup_metadata; -- (if exists)

-- Verify table structure intact
\dt

-- Check recent data
SELECT created_at FROM your_table 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### Scenario 4: Repeated Auto-Pause

**Symptoms:**
Project keeps pausing every few days

**Causes:**
```
1. Truly no activity
   → Add keep-alive ping

2. Activity not counted
   → Dashboard views don't count
   → Need actual API requests

3. GitHub Actions not running
   → Check workflow status
   → Verify secrets configured

4. Time zone confusion
   → Cron schedule in UTC
   → Adjust timing
```

---

## Status Page Monitoring

### Check System Status
Visit: [status.supabase.com](https://status.supabase.com)

**Indicators:**
```
✅ All Systems Operational
⚠️ Partial Outage
❌ Major Outage
```

**Region-Specific:**
```
US East (N. Virginia): Operational
EU West (Ireland): Operational
AP Southeast (Singapore): Operational
```

**Subscribe to Updates:**
- SMS notifications
- Email alerts
- Slack integration
- Webhook endpoints

---

## Contact Support

### When to Contact Support

**Immediately:**
- Project won't restore after 90 days warning
- Billing dispute
- Suspected incorrect pause
- Data loss after restore

**After Self-Troubleshooting:**
- Restore button not working (tried all steps)
- Payment processed but project still paused
- Repeated auto-pause despite activity

### Support Channels

**1. Dashboard Support**
```
Dashboard → Help (?) → Contact Support
- Include: Project ref, issue details
- Attach: screenshots, error messages
```

**2. Support Email**
```
support@supabase.io
Subject: [Project Paused] Project ref: akxmacfsltzhbnunoepb
Include:
- Detailed description
- Steps already tried
- Account email
- Project reference
```

**3. GitHub Discussions**
```
github.com/orgs/supabase/discussions
- For general questions
- Community assistance
- Feature requests
```

---

## Quick Reference: Status Checks

### Dashboard Quick Check
```
□ Project list shows green indicator
□ No warning banners in project view
□ Can access project settings
□ Recent activity shown in logs
□ Billing status: "Active" or "Paid"
```

### API Quick Check
```bash
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_KEY"

# ✅ Returns 200 or data: Active
# ❌ Returns 540: Paused
# ❌ Returns 401: Key/auth issue
# ❌ Returns 429: Rate limited
```

### Billing Quick Check
```
□ No overdue invoices
□ Valid payment method on file
□ Payment method not expired
□ Default payment method set
□ Last payment successful
```

---

## Resources

- [Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)
- [HTTP Status Codes](https://supabase.com/docs/guides/troubleshooting/http-status-codes)
- [Fair Use Policy](https://supabase.com/docs/guides/platform/fair-use-policy)
- [Support Portal](https://supabase.com/dashboard/support)
- [Status Page](https://status.supabase.com)
