# Lending App - Copilot Instructions

## Next.js Version Warning

This is NOT the Next.js you know.

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Tailwindcss ^4.0

This might NOT the Tailwindcss version you know.

This version has breaking changes — conventions and classnames may all differ from your training data. Read the relevant guide in `node_modules/tailwindcss/` before writing any code. Heed deprecation notices.

---

## App Features

### Authentication & Authorization System

- **JWT-based authentication** with HTTP-only cookies
- **Role-based access control (RBAC)** with granular permissions
- **Session management** with automatic token refresh
- **Password management** with bcrypt hashing and change-password functionality
- **Protected routes** on both frontend and backend

### User Management

- Full CRUD operations for users
- Soft delete functionality
- User roles assignment
- User profile with financial tracking:
  - Rate
  - Cash Receivable
  - Capital Contribution
  - Profit Earned
- Password change with old password verification

### Role & Permission Management

- Dynamic role creation and management
- Granular permissions system (View, Add, Edit, Delete, Print)
- Page-based permission assignments
- Role-Permission relationship mapping

### Page Management

- Dynamic page registration system
- Hierarchical page structure with parent-child relationships
- Order-based navigation sorting
- Status-based page activation/deactivation

### Dynamic Navigation

- Database-driven navigation menu
- Permission-based link visibility
- Automatic menu generation from user's role permissions
- SPA-style navigation without page reloads

### Security Features

- **Frontend Protection:**
  - Page-level access control with `usePageAccess` hook
  - Button-level permission checks with `hasPermission()`
  - Automatic redirect to login for unauthenticated users
  - 404 display for unauthorized access attempts
- **Backend Protection:**
  - API route authentication middleware
  - Role-based permission verification
  - Automatic HTTP method to permission mapping
  - JWT token validation on every request

---

## File and Folder Structure

```
lending-app/
├── .github/
│   └── copilot-instructions.md          # This file - project documentation
│
├── app/                                  # Next.js app directory
│   ├── (main)/                          # Route group with navbar
│   │   ├── layout.tsx                   # Main layout with Nav component
│   │   ├── page.tsx                     # Home/dashboard page
│   │   ├── about/                       # About page
│   │   │   └── page.tsx
│   │   ├── home/                        # Home page (protected)
│   │   │   └── page.tsx
│   │   └── admin/                       # Admin management pages
│   │       ├── dashboard/               # Dashboard with permission-based buttons
│   │       │   └── page.tsx
│   │       ├── user/                    # User management
│   │       │   ├── page.tsx             # User list
│   │       │   └── [id]/
│   │       │       └── page.tsx         # User edit/view
│   │       ├── role/                    # Role management
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── page/                    # Page management
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── permission/              # Permission management
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       └── rolepermission/          # Role-Permission mapping
│   │           ├── page.tsx
│   │           └── [id]/
│   │               └── page.tsx
│   │
│   ├── (auth)/                          # Route group without navbar
│   │   ├── layout.tsx                   # Minimal layout without Nav
│   │   ├── login/
│   │       └── page.tsx                 # Login page
│   │
│   ├── api/                             # API routes
│   │   ├── auth/                        # Authentication endpoints
│   │   │   ├── login/
│   │   │   │   └── route.ts            # POST - Login with permissions
│   │   │   ├── logout/
│   │   │   │   └── route.ts            # POST - Logout
│   │   │   └── session/
│   │   │       └── route.ts            # GET - Session check with permissions
│   │   │
│   │   └── admin/                       # Protected admin API routes
│   │       ├── user/
│   │       │   ├── route.ts             # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts         # GET, PUT, DELETE
│   │       │       └── change-password/
│   │       │           └── route.ts     # POST - Change password
│   │       ├── role/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── page/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── permission/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── rolepermission/
│   │           ├── route.ts
│   │           └── [id]/
│   │               └── route.ts
│   │
│   ├── layout.tsx                       # Root layout with AuthProvider
│   ├── globals.css                      # Global styles
│   └── favicon.ico
│
├── components/
│   ├── nav.tsx                          # Dynamic navigation component
│   ├── PageNotFound.tsx                 # 404 component for unauthorized access
│   └── ClientLayout.tsx                 # Deprecated - functionality moved to layouts
│
├── context/
│   └── AuthContext.tsx                  # Global authentication context
│       - Provides: user, permissions, loading
│       - Methods: refreshAuth(), logout(), hasPermission()
│
├── hooks/
│   └── usePageAccess.ts                 # Page-level access control hook
│       - Returns: { loading, accessDenied }
│       - Handles: redirect to login, permission checking
│
├── lib/
│   ├── auth.ts                          # JWT utilities
│   │   - generateToken()
│   │   - verifyToken()
│   │   - setAuthCookie()
│   │   - getAuthCookie()
│   │   - removeAuthCookie()
│   │   - getCurrentUser()
│   │   - isAuthenticated()
│   │
│   ├── apiAuth.ts                       # API route security middleware
│   │   - checkAuth()                    # Verify JWT and user status
│   │   - checkPermission()              # Role-based permission check
│   │   - withAuth()                     # Combined middleware
│   │   - getPermissionForMethod()       # HTTP method→permission mapping
│   │
│   └── mongodb.ts                       # MongoDB connection handler
│
├── models/                              # Mongoose schemas
│   ├── User.ts                          # User model with password hashing
│   ├── Role.ts                          # Role model
│   ├── Page.ts                          # Page model
│   ├── Permission.ts                    # Permission model
│   └── RolePermission.ts                # Role-Permission mapping
│
├── scripts/
│   └── fix-permission-index.ts          # Database maintenance scripts
│
├── proxy.ts                             # Next.js 16 middleware (renamed from middleware.ts)
├── next.config.ts                       # Next.js configuration
├── tsconfig.json                        # TypeScript configuration
├── package.json                         # Dependencies
└── .env.local                           # Environment variables
    - MONGODB_URI
    - JWT_SECRET
    - JWT_EXPIRES_IN
```

