# CORS Implementation Guide

> **📝 New Feature**: CORS origins are now **dynamic**! You can add/change frontend URLs without code changes.  
> See **[CORS_DYNAMIC_CONFIG.md](./CORS_DYNAMIC_CONFIG.md)** for details on configuring multiple frontends via environment variables.

## What Was Fixed

The CORS (Cross-Origin Resource Sharing) error occurred because your Next.js API on `localhost:3000` was blocking requests from your external frontend on `localhost:8081`.

### Changes Made:

1. **Created CORS utility** (`lib/cors.ts`)
   - Centralized CORS configuration
   - Helper functions for consistent CORS headers
   - Support for multiple allowed origins

2. **Updated auth routes** (login, logout, session)
   - Added OPTIONS handlers for preflight requests
   - Applied CORS headers to all responses
   - Maintained HTTP-only cookie support

3. **Updated API middleware** (`lib/apiAuth.ts`)
   - All protected routes now automatically have CORS support
   - Error responses include CORS headers

---

## Frontend Configuration

### Update Your External Frontend (Port 8081)

When making requests from your external frontend, you **MUST** include credentials:

```javascript
// ✅ CORRECT - Include credentials for cookies
fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include", // CRITICAL: Allows cookies to be sent
  body: JSON.stringify({ email, password }),
});

// Using axios
axios.post(
  "http://localhost:3000/api/auth/login",
  { email, password },
  {
    withCredentials: true, // CRITICAL: Allows cookies to be sent
  },
);

// Using fetch API wrapper
const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email, password }),
});
```

### ALL Requests Must Include Credentials

```javascript
// Login
fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  credentials: "include", // ✅
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

// Check session
fetch("http://localhost:3000/api/auth/session", {
  method: "GET",
  credentials: "include", // ✅
});

// Logout
fetch("http://localhost:3000/api/auth/logout", {
  method: "POST",
  credentials: "include", // ✅
});

// Protected API calls
fetch("http://localhost:3000/api/admin/user", {
  method: "GET",
  credentials: "include", // ✅
});
```

---

## Adding CORS to Other API Routes

### Method 1: For Non-Protected Routes (Public)

```typescript
import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET example
export async function GET(request: NextRequest) {
  try {
    // Your logic here
    const data = { message: "Success" };

    return corsResponse(request, data, 200);
  } catch (error) {
    return corsErrorResponse(request, { error: "Something went wrong" }, 500);
  }
}
```

### Method 2: For Protected Routes (Using withAuth)

Protected routes using `withAuth` already have CORS support automatically!

```typescript
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/apiAuth";
import { handleCorsPreFlight, corsResponse } from "@/lib/cors";
import connectDB from "@/lib/mongodb";
import YourModel from "@/models/YourModel";

const PAGE_PATH = "/admin/your-resource";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - List resources
export async function GET(request: NextRequest) {
  // withAuth already returns CORS-enabled error responses
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error; // Already has CORS headers

  try {
    await connectDB();
    const data = await YourModel.find({ status: { $ne: "DELETED" } });

    // Use corsResponse for success
    return corsResponse(request, { data }, 200);
  } catch (err) {
    return corsErrorResponse(
      request,
      { error: "Failed to fetch resources" },
      500,
    );
  }
}
```

### Method 3: Batch Update Multiple Routes

To quickly add CORS to all your existing API routes:

**Add to imports:**

```typescript
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
```

**Add OPTIONS handler:**

```typescript
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
```

**Replace all `NextResponse.json()` with:**

- Success: `corsResponse(request, data, status)`
- Error: `corsErrorResponse(request, { error: "message" }, status)`

---

## Configuration

### Adding More Allowed Origins

Edit `lib/cors.ts`:

```typescript
const ALLOWED_ORIGINS = [
  "http://localhost:3000", // Next.js app
  "http://localhost:8081", // Your external frontend
  "http://localhost:8080", // Another frontend
  "https://yourdomain.com", // Production domain
  "https://app.yourdomain.com", // Production app
];
```

### Environment-Specific Configuration

For production, consider using environment variables:

```typescript
// lib/cors.ts
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:8081"];
```

Then in `.env.local`:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## Testing the Fix

### 1. Test from Browser Console (Port 8081)

Open your frontend on `localhost:8081`, open DevTools console:

