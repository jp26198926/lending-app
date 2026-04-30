# Dynamic CORS Configuration Guide

## Overview

The application now supports **dynamic CORS configuration** using environment variables. You can add or change frontend URLs without modifying code - just update your `.env.local` file and restart the server.

## Setup

### 1. Create/Update `.env.local`

Add the `ALLOWED_ORIGINS` variable with comma-separated URLs:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/lending-app

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Cron Job Security
CRON_SECRET=your-cron-secret-key

# CORS Configuration - Comma-separated list of allowed frontend origins
# Add all your frontend URLs here (development, staging, production)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:8080
```

### 2. Restart Your Development Server

```bash
npm run dev
```

The CORS configuration will automatically load from the environment variable.

## Use Cases

### Development - Multiple Local Frontends

```env
# Next.js app + External React app + Mobile emulator
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:8082
```

### Staging Environment

```env
# Staging frontend + Local testing
ALLOWED_ORIGINS=https://staging.yourdomain.com,http://localhost:3000
```

### Production - Multiple Frontends

```env
# Web app + Mobile web view + Admin portal
ALLOWED_ORIGINS=https://app.yourdomain.com,https://mobile.yourdomain.com,https://admin.yourdomain.com
```

### Production - With Subdomains

```env
# Support multiple subdomains
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com,https://api.yourdomain.com
```

## How It Works

### Environment Variable Parsing

The `lib/cors.ts` file reads `ALLOWED_ORIGINS` at startup:

```typescript
const getAllowedOrigins = (): string[] => {
  const originsEnv = process.env.ALLOWED_ORIGINS;

  if (originsEnv) {
    // Split by comma and trim whitespace
    return originsEnv.split(",").map((origin) => origin.trim());
  }

  // Fallback for development if env var not set
  return ["http://localhost:3000"];
};
```

### Request Handling

When a request comes in:

1. Extract the `Origin` header from the request
2. Check if it matches any allowed origin
3. If matched, set `Access-Control-Allow-Origin` to that specific origin
4. If not matched, use the first allowed origin as fallback

## Best Practices

### ✅ DO

- **Use specific URLs**: `https://app.example.com` instead of wildcards
- **Include protocol**: Always include `http://` or `https://`
- **No trailing slashes**: Use `http://localhost:3000` not `http://localhost:3000/`
- **Separate by environment**: Different `.env` files for dev/staging/production
- **Keep secrets safe**: Never commit `.env.local` to git (already in `.gitignore`)

### ❌ DON'T

- **Don't use wildcards**: Avoid `*` for security reasons
- **Don't mix protocols**: Use HTTPS in production
- **Don't expose to public**: Keep your `.env.local` file private
- **Don't forget commas**: Ensure proper comma separation

## Environment-Specific Configuration

### Local Development (`.env.local`)

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Staging (`.env.staging`)

```env
ALLOWED_ORIGINS=https://staging-app.example.com,https://staging-admin.example.com
```

### Production (`.env.production`)

```env
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com,https://mobile.example.com
```

## Vercel Deployment

If deploying to Vercel, set environment variables in the dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Add variable:
   - **Name**: `ALLOWED_ORIGINS`
   - **Value**: `https://app.example.com,https://admin.example.com`
   - **Environment**: Production / Preview / Development

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Solution**: Check that your frontend URL is in `ALLOWED_ORIGINS`

```bash
# Check current value
echo $ALLOWED_ORIGINS

# Or in Node.js console
console.log(process.env.ALLOWED_ORIGINS)
```

### New URL Not Working

**Solution**: Restart your development server after changing `.env.local`

```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

### Multiple Frontends Not Working

**Solution**: Ensure proper comma separation with no extra spaces

```env
# ✅ CORRECT
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081

# ❌ WRONG (spaces around commas)
ALLOWED_ORIGINS=http://localhost:3000 , http://localhost:8081

# ❌ WRONG (missing protocol)
ALLOWED_ORIGINS=localhost:3000,localhost:8081
```

### Wildcard Origins for Development Only

If you absolutely need wildcard origins during development (NOT recommended for production):

```typescript
// lib/cors.ts - Development only modification
const getAllowedOrigins = (): string[] => {
  if (process.env.NODE_ENV === "development") {
    return ["*"]; // Allow all origins in dev only
  }

  const originsEnv = process.env.ALLOWED_ORIGINS;
  // ... rest of code
};
```

**⚠️ WARNING**: Never use wildcards in production - it's a security risk!

## Testing

### Test CORS Headers

```bash
# Test from your frontend URL
curl -H "Origin: http://localhost:8081" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3000/api/auth/login

# Expected response headers:
# Access-Control-Allow-Origin: http://localhost:8081
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

### Verify in Browser DevTools

1. Open your frontend application
2. Open DevTools → Network tab
3. Make an API request
4. Click on the request
5. Check **Response Headers**:
   ```
   Access-Control-Allow-Origin: http://localhost:8081
   Access-Control-Allow-Credentials: true
   ```

## Security Considerations

### Production Checklist

- [ ] Use HTTPS URLs only (not HTTP)
- [ ] Specify exact domains (no wildcards)
- [ ] Remove development URLs from production env
- [ ] Use environment-specific variables
- [ ] Rotate JWT_SECRET regularly
- [ ] Enable HTTPS-only cookies in production
- [ ] Monitor CORS requests for unusual patterns

### Additional Security Headers

For production, consider adding these headers in `lib/cors.ts`:

```typescript
response.headers.set("X-Content-Type-Options", "nosniff");
response.headers.set("X-Frame-Options", "DENY");
response.headers.set("X-XSS-Protection", "1; mode=block");
response.headers.set(
  "Strict-Transport-Security",
  "max-age=31536000; includeSubDomains",
);
```

## Example: Complete Production Setup

### `.env.production`

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lending-app
JWT_SECRET=super-secret-production-key-min-32-chars
JWT_EXPIRES_IN=7d
CRON_SECRET=cron-job-secret-key
ALLOWED_ORIGINS=https://app.lendingco.com,https://admin.lendingco.com,https://mobile.lendingco.com
NODE_ENV=production
```

### Frontend Configuration

```javascript
// config.js
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.lendingco.com"
    : "http://localhost:3000";

// All requests must include credentials
fetch(`${API_URL}/api/auth/login`, {
  method: "POST",
  credentials: "include", // REQUIRED for cookies
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});
```

## Summary

✅ **No more code changes** - Just update `.env.local`  
✅ **Support unlimited URLs** - Add as many as needed (comma-separated)  
✅ **Environment-specific** - Different configs for dev/staging/production  
✅ **Secure by default** - No wildcards, specific origin matching  
✅ **Easy deployment** - Set env vars in Vercel/hosting dashboard

**Next Steps**: Update your `.env.local` with all your frontend URLs and restart the server! 🚀
