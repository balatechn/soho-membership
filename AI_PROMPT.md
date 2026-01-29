# AI Prompt - Junobo Membership Invoice & Revenue Management System

Use this prompt to instruct an AI assistant to build the complete Membership Invoice & Revenue Management application.

---

## 🤖 Master Prompt

```
Build a comprehensive Membership Invoice & Revenue Management System for a private members club (Junobo Mumbai) with the following specifications:

## Project Overview
Create a full-stack web application to:
- Upload and process monthly invoice data from Excel files
- Track membership revenue, taxes, and member lifecycle
- Generate financial reports and analytics dashboards
- Support accrual-based revenue recognition
- Manage users with role-based access control

## Technology Stack
- **Frontend:** Next.js 15+ with App Router, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (serverless)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with JWT strategy
- **Charts:** Recharts
- **Excel Processing:** xlsx library
- **Hosting:** Vercel (frontend) + Supabase (database)

## Database Schema

### User Table
- id (string, primary key, cuid)
- email (string, unique)
- password (string, bcrypt hashed)
- name (string, optional)
- role (string: "ADMIN" | "FINANCE" | "MANAGEMENT")
- createdAt, updatedAt (timestamps)

### Member Table
- id (string, primary key, cuid)
- globalId (string, unique) - Member ID from Junobo
- name (string)
- email (string, optional)
- pinCode, state (string, optional)
- status (string: "ACTIVE" | "EXPIRED" | "RENEWED")
- product (string) - "Local", "Every House", "Under 27", etc.
- membershipType (string) - "Annual", "Quarterly"
- membershipStartDate, membershipEndDate (datetime)
- paymentStartDate, paymentEndDate (datetime)
- registration, location (string)
- createdAt, updatedAt (timestamps)
- Relation: hasMany Invoice

### Invoice Table
- id (string, primary key, cuid)
- invoiceNo (string)
- invoiceDate (datetime)
- memberId (foreign key to Member)
- name (string) - Member name at invoice time
- membership, membershipTotal (float)
- cgst, sgst, igst, totalTax, totalAmount (float)
- description (string, optional)
- membershipStartDate, membershipEndDate (datetime)
- renewalType (string) - "Renewal", "Quarterly", "New"
- product (string)
- monthsTenure (int)
- calculationMonth (int) - 3, 6, or 12 for accrual spread
- uploadMonth (string) - "YYYY-MM" format
- createdAt (timestamp)
- Unique constraint: [invoiceNo, uploadMonth]
- Relation: hasMany Accrual

### Accrual Table
- id (string, primary key, cuid)
- invoiceId (foreign key to Invoice, cascade delete)
- accrualMonth (string) - "YYYY-MM" format
- amount (float) - Monthly accrued revenue
- taxAmount (float) - Monthly accrued tax
- createdAt (timestamp)
- Unique constraint: [invoiceId, accrualMonth]
- Index on accrualMonth for fast queries

### UploadLog Table
- id (string, primary key, cuid)
- userId (foreign key to User)
- fileName (string)
- uploadMonth (string)
- recordsCreated, recordsUpdated, errors (int)
- createdAt (timestamp)

## Core Features

### 1. Authentication & Authorization
- Login page with email/password
- JWT-based sessions (30-day expiry)
- Role-based access control:
  - ADMIN: Full access including user management
  - FINANCE: Upload, view members, invoices, reports, email
  - MANAGEMENT: View-only access to members, invoices, reports

### 2. Dashboard
- Total Revenue (current month based on uploadMonth)
- Total Members count
- Active Members count
- Upcoming Renewals (members expiring in 30 days)
- Monthly revenue trend chart (last 6 months)
- Product distribution pie chart
- Member status breakdown

### 3. Excel Upload
- Accept .xlsx and .xls files
- Required columns: Invoice No., Invoice Date, Global ID, Name, Month Total
- Optional columns: State, Email, Registration, Membership amounts, Tax columns (CGST 9%, SGST 9%, IGST 18%), Description, Membership dates, Product, Months, Calculations of Month
- On upload:
  1. Parse Excel using xlsx library
  2. Normalize headers (handle variations like "Invoice No." / "INVOICE NUMBER")
  3. Upsert members (create or update based on globalId)
  4. Create invoices (unique by invoiceNo + uploadMonth)
  5. Generate accrual entries if calculationMonth > 1
  6. Return stats: created, updated, errors
- Allow selecting upload month (YYYY-MM)
- Delete function to remove all invoices for a month

### 4. Accrual Accounting Logic
When "Calculations of Month" field has value > 1:
- Monthly Amount = totalAmount ÷ calculationMonth
- Monthly Tax = totalTax ÷ calculationMonth
- Create accrual entries from membershipStartDate (or invoiceDate) for each month
- Store in Accrual table with month in "YYYY-MM" format
- Example: ₹120,000 annual membership with 12-month spread = ₹10,000/month

### 5. Members Management
- List view with pagination (20 per page)
- Search by name, email, globalId
- Filter by status (Active, Expired, Renewed)
- Filter by product type
- Detail page showing member info + all invoices
- Edit member details (Admin/Finance only)
- Delete member with all invoices (Admin only)

### 6. Invoices
- List all invoices with pagination
- Filter by uploadMonth
- Search by invoice number or member name
- Show summary: total amount, total tax, count

### 7. Reports
Create API endpoint with type parameter:
- **dashboard**: Overview stats, trends, distributions
- **summary**: Monthly revenue breakdown (gross, tax, net)
- **product**: Revenue by product type
- **quarterly**: Q1-Q4 comparison for a year
- **member-status**: Active/Expired/Renewed breakdown
- **upcoming-renewals**: Members expiring in 7/30/90 days
- **accrual**: Invoiced vs Recognized revenue comparison
- Export to Excel functionality

### 8. User Management (Admin Only)
- List all users
- Create user: email, password (min 6 chars), name, role
- Edit user: update details, optionally change password
- Delete user (cannot delete self)
- Role badges: ADMIN (purple), FINANCE (blue), MANAGEMENT (gray)

### 9. Email Reports (Optional)
- Send reports via email using nodemailer
- Configure SMTP settings via environment variables

## UI Requirements

### Layout
- Fixed sidebar with navigation
- Main content area
- Responsive design
- Clean, modern UI with Tailwind CSS

### Sidebar Links
- Dashboard (all roles)
- Upload (Admin, Finance)
- Members (all roles)
- Invoices (all roles)
- Reports (all roles)
- Email (Admin, Finance)
- Settings (Admin only)

### Key Components
- StatCard: Display metric with icon, value, and optional change indicator
- DataTable: Sortable, paginated table
- Charts: Line chart for trends, Pie/Bar for distributions
- Modals: For create/edit forms
- Toast notifications for success/error messages

## API Endpoints

```
Authentication:
POST /api/auth/callback/credentials - Login
GET  /api/auth/session - Get session
POST /api/auth/signout - Logout

