# Lending App - Copilot Instructions

## Next.js Version Warning

This is NOT the Next.js you know.

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Tailwindcss ^4.0

This might NOT the Tailwindcss version you know.

This version has breaking changes — conventions and classnames may all differ from your training data. Read the relevant guide in `node_modules/tailwindcss/` before writing any code. Heed deprecation notices.

---

## Theme & Design System

### Color Scheme - Zentyal Orange & Yellow-Green

```css
--zentyal-dark: #2d3748; /* Dark text, headers */
--zentyal-primary: #ff6f00; /* Orange - Primary actions, branding */
--zentyal-accent: #a4c639; /* Yellow-Green - Secondary elements */
--zentyal-light: #f5f7fa; /* Light backgrounds */
--zentyal-gray: #6b7280; /* Muted text */
```

### Mobile-First Responsive Design

- **Icons only on mobile** (<640px): `<span className="hidden sm:inline">Button Text</span>`
- **Full-width buttons on mobile**: `className="w-full sm:w-auto"`
- **Flexible layouts**: `className="flex-col sm:flex-row"`
- **DataTable mobile cards**: Automatic switch at `md` breakpoint (768px)
- **Glassmorphism effects**: `bg-black/30 backdrop-blur-md` for modal backdrops

---

## Data Formatting Standards

### Date Format - YYYY-MM-DD (ISO 8601)

**All date fields MUST use YYYY-MM-DD format throughout the application.**

**Display Formatting:**

```typescript
// ✅ CORRECT - Display dates in YYYY-MM-DD format
{
  new Date(dateField).toISOString().split("T")[0];
}

// ❌ WRONG - Do not use toLocaleDateString()
{
  new Date(dateField).toLocaleDateString();
}
```

**Form Input:**

```typescript
// Date inputs already use YYYY-MM-DD by default
<input
  type="date"
  value={formData.dateField}  // Already in YYYY-MM-DD
  onChange={(e) => setFormData({...formData, dateField: e.target.value})}
/>
```

**DataTable Columns:**

```typescript
{
  key: "dateDue",
  label: "Due Date",
  sortable: true,
  render: (item) => (
    <span className="text-sm text-gray-600">
      {new Date(item.dateDue).toISOString().split("T")[0]}
    </span>
  ),
  exportValue: (item) => new Date(item.dateDue).toISOString().split("T")[0],
}
```

### Amount Format - No Currency Symbol

**All amount/money fields MUST NOT include currency symbols.**

**Display Formatting:**

```typescript
// ✅ CORRECT - No currency symbol, only numbers
{amount.toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}
// Output: 1,234.56

// ❌ WRONG - Do not add currency symbols
₱{amount.toLocaleString()}  // Wrong!
${amount.toLocaleString()}   // Wrong!
```

**Form Input:**

```typescript
// Number inputs without currency
<input
  type="number"
  step="0.01"
  value={formData.amount}
  placeholder="0.00"
  className="font-mono"  // Use monospace font for amounts
/>
```

**DataTable Columns:**

```typescript
{
  key: "principal",
  label: "Principal",
  sortable: true,
  render: (item) => (
    <div className="text-right">
      <span className="text-sm text-gray-900 font-mono">
        {item.principal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>
  ),
  exportValue: (item) => item.principal.toFixed(2),
}
```

**Best Practices:**

- Use `font-mono` class for amount displays to align decimals
- Always right-align amount columns in tables
- Always show 2 decimal places for currency amounts
- Use `toFixed(2)` for calculations to avoid floating-point errors

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

- **Sidebar navigation** with collapsible desktop mode and mobile drawer
- Database-driven navigation menu from user permissions
- Permission-based link visibility
- Automatic menu generation from user's role permissions
- SPA-style navigation without page reloads
- Active route highlighting

### Advanced Data Table Features

- **Pagination**: 10 items per page with smart page number display
- **Search**: Global search across all searchable columns
- **Advanced Search Modal**: Column-specific filtering with active filter badges
- **Sorting**: Click column headers to sort (asc/desc toggle)
- **CSV Export**: Export filtered/sorted data to CSV file
- **Professional Print**: Portrait-oriented print template with:
  - Company header with branding
  - Summary statistics cards (total records, page info)
  - Themed table layout (orange/yellow-green)
  - Auto-print workflow
- **Mobile Card View**: Responsive card layout for mobile (<768px)
- **Desktop Table View**: Traditional table for larger screens (≥768px)
- **Loading States**: Skeleton screens and spinners
- **Empty States**: Custom icons and messages

