# Quick Start: Cron Job Setup

## ✅ What's Been Prepared

1. **Cron Endpoint:** `/api/cron/process-cycles` ✓
2. **Cycle Model Updates:** Added `autoCreated`, `previousCycleId`, `expirationReason` ✓
3. **Date Calculation Logic:** Weekly=+7, Fortnightly=+14, Monthly=+30 days ✓
4. **Security:** Header-based authentication with `CRON_SECRET` ✓
5. **Documentation:** Full setup guide in `CRON_SETUP.md` ✓

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Add Secret to Environment

```bash
# In your .env.local file, add:
CRON_SECRET=your-super-secret-key-change-this-to-something-random
```

### Step 2: Configure cron-job.org

1. Go to https://cron-job.org/en/
2. Create account (free)
3. Create new cronjob:
   - **URL:** `https://your-domain.com/api/cron/process-cycles`
   - **Schedule:** `0 0 * * *` (daily at midnight)
   - **Method:** POST
   - **Headers:** Add `x-cron-secret` with your secret
4. Save and enable

### Step 3: Test

```bash
curl -X POST http://localhost:3000/api/cron/process-cycles \
  -H "x-cron-secret: your-secret-here"
```

---

## 📋 How It Works

**When a cycle reaches its due date:**

1. Cron job runs (daily at midnight)
2. Finds Active cycles past due date
3. Marks them as Expired
4. Creates new cycle with:
   - Next sequential cycle count
   - Due date = previous cycle due date + term days
     - Weekly: +7 days
     - Fortnightly: +14 days
     - Monthly: +30 days
   - Same principal and interest rate as loan
   - Status: Active

**Example:**

```
Loan Terms: Weekly
Cycle #1 Due: 2026-04-25 → Status changes to Expired
Cycle #2 Created with Due: 2026-05-02 (25 + 7 days)
```

---

## 🔍 Monitoring

Check execution in cron-job.org dashboard or look for logs:

```
[CRON] Found 5 expired cycles to process
[CRON] Processed: Expired Cycle #1, Created Cycle #2 for LN-001
[CRON] Process Cycles Summary: { expired: 5, created: 5, errors: 0 }
```

---

## 📖 Full Documentation

See `CRON_SETUP.md` for:

- Detailed setup instructions
- Security best practices
- Troubleshooting guide
- Business rules
- API response examples

---

## 🛡️ Security Notes

- Never commit `CRON_SECRET` to git
- Use different secrets for dev/staging/production
- The endpoint is protected - only requests with correct secret will work
- Failed authentication attempts are logged

---

## ✨ What Happens Next

Once configured:

- ✅ Expired cycles automatically update to "Expired" status
- ✅ New cycles automatically created with correct due dates
- ✅ No manual intervention needed
- ✅ Audit trail maintained (autoCreated flag, previousCycleId reference)
- ✅ Transaction-safe (either both actions succeed or neither happens)

---

Need help? Check `CRON_SETUP.md` for full details!
