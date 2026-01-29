# System Architecture - Junobo Membership Management

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  PRESENTATION LAYER                                  │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Next.js Frontend (React)                             │ │
│  │                                                                                 │ │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │
│  │   │ Login   │ │Dashboard│ │ Upload  │ │ Members │ │ Reports │ │Settings │    │ │
│  │   │  Page   │ │  Page   │ │  Page   │ │  Page   │ │  Page   │ │  Page   │    │ │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │ │
│  │                                                                                 │ │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │   │                        Shared Components                                 │ │ │
│  │   │   Sidebar | StatCards | DataTables | Charts | Modals | Forms           │ │ │
│  │   └─────────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTP/HTTPS
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  APPLICATION LAYER                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                         Next.js API Routes (Serverless)                        │ │
│  │                                                                                 │ │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │   │                        Authentication Middleware                         │ │ │
│  │   │                    (JWT Validation | Role Check)                         │ │ │
│  │   └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                                 │ │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │ │
│  │   │  /api/auth  │ │ /api/members│ │/api/invoices│ │ /api/reports│            │ │
│  │   │  • login    │ │  • list     │ │  • list     │ │  • dashboard│            │ │
│  │   │  • register │ │  • get      │ │  • upload   │ │  • summary  │            │ │
│  │   │  • session  │ │  • update   │ │  • delete   │ │  • product  │            │ │
│  │   │  • logout   │ │  • delete   │ │             │ │  • export   │            │ │
│  │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘            │ │
│  │                                                                                 │ │
│  │   ┌─────────────┐ ┌─────────────┐                                             │ │
│  │   │ /api/users  │ │ /api/email  │                                             │ │
│  │   │  • list     │ │  • send     │                                             │ │
│  │   │  • create   │ │             │                                             │ │
│  │   │  • update   │ │             │                                             │ │
│  │   │  • delete   │ │             │                                             │ │
│  │   └─────────────┘ └─────────────┘                                             │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ Prisma Client
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA LAYER                                        │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                          Prisma ORM (Type-safe queries)                        │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                          │
│                                          ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                        PostgreSQL (Supabase Hosted)                            │ │
│  │                                                                                 │ │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │ │
│  │   │   User   │ │  Member  │ │ Invoice  │ │ Accrual  │ │UploadLog │           │ │
│  │   │  Table   │ │  Table   │ │  Table   │ │  Table   │ │  Table   │           │ │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow - Invoice Upload

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User   │     │   Upload    │     │   API       │     │  Database   │
│ Browser │     │   Page      │     │  /upload    │     │  (Supabase) │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                   │                   │
     │  Select File    │                   │                   │
     │────────────────▶│                   │                   │
     │                 │                   │                   │
     │  Click Upload   │                   │                   │
     │────────────────▶│                   │                   │
     │                 │                   │                   │
     │                 │  POST /api/upload │                   │
     │                 │  + Excel File     │                   │
     │                 │  + Month          │                   │
     │                 │──────────────────▶│                   │
     │                 │                   │                   │
     │                 │                   │  Parse Excel      │
     │                 │                   │  (xlsx library)   │
     │                 │                   │──────┐            │
     │                 │                   │◀─────┘            │
     │                 │                   │                   │
     │                 │                   │  Validate Data    │
     │                 │                   │──────┐            │
     │                 │                   │◀─────┘            │
     │                 │                   │                   │
     │                 │                   │  Upsert Members   │
     │                 │                   │──────────────────▶│
     │                 │                   │◀──────────────────│
     │                 │                   │                   │
     │                 │                   │  Create Invoices  │
     │                 │                   │──────────────────▶│
     │                 │                   │◀──────────────────│
     │                 │                   │                   │
     │                 │                   │  Generate Accruals│
     │                 │                   │──────────────────▶│
     │                 │                   │◀──────────────────│
     │                 │                   │                   │
     │                 │   Return Stats    │                   │
     │                 │◀──────────────────│                   │
     │                 │                   │                   │
     │  Show Success   │                   │                   │
     │◀────────────────│                   │                   │
     │                 │                   │                   │