---

## Security Implementation

### Frontend Security

#### 1. Authentication Context (`context/AuthContext.tsx`)

- **Global State Management:**
  - Wraps entire app via root layout
  - Maintains user data, permissions, and loading state
  - Automatically checks session on mount and route changes

- **Key Methods:**
  ```typescript
  refreshAuth(); // Re-fetch user and permissions from session
  logout(); // Clear session and redirect to login
  hasPermission(path, perm); // Check if user has specific permission
  ```

#### 2. Page-Level Protection (`hooks/usePageAccess.ts`)

- **Usage Pattern:**

  ```typescript
  const { loading: pageLoading, accessDenied } = usePageAccess();

  if (pageLoading) return <Loading />;
  if (accessDenied) return <PageNotFound />;
  ```

- **Protection Logic:**
  1. Public pages (`/login`, `/about`) - Always accessible
  2. `/home` - Requires authentication only
  3. Admin pages - Requires specific page permission from database
  4. Uses `useMemo` to prevent render loops

#### 3. Button-Level Permissions

- **Usage Pattern:**

  ```typescript
  const { hasPermission } = useAuth();
  const canAdd = hasPermission("/admin/user", "Add");

  {canAdd && <button>Add User</button>}
  ```

- **Supported Permissions:**
  - View - Read access
  - Add - Create new records
  - Edit - Modify existing records
  - Delete - Remove records
  - Print - Export/print functionality

#### 4. Layout-Based Routing

- **Route Groups:**
  - `(main)` group - Includes Nav component, for authenticated pages
  - `login` - No Nav component, minimal layout
  - Root layout - Only contains AuthProvider

### Backend Security

#### 1. API Authentication Middleware (`lib/apiAuth.ts`)

**Core Functions:**

```typescript
// Check if user is authenticated
checkAuth() → { user, isValid, error }

// Check if user has permission for a page
checkPermission(roleId, pagePath, permissionName) → boolean

// Combined middleware with auto permission mapping
withAuth(request, pagePath, customPermission?) → { user?, error? }
```

**Automatic Permission Mapping:**