Members:
GET  /api/members - List (paginated, filterable)
GET  /api/members/[id] - Get single with invoices
PUT  /api/members/[id] - Update
DELETE /api/members/[id] - Delete

Invoices:
GET  /api/invoices - List (paginated)
POST /api/invoices/upload - Upload Excel
DELETE /api/invoices?month=YYYY-MM - Delete by month

Reports:
GET /api/reports?type=xxx&month=YYYY-MM - Generate report
GET /api/reports/export?type=xxx - Export to Excel

Users (Admin):
GET  /api/users - List all
POST /api/users - Create
PUT  /api/users/[id] - Update
DELETE /api/users/[id] - Delete

Email:
POST /api/email - Send report
```

## Performance Optimizations
- Client-side caching for dashboard (1-minute TTL)
- API Cache-Control headers (30s for dashboard, 10s for users)
- Prisma connection pooling
- Tree-shaking for large packages (lucide-react, date-fns, recharts)
- JWT session with 30-day maxAge

## Environment Variables
```
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=<32+ char secret>
NEXTAUTH_URL=https://your-domain.vercel.app
SMTP_HOST=smtp.gmail.com (optional)
SMTP_PORT=587 (optional)
SMTP_USER=email (optional)
SMTP_PASSWORD=password (optional)
```

## Folder Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── members/page.tsx
│   │   ├── members/[id]/page.tsx
│   │   ├── invoices/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── email/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── members/route.ts
│   │   ├── members/[id]/route.ts
│   │   ├── invoices/route.ts
│   │   ├── invoices/upload/route.ts
│   │   ├── reports/route.ts
│   │   ├── reports/export/route.ts
│   │   ├── users/route.ts
│   │   ├── users/[id]/route.ts
│   │   └── email/route.ts
│   ├── login/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── sidebar.tsx
│   ├── stat-card.tsx
│   ├── charts.tsx
│   └── providers.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
└── middleware.ts
prisma/
└── schema.prisma
```

## Key Business Logic

### Revenue Calculation
- Always query by uploadMonth (when invoice was uploaded), not invoiceDate
- This ensures reports show revenue for the month data was recorded

### Member Status
- ACTIVE: membershipEndDate > today
- EXPIRED: membershipEndDate <= today
- RENEWED: When new invoice uploaded for expired member

### Tax Calculation
- CGST 9% + SGST 9% for intra-state (Maharashtra)
- IGST 18% for inter-state
- Total tax = cgst + sgst + igst