```

## Data Flow - Report Generation

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User   │     │  Reports    │     │  API        │     │  Database   │
│ Browser │     │  Page       │     │  /reports   │     │  (Supabase) │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
     │                 │                   │                   │
     │  Select Report  │                   │                   │
     │  & Parameters   │                   │                   │
     │────────────────▶│                   │                   │
     │                 │                   │                   │
     │                 │ GET /api/reports  │                   │
     │                 │ ?type=summary     │                   │
     │                 │ &month=2026-01    │                   │
     │                 │──────────────────▶│                   │
     │                 │                   │                   │
     │                 │                   │  Query based on   │
     │                 │                   │  uploadMonth      │
     │                 │                   │──────────────────▶│
     │                 │                   │                   │
     │                 │                   │  Raw Data         │
     │                 │                   │◀──────────────────│
     │                 │                   │                   │
     │                 │                   │  Aggregate &      │
     │                 │                   │  Transform        │
     │                 │                   │──────┐            │
     │                 │                   │◀─────┘            │
     │                 │                   │                   │
     │                 │   JSON Response   │                   │
     │                 │◀──────────────────│                   │
     │                 │                   │                   │
     │  Render Charts  │                   │                   │
     │  & Tables       │                   │                   │
     │◀────────────────│                   │                   │
     │                 │                   │                   │
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                    LOGIN FLOW
                    ══════════
┌──────────┐     ┌────────────┐     ┌────────────┐     ┌──────────┐
│  Login   │     │  NextAuth  │     │   Prisma   │     │ Database │
│  Page    │     │   API      │     │   Client   │     │          │
└────┬─────┘     └─────┬──────┘     └─────┬──────┘     └────┬─────┘
     │                 │                   │                 │
     │  POST /api/auth │                   │                 │
     │  {email, pass}  │                   │                 │
     │────────────────▶│                   │                 │
     │                 │                   │                 │
     │                 │  Find User        │                 │
     │                 │──────────────────▶│                 │
     │                 │                   │  SELECT user    │
     │                 │                   │────────────────▶│
     │                 │                   │◀────────────────│
     │                 │◀──────────────────│                 │
     │                 │                   │                 │
     │                 │  Verify Password  │                 │
     │                 │  (bcrypt.compare) │                 │
     │                 │──────┐            │                 │
     │                 │◀─────┘            │                 │
     │                 │                   │                 │
     │                 │  Generate JWT     │                 │
     │                 │  (id, email, role)│                 │
     │                 │──────┐            │                 │
     │                 │◀─────┘            │                 │
     │                 │                   │                 │
     │  Set-Cookie:    │                   │                 │
     │  session JWT    │                   │                 │
     │◀────────────────│                   │                 │
     │                 │                   │                 │


                    SESSION VALIDATION
                    ══════════════════
┌──────────┐     ┌────────────┐     ┌────────────┐
│Protected │     │ Middleware │     │  NextAuth  │
│  Page    │     │            │     │   Session  │
└────┬─────┘     └─────┬──────┘     └─────┬──────┘
     │                 │                   │
     │  Request        │                   │
     │────────────────▶│                   │
     │                 │                   │
     │                 │  Validate JWT     │
     │                 │──────────────────▶│
     │                 │                   │
     │                 │  Session {        │
     │                 │    user: {        │
     │                 │      id, email,   │
     │                 │      role         │
     │                 │    }              │
     │                 │  }                │
     │                 │◀──────────────────│
     │                 │                   │
     │  Allow/Deny     │                   │
     │◀────────────────│                   │
     │                 │                   │
```

## Component Hierarchy

```
App
├── RootLayout
│   ├── Providers (SessionProvider, ThemeProvider)
│   │
│   ├── (auth) [Group]
│   │   ├── LoginPage
│   │   └── RegisterPage
│   │
│   └── (dashboard) [Group - Protected]
│       ├── DashboardLayout
│       │   ├── Sidebar
│       │   │   ├── Logo
│       │   │   ├── NavLinks
│       │   │   │   ├── DashboardLink
│       │   │   │   ├── UploadLink (ADMIN, FINANCE)
│       │   │   │   ├── MembersLink
│       │   │   │   ├── InvoicesLink
│       │   │   │   ├── ReportsLink
│       │   │   │   ├── EmailLink (ADMIN, FINANCE)
│       │   │   │   └── SettingsLink (ADMIN)
│       │   │   └── UserInfo + Logout
│       │   │
│       │   └── MainContent
│       │       ├── DashboardPage
│       │       │   ├── StatCards (4)
│       │       │   ├── RevenueChart
│       │       │   ├── ProductChart
│       │       │   └── RecentActivity
│       │       │
│       │       ├── UploadPage
│       │       │   ├── FileDropzone
│       │       │   ├── MonthSelector
│       │       │   └── UploadProgress
│       │       │
│       │       ├── MembersPage
│       │       │   ├── SearchBar
│       │       │   ├── Filters
│       │       │   ├── MembersTable
│       │       │   └── Pagination
│       │       │
│       │       ├── InvoicesPage
│       │       │   ├── SearchBar
│       │       │   ├── DateFilter
│       │       │   ├── InvoicesTable
│       │       │   └── Pagination
│       │       │
│       │       ├── ReportsPage
│       │       │   ├── ReportTypeSelector
│       │       │   ├── DateRangePicker
│       │       │   ├── ReportView
│       │       │   └── ExportButton
│       │       │
│       │       ├── EmailPage
│       │       │   ├── RecipientInput
│       │       │   ├── ReportSelector
│       │       │   └── SendButton
│       │       │
│       │       └── SettingsPage
│       │           ├── UsersTable
│       │           ├── AddUserModal
│       │           ├── EditUserModal
│       │           └── DeleteConfirmModal
│       │
│       └── MemberDetailPage [id]
│           ├── MemberInfo
│           ├── MembershipHistory
│           └── InvoiceList
```