### UI/UX Components

- **Modal System**:
  - Base Modal with glassmorphism backdrop (`bg-black/30 backdrop-blur-md`)
  - LoadingModal - Full-screen loading overlay
  - ConfirmModal - Confirmation dialog with optional reason input
  - Advanced Search Modal - Column-specific filters
- **Reusable CRUD Components**:
  - StatusBadge - Color-coded status indicators (ACTIVE/INACTIVE/DELETED)
  - LoadingSpinner - Centered loading animation
  - CRUDTable - Basic table component (deprecated in favor of DataTable)
- **Form Components**:
  - Input fields with validation
  - Select dropdowns
  - Textarea with auto-resize
  - File uploads

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
│   │   Sidebar.tsx                      # Collapsible sidebar with mobile drawer
│   ├── nav.tsx                          # Top navigation bar (deprecated - use Sidebar)
│   ├── DataTable.tsx                    # Advanced table component (~850 lines)
│   │   - Features: pagination, search, advanced filters, export, print
│   │   - Mobile card view + desktop table view
│   │   - Generic TypeScript implementation
│   ├── Modal.tsx                        # Base modal with glassmorphism backdrop
│   ├── LoadingModal.tsx                 # Full-screen loading overlay
│   ├── ConfirmModal.tsx                 # Confirmation dialog with reason input
│   ├── CRUDComponents.tsx               # Reusable components:
│   │   - StatusBadge (color-coded status)
│   │   - LoadingSpinner (centered animation)
│   │   - CRUDTable (deprecated - use DataTable)
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

---

## Component Usage Patterns

### DataTable Component

**Complete implementation with all features:**

```typescript
import DataTable, { Column } from "@/components/DataTable";

interface MyData {
  _id: string;
  name: string;
  email: string;
  status: string;
}

const columns: Column<MyData>[] = [
  { key: "name", label: "Name", sortable: true, searchable: true },
  { key: "email", label: "Email", sortable: true, searchable: true },
  {
    key: "status",
    label: "Status",
    sortable: true,
    searchable: true,
    render: (item) => <StatusBadge status={item.status} />
  },
  {
    key: "actions",
    label: "Actions",
    sortable: false,
    searchable: false,
    render: (item) => (
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => handleView(item._id)}>View</button>
        <button onClick={() => handleEdit(item._id)}>Edit</button>
      </div>
    )
  }
];

<DataTable
  data={myData}
  columns={columns}
  itemsPerPage={10}
  loading={loading}
  emptyMessage="No records found"
  exportFileName="my-data-export"
  searchPlaceholder="Search records..."
  onRowClick={(item) => router.push(`/detail/${item._id}`)}
/>
```

**Features automatically included:**

- ✅ Pagination (10 items/page, smart page number display)
- ✅ Global search (searches all searchable columns)
- ✅ Advanced search modal (column-specific filters)
- ✅ Column sorting (click headers to toggle asc/desc)
- ✅ CSV export (with filtered/sorted data)
- ✅ Professional print (portrait, themed with orange/yellow-green)
- ✅ Mobile card view (<768px): stacked label-value pairs
- ✅ Desktop table view (≥768px): traditional table layout
- ✅ Loading states and empty states

### Modal Components

**Base Modal with Glassmorphism:**

```typescript
import Modal from "@/components/Modal";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="My Modal"
  size="md" // sm | md | lg | xl
  showClose={true}
>
  <div>Modal content here</div>
</Modal>
```

**Loading Modal:**

```typescript
import LoadingModal from "@/components/LoadingModal";

<LoadingModal
  isOpen={isLoading}
  message="Processing your request..."
/>
```

**Confirm Modal:**

```typescript
import ConfirmModal from "@/components/ConfirmModal";

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={(reason) => handleDelete(id, reason)}
  title="Delete Record"
  message="Are you sure you want to delete this record?"
  confirmText="Delete"
  cancelText="Cancel"
  requireReason={true} // Shows textarea for deletion reason
  isLoading={deleting}
/>
```

### Sidebar Navigation

**Automatic integration:**

- Included in `app/(main)/layout.tsx`
- Builds links from user's permissions
- Desktop: Collapsible sidebar (toggle button)
- Mobile: Drawer that slides in from left
- Active route highlighting
- Permission-based visibility

### Reusable Components

**StatusBadge:**

```typescript
import { StatusBadge } from "@/components/CRUDComponents";

<StatusBadge status="ACTIVE" />   // Green badge
<StatusBadge status="INACTIVE" /> // Gray badge
<StatusBadge status="DELETED" />  // Red badge
```