- `GET` requests → "View" permission
- `POST` requests → "Add" permission
- `PUT`/`PATCH` → "Edit" permission
- `DELETE` → "Delete" permission

#### 2. Protected API Routes Pattern

**Every admin API route follows this pattern:**

```typescript
export async function GET(request: NextRequest) {
  // 1. Security check
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  // 2. Business logic
  try {
    await connectDB();
    // ... your code
  } catch (error) {
    // ... error handling
  }
}
```

**Security Flow:**

1. Extract JWT from HTTP-only cookie
2. Verify token validity and expiration
3. Check user exists and is ACTIVE in database
4. Find page by path in database
5. Find permission by name in database
6. Check RolePermission mapping exists
7. If all pass → Allow request
8. If any fail → Return 401/403 error

#### 3. Response Codes

- **200** - Success
- **201** - Created successfully
- **400** - Bad request (validation error)
- **401** - Unauthorized (not logged in)
- **403** - Forbidden (no permission)
- **404** - Not found
- **409** - Conflict (duplicate entry)
- **500** - Server error

---

## Application Workflow

### 1. User Login Flow

```
User enters credentials
    ↓
POST /api/auth/login
    ↓
Verify email/password
    ↓
Fetch user's role permissions from DB
    - RolePermission → Page + Permission
    - Group by page
    ↓
Generate JWT token
    ↓
Set HTTP-only cookie
    ↓
Return: { user, permissions }
    ↓
AuthContext stores state
    ↓
Redirect to /admin/user
    ↓
Navigation renders dynamically
```

### 2. Page Access Flow

```
User navigates to page
    ↓
usePageAccess hook runs
    ↓
Check if public page → Allow
    ↓
Check AuthContext.user → If null, redirect to /login
    ↓
Check AuthContext.permissions for page path
    ↓
Permission found? → Render page
    ↓
Permission not found? → Show PageNotFound (404)
```

### 3. API Request Flow

```
Frontend makes API call
    ↓
Request includes HTTP-only cookie
    ↓
API route middleware (withAuth)
    ↓
Extract token from cookie
    ↓
Verify JWT signature & expiration
    ↓
Query User by ID from token
    ↓
Check user.status === "ACTIVE"
    ↓
Determine required permission from HTTP method
    ↓
Query RolePermission:
    - roleId = user.roleId
    - pageId.path = requested page
    - permissionId.permission = required permission
    - status = "ACTIVE"
    ↓
Permission exists? → Execute business logic
    ↓
No permission? → Return 403 Forbidden
```

### 4. Navigation Rendering Flow

```
App mounts
    ↓
AuthContext fetches session
    ↓
GET /api/auth/session
    ↓
Returns user + permissions array
    ↓
Nav component receives permissions via context
    ↓
Filter permissions with pageId.status === "ACTIVE"
    ↓
Sort by pageId.order
    ↓
Render navigation links
    ↓
User clicks nav link
    ↓
router.push() - SPA navigation
    ↓
Page component runs usePageAccess
    ↓
Access granted → Page renders
```

### 5. Permission Check Flow (Frontend)

```
Component renders
    ↓
const { hasPermission } = useAuth()
    ↓
hasPermission("/admin/user", "Add")
    ↓
Loop through permissions array
    ↓
Find matching page.path
    ↓
Find matching permission.permission (case-insensitive)
    ↓
Both match? → return true
    ↓
No match? → return false
    ↓
{canAdd && <button>Add</button>}
```

### 6. CRUD Operation Flow

**Example: Creating a User**

```
User clicks "Add" button (shown via hasPermission)
    ↓
Form submission
    ↓
POST /api/admin/user
    ↓
withAuth() checks "Add" permission
    ↓
Permission verified
    ↓
Validate input data
    ↓
Check for duplicate email
    ↓
Create user in DB (password auto-hashed by pre-save hook)
    ↓
Populate relationships (roleId, createdBy)
    ↓
Return user data (without password)
    ↓
Frontend updates UI
```

### 7. Session Persistence Flow