## Database Relationships

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE RELATIONSHIPS                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      USER        │         │      MEMBER      │         │     INVOICE      │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ PK  id           │         │ PK  id           │◀───┐    │ PK  id           │
│     email        │         │ UK  globalId     │    │    │     invoiceNo    │
│     password     │         │     name         │    │    │     invoiceDate  │
│     name         │         │     email        │    └────│ FK  memberId     │
│     role         │         │     state        │         │     totalAmount  │
│     createdAt    │         │     status       │         │     totalTax     │
│     updatedAt    │         │     product      │         │     product      │
└────────┬─────────┘         │     membership*  │         │     uploadMonth  │
         │                   │     createdAt    │         │     calcMonth    │
         │                   │     updatedAt    │         │     createdAt    │
         │                   └──────────────────┘         └────────┬─────────┘
         │                                                         │
         │                                                         │
         │    ┌──────────────────┐         ┌──────────────────┐   │
         │    │    UPLOADLOG     │         │     ACCRUAL      │   │
         │    ├──────────────────┤         ├──────────────────┤   │
         └───▶│ PK  id           │         │ PK  id           │◀──┘
              │ FK  userId       │         │ FK  invoiceId    │
              │     fileName     │         │     accrualMonth │
              │     uploadMonth  │         │     amount       │
              │     recordsCreated│         │     taxAmount    │
              │     errors       │         │     createdAt    │
              │     createdAt    │         └──────────────────┘
              └──────────────────┘

RELATIONSHIP TYPES:
═══════════════════
User  ──┤├──<  UploadLog     (One-to-Many: User has many upload logs)
Member ──┤├──< Invoice       (One-to-Many: Member has many invoices)
Invoice ──┤├──< Accrual      (One-to-Many: Invoice has many accruals)