**LoadingSpinner:**

```typescript
import { LoadingSpinner } from "@/components/CRUDComponents";

if (loading) return <LoadingSpinner />;
```

---

## Mobile Responsive Patterns

### Button Text Hiding on Mobile

```typescript
// Icon always visible, text hidden on mobile
<button className="flex items-center gap-2">
  <PencilIcon className="h-5 w-5" />
  <span className="hidden sm:inline">Edit User</span>
</button>
```

### Full-Width Buttons on Mobile

```typescript
// Full width on mobile, auto width on desktop
<button className="w-full sm:w-auto px-3 sm:px-4 py-2">
  Submit
</button>
```

### Flexible Layouts

```typescript
// Stack vertically on mobile, horizontal on desktop
<div className="flex flex-col sm:flex-row gap-3">
  <button>Button 1</button>
  <button>Button 2</button>
</div>
```

### Responsive Padding and Sizing

```typescript
// Smaller padding on mobile
<div className="px-3 sm:px-6 py-2 sm:py-4">
  Content
</div>

// Smaller text on mobile
<h1 className="text-xl sm:text-2xl md:text-3xl">
  Heading
</h1>
```

---

## Print Template Customization

**Current print template features:**

- **Portrait orientation** (`@page { size: portrait; }`)
- **Themed colors**: Orange (#ff6f00) headers, Yellow-green (#a4c639) accents
- **Company header**: Logo placeholder, name, contact info, date/time
- **Summary statistics**: Total records, current page, records shown
- **Professional table**: Striped rows, styled headers, proper spacing
- **Footer**: Legal text, copyright

**Print is triggered by:**

- Click "Print" button in DataTable (next to "Advanced Search")
- Auto-opens new window with formatted template
- Auto-triggers print dialog
- Auto-closes window after print/cancel

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

---

## Database Standards - MongoDB Transactions

### Transaction Requirements

**ALL database operations MUST use MongoDB transactions to ensure data consistency and ACID compliance.**

### Why Transactions Are Mandatory

- **Data Integrity**: Prevent partial updates when multiple documents/collections are involved
- **Atomicity**: All-or-nothing execution - either all operations succeed or all are rolled back
- **Consistency**: Maintain referential integrity across related documents
- **Audit Trail**: Ensure audit fields (createdBy, updatedBy, deletedBy) are consistently applied
- **Error Recovery**: Automatic rollback on any failure prevents inconsistent state

### When to Use Transactions

**ALWAYS use transactions for:**

- ✅ Create operations (POST) - Creates record with audit fields
- ✅ Update operations (PUT/PATCH) - Updates record with audit fields
- ✅ Delete operations (DELETE) - Soft delete with audit fields
- ✅ Multi-document operations - Any operation affecting multiple documents
- ✅ Operations with business logic - Complex operations requiring consistency
- ✅ Cross-collection updates - Updates spanning multiple collections

**Transactions NOT required for:**

- ❌ Simple read operations (GET) - Single document or list queries
- ❌ Session/authentication checks - Read-only token verification
- ❌ Public data queries - Non-sensitive read operations

### Standard Transaction Pattern

**ALWAYS follow this pattern for write operations:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { withAuth } from "@/lib/apiAuth";
import YourModel from "@/models/YourModel";

const PAGE_PATH = "/admin/your-resource";

export async function POST(request: NextRequest) {
  // 1. Authentication & authorization check
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  // 2. Start session for transaction
  const session = await mongoose.startSession();

  try {
    // 3. Start transaction
    await session.startTransaction();

    // 4. Parse and validate input
    const body = await request.json();
    const { field1, field2, field3 } = body;

    // Basic validation
    if (!field1 || !field2) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 },
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Business logic validation (within transaction)
    const existingRecord = await YourModel.findOne({
      field1,
      status: { $ne: "DELETED" },
    }).session(session);

    if (existingRecord) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Record already exists" },
        { status: 409 },
      );
    }

    // 7. Create/update operations (with session)
    const newRecord = await YourModel.create(
      [
        {
          field1,
          field2,
          field3,
          status: "ACTIVE",
          createdBy: user._id,
          createdAt: new Date(),
        },
      ],
      { session }, // Pass session to create
    );

    // 8. Additional related operations (all with session)
    // Example: Update related collection
    // await RelatedModel.updateOne(
    //   { _id: relatedId },
    //   { $set: { updatedBy: user._id, updatedAt: new Date() } },
    //   { session }
    // );

    // 9. Commit transaction
    await session.commitTransaction();

    // 10. Return success response
    return NextResponse.json(
      {
        message: "Record created successfully",
        data: newRecord[0],
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    // 11. Rollback on error
    await session.abortTransaction();

    console.error("Transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to create record",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    // 12. Always end session
    await session.endSession();
  }
}
```

### Update Pattern (PUT/PATCH)

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params; // Next.js 16 - params is Promise
    const body = await request.json();
    const { field1, field2, field3 } = body;

    // Validation
    if (!field1 || !field2) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find existing record
    const existingRecord = await YourModel.findOne({
      _id: id,
      status: { $ne: "DELETED" },
    }).session(session);

    if (!existingRecord) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Check for duplicates (excluding current record)
    const duplicate = await YourModel.findOne({
      field1,
      _id: { $ne: id },
      status: { $ne: "DELETED" },
    }).session(session);

    if (duplicate) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Duplicate record exists" },
        { status: 409 },
      );
    }

    // Update with audit fields
    const updatedRecord = await YourModel.findByIdAndUpdate(
      id,
      {
        $set: {
          field1,
          field2,
          field3,
          updatedBy: user._id,
          updatedAt: new Date(),
        },
      },
      {
        new: true, // Return updated document
        session, // Use transaction session
        runValidators: true, // Run model validators
      },
    ).populate("relatedField"); // Populate if needed

    await session.commitTransaction();

    return NextResponse.json({
      message: "Record updated successfully",
      data: updatedRecord,
    });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Update transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to update record",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
```

### Soft Delete Pattern (DELETE)

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();
    const { reason } = body; // Deletion reason

    if (!reason || reason.trim() === "") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Deletion reason is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Find record to delete
    const existingRecord = await YourModel.findOne({
      _id: id,
      status: { $ne: "DELETED" },
    }).session(session);

    if (!existingRecord) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Record not found or already deleted" },
        { status: 404 },
      );
    }

    // Soft delete with audit trail
    const deletedRecord = await YourModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "DELETED",
          deletedBy: user._id,
          deletedAt: new Date(),
          deletedReason: reason,
        },
      },
      { new: true, session },
    );

    // Handle cascading soft deletes if needed
    // await RelatedModel.updateMany(
    //   { parentId: id },
    //   {
    //     $set: {
    //       status: "DELETED",
    //       deletedBy: user._id,
    //       deletedAt: new Date(),
    //       deletedReason: `Parent deleted: ${reason}`,
    //     },
    //   },
    //   { session }
    // );

    await session.commitTransaction();

    return NextResponse.json({
      message: "Record deleted successfully",
      data: deletedRecord,
    });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Delete transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete record",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