```
User refreshes page / navigates
    ↓
AuthContext useEffect runs
    ↓
GET /api/auth/session (cookie sent automatically)
    ↓
Verify JWT from cookie
    ↓
Fetch user + permissions
    ↓
Return to frontend
    ↓
AuthContext updates state
    ↓
Navigation re-renders with permissions
    ↓
Protected pages check access
    ↓
User experience continues seamlessly
```

---

## Important Implementation Notes

### Next.js 16 Breaking Changes

- `params` in route handlers is now a Promise - must await
- Middleware renamed to `proxy.ts` convention
- Dynamic routes use `[id]` folder structure

### Security Best Practices

- **Never** expose JWT_SECRET in client-side code
- **Always** use HTTP-only cookies for tokens (prevents XSS)
- **Always** validate user status is ACTIVE on every request
- **Always** check permissions on both frontend AND backend
- **Never** trust client-side permission checks alone

### Performance Considerations

- Permissions fetched once on login/session check
- Stored in React Context for instant access
- No permission DB queries on every navigation
- API routes do real-time permission checks for security

### Common Patterns

**Naming Convention for Loading States:**

```typescript
// When using both usePageAccess and form loading
const { loading: pageLoading, accessDenied } = usePageAccess();
const [loading, setLoading] = useState(false); // form submission
```

**Public vs Protected Pages:**

- `/login` and `/about` - Public (no permission required)
- `/home` - Authenticated only (no page permission required)
- `/admin/*` - Require both authentication + page permission

**Soft Delete Pattern:**
All models use soft delete:

- Set `status: "DELETED"`
- Set `deletedAt`, `deletedBy`, `deletedReason`
- Never remove from database
- Filters exclude `status: DELETED` by default

---

## Development Guidelines

### Adding a New Protected Page

1. **Create the page component** in `app/(main)/your-page/page.tsx`
2. **Add page to database** via Page management
3. **Create permissions** for the page (View, Add, Edit, Delete, Print)
4. **Map permissions to roles** via RolePermission management
5. **Use usePageAccess hook** in the component:
   ```typescript
   const { loading: pageLoading, accessDenied } = usePageAccess();
   if (pageLoading) return <Loading />;
   if (accessDenied) return <PageNotFound />;
   ```

### Adding a New API Route

1. **Create route file** in `app/api/admin/resource/route.ts`
2. **Import withAuth** from `@/lib/apiAuth`
3. **Define PAGE_PATH** constant matching frontend page path
4. **Add security check** to each handler:

   ```typescript
   const PAGE_PATH = "/admin/resource";

   export async function GET(request: NextRequest) {
     const { user, error } = await withAuth(request, PAGE_PATH);
     if (error) return error;
     // ... business logic
   }
   ```

### Debugging Permission Issues

1. **Check user login** - GET /api/auth/session
2. **Verify permissions array** - Should contain page + permissions
3. **Check page path** - Must match exactly (case-sensitive)
4. **Check permission name** - Case-insensitive comparison
5. **Verify RolePermission** - status must be "ACTIVE"
6. **Check Page status** - Page must be "ACTIVE"

---

## Database Schema Summary

### User

- Authentication: email, password (hashed)
- Profile: firstName, lastName, phone
- Financial: rate, cashReceivable, capitalContribution, profitEarned
- Relations: roleId → Role
- Audit: createdBy, updatedBy, deletedBy, timestamps

### Role

- Fields: role (unique), status
- Relations: Users, RolePermissions
- Audit: createdBy, updatedBy, deletedBy, timestamps

### Page

- Fields: page, path (unique), parentId, order, status
- Relations: RolePermissions
- Hierarchy: Self-referential parent-child
- Audit: createdBy, updatedBy, deletedBy, timestamps

### Permission

- Fields: permission (unique: View, Add, Edit, Delete, Print), status
- Relations: RolePermissions
- Audit: timestamps

### RolePermission (Junction Table)

- Relations: roleId → Role, pageId → Page, permissionId → Permission
- Unique: roleId + pageId + permissionId
- Fields: status
- Audit: createdBy, updatedBy, deletedBy, timestamps

---

## Environment Variables

Required in `.env.local`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/lending-app

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Node Environment
NODE_ENV=development
```