CARDINALITY:
════════════
──┤├──<  means "one to many"
PK = Primary Key
FK = Foreign Key
UK = Unique Key
```

## State Management

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              STATE MANAGEMENT                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 SERVER STATE                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          API Response Cache                              │   │
│  │   Dashboard Data    │  Members List  │  Invoices  │  Reports            │   │
│  │   (Cache: 60s)      │  (Cache: 30s)  │ (Cache: 30s)│ (Cache: 30s)       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT STATE                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           React State (useState)                         │   │
│  │   • Form inputs          • Loading states                                │   │
│  │   • Modal visibility     • Selected items                                │   │
│  │   • Filter values        • Pagination state                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Session State (NextAuth)                         │   │
│  │   user: {                                                                │   │
│  │     id: "cuid...",                                                       │   │
│  │     email: "admin@example.com",                                          │   │
│  │     role: "ADMIN"                                                        │   │
│  │   }                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          URL State (useSearchParams)                     │   │
│  │   • ?page=1&limit=20     • ?search=john                                  │   │
│  │   • ?month=2026-01       • ?type=summary                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Accrual Accounting Logic

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ACCRUAL ACCOUNTING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────┘

SCENARIO: Annual Membership Invoice
═══════════════════════════════════

Invoice Details:
├── Invoice No: INV-2026-001
├── Invoice Date: Jan 15, 2026
├── Total Amount: ₹1,20,000
├── Total Tax: ₹21,600 (18% GST)
├── Calculations of Month: 12
└── Membership Start: Jan 2026

Processing:
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Monthly Amount = ₹1,20,000 ÷ 12 = ₹10,000                                      │
│  Monthly Tax    = ₹21,600 ÷ 12   = ₹1,800                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

Generated Accrual Entries:
┌──────────────┬─────────────┬─────────────┐
│ Accrual Month│   Amount    │  Tax Amount │
├──────────────┼─────────────┼─────────────┤
│ 2026-01      │  ₹10,000    │   ₹1,800    │
│ 2026-02      │  ₹10,000    │   ₹1,800    │
│ 2026-03      │  ₹10,000    │   ₹1,800    │
│ 2026-04      │  ₹10,000    │   ₹1,800    │
│ 2026-05      │  ₹10,000    │   ₹1,800    │
│ 2026-06      │  ₹10,000    │   ₹1,800    │
│ 2026-07      │  ₹10,000    │   ₹1,800    │
│ 2026-08      │  ₹10,000    │   ₹1,800    │
│ 2026-09      │  ₹10,000    │   ₹1,800    │
│ 2026-10      │  ₹10,000    │   ₹1,800    │
│ 2026-11      │  ₹10,000    │   ₹1,800    │
│ 2026-12      │  ₹10,000    │   ₹1,800    │
├──────────────┼─────────────┼─────────────┤
│ TOTAL        │ ₹1,20,000   │  ₹21,600    │
└──────────────┴─────────────┴─────────────┘


REPORT: Accrual vs Invoice Comparison
═════════════════════════════════════

For Month: January 2026

┌─────────────────────────────────────────────────────────────────────────────────┐
│  Invoiced Revenue (Cash Basis)                                                   │
│  ├── New Annual Memberships:    ₹12,00,000 (10 invoices)                        │
│  ├── New Quarterly Memberships: ₹2,40,000  (8 invoices)                         │
│  └── Total Invoiced:            ₹14,40,000                                       │
│                                                                                  │
│  Recognized Revenue (Accrual Basis)                                              │
│  ├── Current Month Accruals:    ₹1,20,000  (from new annual)                    │
│  ├── Current Month Accruals:    ₹80,000    (from new quarterly)                 │
│  ├── Prior Month Carryforward:  ₹3,50,000  (from previous months)               │
│  └── Total Recognized:          ₹5,50,000                                        │
│                                                                                  │
│  Deferred Revenue:              ₹8,90,000                                        │
│  (Revenue invoiced but not yet recognized)                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## File Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FILE DEPENDENCIES                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

prisma/schema.prisma
       │
       ▼
src/lib/prisma.ts ──────────────────────────────────────┐
       │                                                │
       │                                                │
src/lib/auth.ts ◀───────────────────────────────────────┤
       │                                                │
       ▼                                                │
src/app/api/auth/[...nextauth]/route.ts                 │
       │                                                │
       ▼                                                │
src/middleware.ts                                       │
       │                                                │
       ├──▶ src/app/api/members/route.ts ◀──────────────┤
       │                                                │
       ├──▶ src/app/api/invoices/route.ts ◀─────────────┤
       │                                                │
       ├──▶ src/app/api/invoices/upload/route.ts ◀──────┤
       │                                                │
       ├──▶ src/app/api/reports/route.ts ◀──────────────┤
       │                                                │
       ├──▶ src/app/api/users/route.ts ◀────────────────┤
       │                                                │
       └──▶ src/app/api/email/route.ts ◀────────────────┘


src/components/providers.tsx
       │
       ▼
src/app/layout.tsx
       │
       ├──▶ src/app/(dashboard)/layout.tsx
       │           │
       │           ├──▶ src/components/sidebar.tsx
       │           │
       │           ├──▶ src/app/(dashboard)/dashboard/page.tsx
       │           │           │
       │           │           ├──▶ src/components/stat-card.tsx
       │           │           └──▶ src/components/charts.tsx
       │           │
       │           ├──▶ src/app/(dashboard)/upload/page.tsx
       │           ├──▶ src/app/(dashboard)/members/page.tsx
       │           ├──▶ src/app/(dashboard)/invoices/page.tsx
       │           ├──▶ src/app/(dashboard)/reports/page.tsx
       │           ├──▶ src/app/(dashboard)/email/page.tsx
       │           └──▶ src/app/(dashboard)/settings/page.tsx
       │
       ├──▶ src/app/login/page.tsx
       └──▶ src/app/register/page.tsx
```