```

### Transaction Best Practices

#### 1. Session Management

```typescript
// ✅ CORRECT - Always use try-catch-finally
const session = await mongoose.startSession();
try {
  await session.startTransaction();
  // ... operations
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession(); // CRITICAL: Always end session
}

// ❌ WRONG - Session not properly closed
const session = await mongoose.startSession();
await session.startTransaction();
// ... operations (if error occurs, session leaks)
await session.commitTransaction();
```

#### 2. Passing Session to Operations

```typescript
// ✅ CORRECT - Pass session to all operations
const record = await Model.findOne({ _id: id }).session(session);
const created = await Model.create([data], { session });
const updated = await Model.findByIdAndUpdate(id, data, { session });

// ❌ WRONG - Operations without session (not transactional)
const record = await Model.findOne({ _id: id }); // Not in transaction!
const created = await Model.create(data); // Not in transaction!
```

#### 3. Validation Before Transaction

```typescript
// ✅ CORRECT - Validate early, abort transaction on validation failure
const body = await request.json();
if (!body.requiredField) {
  await session.abortTransaction();
  return NextResponse.json({ error: "Validation failed" }, { status: 400 });
}

// ❌ WRONG - Throwing errors without aborting
if (!body.requiredField) {
  throw new Error("Validation failed"); // Transaction left hanging
}
```

#### 4. Error Handling

```typescript
// ✅ CORRECT - Proper error handling with typed errors
try {
  // ... transaction operations
} catch (err: unknown) {
  await session.abortTransaction();
  console.error("Transaction error:", err);
  return NextResponse.json(
    {
      error: "Operation failed",
      details: err instanceof Error ? err.message : "Unknown error",
    },
    { status: 500 },
  );
} finally {
  await session.endSession();
}

