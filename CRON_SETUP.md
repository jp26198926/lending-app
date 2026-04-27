# Cron Job Setup for Automated Cycle Processing

## Overview

The lending app uses an external cron service to automatically process expired cycles and create new ones.

## Endpoint Details

**URL:** `https://your-domain.com/api/cron/process-cycles`  
**Method:** `POST` (GET also supported for testing)  
**Security:** Requires `x-cron-secret` header

---

## What the Cron Job Does

1. **Finds Active Cycles Past Due Date**
   - Searches for cycles with status `Active` and `dateDue < today`

2. **Marks Them as Expired**
   - Updates status to `Expired`
   - Adds `expirationReason` with date details
   - Logs the action

3. **Creates New Cycle Automatically**
   - Only if loan is still `Active`
   - Calculates next cycle count (sequential)
   - Sets proper due date based on loan terms:
     - **Weekly:** +7 days from expired cycle's due date
     - **Fortnightly:** +14 days from expired cycle's due date
     - **Monthly:** +30 days from expired cycle's due date
   - **Carries forward unpaid balance:** If the expired cycle has a balance > 0, that balance becomes the new cycle's principal (instead of the original loan principal)
   - Calculates interest amount based on the new principal
   - Calculates total due (principal + interest)
   - Marks as auto-created with reference to previous cycle

---

## Setup Instructions

### 1. Set Environment Variable

Add to your `.env.local` file:

```env
CRON_SECRET=your-super-secret-key-here-change-this
```

**Generate a secure secret:**

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any password generator with 64+ characters
```

### 2. Configure cron-job.org

1. **Create Account:**
   - Go to https://cron-job.org/en/
   - Sign up for free account

2. **Create New Cronjob:**
   - Click "Create cronjob"
   - **Title:** Process Expired Cycles
   - **URL:** `https://your-domain.com/api/cron/process-cycles`
   - **Schedule:**
     - Recommended: `0 0 * * *` (Daily at midnight)
     - Alternative: `0 */6 * * *` (Every 6 hours)
     - Alternative: `0 1 * * *` (Daily at 1:00 AM)

3. **Add Headers:**
   - Click "Custom request headers"
   - Add header:
     - **Name:** `x-cron-secret`
     - **Value:** Your CRON_SECRET from .env.local

4. **Request Settings:**
   - **Request method:** POST
   - **Request timeout:** 60 seconds
   - **Save execution output:** Enable (recommended)

5. **Save and Enable**

### 3. Test the Endpoint

**Using curl:**

```bash
curl -X POST https://your-domain.com/api/cron/process-cycles \
  -H "x-cron-secret: your-secret-key-here"
```

**Expected Response (no expired cycles):**

```json
{
  "success": true,
  "message": "No expired cycles to process",
  "processed": 0,
  "duration": 125
}
```

**Expected Response (with expired cycles):**

```json
{
  "success": true,
  "message": "Cron job completed successfully",
  "summary": {
    "totalProcessed": 5,
    "expired": 5,
    "created": 5,
    "errors": 0
  },
  "details": {
    "expired": ["Cycle #1 - LN-001", "Cycle #2 - LN-002"],
    "created": [
      "Cycle #2 - LN-001 (Due: 2026-05-03)",
      "Cycle #3 - LN-002 (Due: 2026-05-10)"
    ],
    "errors": []
  },
  "duration": 1523,
  "timestamp": "2026-04-26T00:00:00.000Z"
}
```

---

## Cycle Model Updates

The following fields were added to track automated actions:

- **`autoCreated`** (Boolean): True if cycle was created by cron job
- **`previousCycleId`** (ObjectId): Reference to the expired cycle that triggered this creation
- **`expirationReason`** (String): Details about why/when cycle was expired

---

## Due Date Calculation Logic

```javascript
// Terms mapping
Weekly: 7 days
Fortnightly: 14 days
Monthly: 30 days

// New cycle due date calculation
startDate = expiredCycle.dateDue
newDueDate = startDate + daysForTerm

// Example:
// Expired Cycle Due Date: 2026-04-25
// Loan Terms: Weekly
// New Cycle Due Date: 2026-04-25 + 7 = 2026-05-02
```

---

## Monitoring

### Check Cron Execution Logs

1. Log in to cron-job.org
2. View "Cronjobs" > "Execution history"
3. Check status codes and response times

### Check Application Logs

Look for these console messages:

```
[CRON] Found X expired cycles to process
[CRON] Processed: Expired Cycle #1, Created Cycle #2 for LN-001
[CRON] Process Cycles Summary: { expired: 5, created: 5, errors: 0, duration: '1523ms' }
```

### Error Handling

- If authentication fails: Check CRON_SECRET matches
- If no cycles processed: Verify date/time settings
- If creation fails: Check database transactions logs

---

## Security Notes

1. **Never commit CRON_SECRET to git**
2. **Use different secrets for dev/staging/production**
3. **Rotate secret periodically (every 3-6 months)**
4. **Monitor unauthorized access attempts**
5. **Keep execution logs for audit trail**

---

## Business Rules

1. **Only processes Active cycles** - Completed, Cancelled, or Deleted cycles are ignored
2. **Only creates new cycle if loan is Active** - Prevents cycles on closed loans
3. **Transaction-based** - Either both expire + create succeed, or neither happens
4. **Race condition safe** - Double-checks cycle status before processing
5. **Audit trail** - All actions tracked with timestamps and reasons

---

## Troubleshooting

### "Unauthorized" Error

- Verify CRON_SECRET environment variable is set
- Check header name is exactly `x-cron-secret`
- Ensure secret in cron-job.org matches .env.local

### No Cycles Processed

- Verify cycles exist with status `Active` and `dateDue` in the past
- Check loan status is `Active`
- Review application logs for details

### Duplicate Cycles Created

- Should not happen due to transaction safety
- If occurs, check database indexes: `loanId + cycleCount` should be unique

### Timeout Errors

- Increase timeout in cron-job.org settings
- Consider processing in smaller batches if many expired cycles

---

## Maintenance

### Update Schedule

To change frequency, modify cron expression in cron-job.org:

- `0 0 * * *` - Daily at midnight
- `0 */12 * * *` - Every 12 hours
- `0 2 * * 1` - Every Monday at 2 AM

### Disable Temporarily

1. Log in to cron-job.org
2. Click "Disable" next to the job
3. Re-enable when ready

### Remove Cron Job

1. Stop cron job in cron-job.org
2. Keep endpoint in place (for manual triggers if needed)
3. Or remove endpoint file: `app/api/cron/process-cycles/route.ts`