Please implement this complete system step by step, starting with:
1. Project initialization and database setup
2. Authentication system
3. Core API routes
4. Dashboard and main pages
5. Excel upload with accrual generation
6. Reports and exports
7. User management
8. Optimizations
```

---

## 🎯 Specific Feature Prompts

### Prompt for Accrual Accounting Feature

```
Implement accrual accounting for membership invoices:

1. Add "calculationMonth" field to Invoice model (int, optional)
2. Create Accrual model with: invoiceId, accrualMonth (YYYY-MM), amount, taxAmount
3. During Excel upload, if calculationMonth > 1:
   - Calculate monthly amount = totalAmount / calculationMonth
   - Calculate monthly tax = totalTax / calculationMonth
   - Loop from membershipStartDate for calculationMonth iterations
   - Create Accrual entry for each month
4. Create accrual report API that compares:
   - Invoiced revenue (sum of totalAmount for uploadMonth)
   - Recognized revenue (sum of accruals for the month)
   - Deferred revenue (invoiced - recognized)
```

### Prompt for User Management Feature

```
Create admin-only user management:

1. API Routes (/api/users):
   - GET: List all users (exclude password)
   - POST: Create user with bcrypt password hashing
   - PUT /[id]: Update user (password optional)
   - DELETE /[id]: Delete user (prevent self-delete)

2. Validation:
   - Email: required, unique, valid format
   - Password: required for create, min 6 chars
   - Role: required, must be ADMIN/FINANCE/MANAGEMENT

3. Settings Page UI:
   - Table with columns: Name, Email, Role, Created, Actions
   - "Add User" button (opens modal)
   - Edit/Delete buttons per row
   - Role displayed as colored badges
   - Confirm dialog before delete
```

### Prompt for Excel Upload Feature

```
Implement Excel invoice upload with these columns:
Invoice No., Invoice Date, Global ID, Name, State, Email Id, Registration, 
Membership, Month Total, CGST 9%, SGST 9%, CGST 18%, SGST 18%, Total Tax, 
Description, Membership Start Date, Membership End Date, Payment Start Date, 
Payment End Date, Renewal/Quarterly, Product, Months, Calculations of Month

Processing logic:
1. Parse Excel with xlsx library
2. Normalize headers (lowercase, remove spaces/special chars)
3. For each row:
   a. Find or create Member by globalId
   b. Update member details from row
   c. Create Invoice (unique by invoiceNo + uploadMonth)
   d. If calculationMonth exists, generate Accrual entries
4. Return stats: { total, created, updated, errors }
5. Log upload in UploadLog table
```

---

## 📋 Checklist Prompt

```
Verify the Membership Management System has these features:

Authentication:
□ Login with email/password
□ JWT sessions with 30-day expiry
□ Role-based middleware protection
□ Logout functionality

Dashboard:
□ Revenue stat card (current month by uploadMonth)
□ Total members count
□ Active members count
□ Upcoming renewals count
□ Monthly trend line chart
□ Product distribution chart

Upload:
□ Excel file upload (.xlsx, .xls)
□ Month selector
□ Progress indicator
□ Success/error toast messages
□ Delete month data function
□ Accrual generation for multi-month memberships

Members:
□ Paginated list (20 per page)
□ Search functionality
□ Status filter (Active/Expired/Renewed)
□ Product filter
□ Member detail page with invoices
□ Edit member (Admin/Finance)
□ Delete member (Admin only)

Invoices:
□ Paginated list
□ Month filter
□ Search by invoice number
□ Summary totals display

Reports:
□ Dashboard summary
□ Monthly revenue summary
□ Product-wise breakdown
□ Quarterly comparison
□ Member status report
□ Upcoming renewals
□ Accrual vs Invoice comparison
□ Excel export

User Management (Admin):
□ List all users
□ Create user with role
□ Edit user details
□ Delete user (not self)
□ Password change option

Performance:
□ Client-side caching
□ API cache headers
□ Optimized imports
□ Session optimization
```

---

## 🔧 Troubleshooting Prompt

```
Debug common issues in the Membership Management System:

Issue: Dashboard shows ₹0 revenue
Fix: Ensure queries filter by "uploadMonth" field, not "invoiceDate"

Issue: Settings page redirects before loading
Fix: Check session status === "loading" before rendering, show spinner while loading

Issue: Slow initial page load
Fix: Add optimizePackageImports for lucide-react, date-fns, recharts in next.config.ts

Issue: Database connection errors on Vercel
Fix: Use connection pooler URL for DATABASE_URL, direct URL for DIRECT_URL

Issue: Excel upload fails silently
Fix: Add detailed error logging, validate all required columns exist

Issue: Accruals not generating
Fix: Check calculationMonth field is being parsed as number, not string

Issue: User can't see new UI after deployment
Fix: Hard refresh (Ctrl+Shift+R) or clear browser cache
```

---

**Created:** January 29, 2026  
**Version:** 1.0.0