```javascript
// Test login
fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email: "admin@example.com",
    password: "your-password",
  }),
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

### 2. Check Response Headers

In DevTools Network tab, check the response headers:

- ✅ `Access-Control-Allow-Origin: http://localhost:8081`
- ✅ `Access-Control-Allow-Credentials: true`
- ✅ `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- ✅ `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie`

### 3. Test Complete Flow

```javascript
// 1. Login
const loginRes = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com", password: "password" }),
});
const loginData = await loginRes.json();
console.log("Login:", loginData);

// 2. Check session (should work because cookie was set)
const sessionRes = await fetch("http://localhost:3000/api/auth/session", {
  method: "GET",
  credentials: "include",
});
const sessionData = await sessionRes.json();
console.log("Session:", sessionData);

// 3. Call protected endpoint
const usersRes = await fetch("http://localhost:3000/api/admin/user", {
  method: "GET",
  credentials: "include",
});
const usersData = await usersRes.json();
console.log("Users:", usersData);

// 4. Logout
const logoutRes = await fetch("http://localhost:3000/api/auth/logout", {
  method: "POST",
  credentials: "include",
});
const logoutData = await logoutRes.json();
console.log("Logout:", logoutData);
```

---

## Common Issues & Solutions

### Issue 1: Still Getting CORS Error

**Solution:** Make sure you're including `credentials: 'include'` in ALL fetch requests.

### Issue 2: Cookies Not Being Saved

**Possible causes:**

- Missing `credentials: 'include'` in frontend
- SameSite cookie attribute is too strict
- Browser blocking third-party cookies

**Solution:** In `lib/auth.ts`, update cookie settings:

```typescript
export async function setAuthCookie(token: string) {
  cookies().set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}
```

### Issue 3: OPTIONS Request Failing

**Solution:** Make sure every API route has an OPTIONS handler:

```typescript
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
```

### Issue 4: Different Port Not Allowed

**Solution:** Add your frontend's port to `ALLOWED_ORIGINS` in `lib/cors.ts`:

```typescript
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8081", // Add your port here
];
```

---

## Routes That Need Updating

Based on your project structure, here are routes that may need CORS:

### Already Updated ✅

- `/api/auth/login` ✅
- `/api/auth/logout` ✅
- `/api/auth/session` ✅
- All `/api/admin/*` routes (via `withAuth` middleware) ✅

### May Need Manual Update (if not using withAuth)

- `/api/profile/route.ts`
- `/api/profile/change-password/route.ts`
- `/api/profile/userledger/route.ts`
- `/api/profile/withdraw/route.ts`
- `/api/cron/process-cycles/route.ts` (if accessed externally)

### To update these routes:

1. Add OPTIONS handler
2. Import CORS helpers
3. Replace `NextResponse.json()` with `corsResponse()` or `corsErrorResponse()`

Example for `/api/profile/route.ts`:

```typescript
import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(request: NextRequest) {
  try {
    // Your existing logic
    return corsResponse(request, { data: yourData }, 200);
  } catch (error) {
    return corsErrorResponse(request, { error: "Failed" }, 500);
  }
}
```

---

## Security Considerations

### Production Deployment

1. **Use specific origins** - Never use `"*"` with credentials
2. **Use HTTPS** - Set `secure: true` for cookies in production
3. **Update ALLOWED_ORIGINS** - Only include your actual domains
4. **SameSite=None** - Required for cross-domain cookies in production with HTTPS

### Example production `.env`:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
NODE_ENV=production
```

### Example production cookie settings:

```typescript
sameSite: "none",  // Required for cross-domain
secure: true,      // HTTPS only
```

---

## Quick Checklist

- [ ] Added `lib/cors.ts` with allowed origins
- [ ] Updated `/api/auth/login` with OPTIONS handler
- [ ] Updated `/api/auth/logout` with OPTIONS handler
- [ ] Updated `/api/auth/session` with OPTIONS handler
- [ ] Updated `lib/apiAuth.ts` to use `corsErrorResponse`
- [ ] Added OPTIONS handlers to other public API routes
- [ ] Updated frontend to include `credentials: 'include'`
- [ ] Tested login flow from external frontend
- [ ] Verified cookies are being set
- [ ] Checked CORS headers in Network tab
- [ ] Updated production environment variables

---

## Need Help?

If you encounter issues:

1. Check the browser console for specific CORS errors
2. Check the Network tab for request/response headers
3. Verify `credentials: 'include'` is in ALL fetch requests
4. Verify your frontend origin is in `ALLOWED_ORIGINS`
5. Check that OPTIONS handlers are present in the route