// ❌ WRONG - Untyped error, no abort
try {
  // ... operations
} catch (err) {
  console.log(err.message); // Type error
  return NextResponse.json({ error: err.message });
}
```

#### 5. MongoDB Connection

```typescript
// ✅ CORRECT - Connect before starting transaction operations
await connectDB();
const session = await mongoose.startSession();
await session.startTransaction();
// ... operations

// ❌ WRONG - Starting session before ensuring connection
const session = await mongoose.startSession(); // May fail if not connected
await connectDB();
```

### Transaction Limitations & Considerations

#### Replica Set Requirement

- **MongoDB transactions require a replica set**
- Development: Use `mongodb://localhost:27017/?replicaSet=rs0`
- Production: Atlas clusters are replica sets by default
- Local setup: Initialize replica set with `rs.initiate()`

#### Performance Considerations

- Transactions have performance overhead - use only for write operations
- Keep transactions short - minimize time between start and commit
- Avoid long-running operations inside transactions
- Don't perform external API calls inside transactions

#### Read Operations

```typescript
// ✅ Read operations DON'T need transactions for single document
export async function GET(request: NextRequest) {
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    // Simple read - no transaction needed
    const records = await YourModel.find({ status: { $ne: "DELETED" } })
      .populate("relatedField")
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: records });
  } catch (err: unknown) {
    console.error("Query error:", err);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 },
    );
  }
}
```

### Multi-Document Transaction Example

**Use case: Creating a loan with related payment schedule**

```typescript
export async function POST(request: NextRequest) {
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { clientId, amount, interestRate, term } = await request.json();

    await connectDB();

    // Create loan
    const loan = await Loan.create(
      [
        {
          clientId,
          amount,
          interestRate,
          term,
          status: "ACTIVE",
          createdBy: user._id,
        },
      ],
      { session },
    );

    // Create payment schedule
    const payments = [];
    for (let i = 0; i < term; i++) {
      payments.push({
        loanId: loan[0]._id,
        dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
        amount: amount / term,
        status: "PENDING",
        createdBy: user._id,
      });
    }

    await Payment.create(payments, { session });

    // Update client's loan count
    await Client.findByIdAndUpdate(
      clientId,
      {
        $inc: { activeLoans: 1 },
        $set: { updatedBy: user._id, updatedAt: new Date() },
      },
      { session },
    );

    await session.commitTransaction();

    return NextResponse.json(
      {
        message: "Loan created successfully",
        data: { loan: loan[0], paymentsCreated: payments.length },
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Loan creation transaction error:", err);
    return NextResponse.json(
      { error: "Failed to create loan" },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}
```

### Checklist for Every Write Operation

Before committing code, verify:

- [ ] Session started with `mongoose.startSession()`
- [ ] Transaction started with `session.startTransaction()`
- [ ] All database operations include `.session(session)`
- [ ] Transaction committed with `session.commitTransaction()`
- [ ] Errors handled with `session.abortTransaction()`
- [ ] Session ended with `session.endSession()` in `finally` block
- [ ] Audit fields included (`createdBy`, `updatedBy`, `deletedBy`)
- [ ] Timestamps included (`createdAt`, `updatedAt`, `deletedAt`)
- [ ] Validation performed before operations
- [ ] Error responses return appropriate status codes
- [ ] No external API calls inside transaction
- [ ] Transaction kept as short as possible

---

## Recent Updates (Last Modified: 2026-04-12)

### ✅ Completed Features

- Mobile-responsive design across all pages
- Sidebar navigation with collapsible/drawer modes
- DataTable component with advanced features:
  - Advanced search modal with column-specific filters
  - Professional print templates (portrait, themed)
  - Mobile card view + desktop table view
  - CSV export with filtered data
- Modal system with glassmorphism effects
- Reusable CRUD components (StatusBadge, LoadingSpinner)
- Confirmation modals with optional reason input
- Full-width button layouts on mobile detail pages
- Icon-only buttons on mobile views
- Orange/Yellow-green theme integration throughout

### 🎯 Key Implementation Notes

- All admin pages use DataTable component - updates propagate automatically
- Sidebar replaces top nav component
- All modals use glassmorphism backdrop: `bg-black/30 backdrop-blur-md`
- Print templates use portrait orientation with app theme colors
- Mobile breakpoint: 640px (sm), 768px (md), 1024px (lg)
- All detail page buttons: full-width on mobile, center-justified contentuthentication: email, password (hashed)
- Profile: firstName, lastName, phone
- Financial: rate, cashWithdrawable, capitalContribution, profitEarned, totalWithdrawn
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
