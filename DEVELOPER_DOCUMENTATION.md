# Junobo Mumbai - Membership Invoice & Revenue Management System

## Complete Developer Documentation

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Folder Structure](#folder-structure)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Endpoints](#api-endpoints)
8. [Core Features](#core-features)
9. [Frontend Components](#frontend-components)
10. [Environment Setup](#environment-setup)
11. [Deployment](#deployment)

---

## 🎯 Project Overview

### Purpose
A comprehensive membership management system designed for Junobo Mumbai to:
- Track member invoices and payments
- Generate revenue reports and analytics
- Manage member lifecycle (active, expired, renewed)
- Handle accrual accounting for membership fees
- Send automated email reports
- Support multi-user access with role-based permissions

### Business Requirements
- Upload monthly invoice data from Excel files
- Track membership revenue by product, quarter, and year
- Monitor member status and upcoming renewals
- Generate financial reports for management
- Support accrual-based revenue recognition

---

## 🛠 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework with App Router |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.4.x | Utility-first CSS framework |
| Recharts | 2.x | Data visualization/charts |
| Lucide React | Latest | Icon library |
| React Hot Toast | 2.x | Toast notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.1.6 | Serverless API endpoints |
| Prisma ORM | 5.22.0 | Database ORM & migrations |
| NextAuth.js | 4.24.x | Authentication |
| bcryptjs | 2.x | Password hashing |
| xlsx | 0.18.5 | Excel file parsing |
| nodemailer | 6.x | Email sending |

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| Supabase | Managed PostgreSQL hosting |

### Deployment
| Platform | Purpose |
|----------|---------|
| Vercel | Frontend & API hosting |
| GitHub | Source code repository |

---

## 🏗 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend (React)                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │Dashboard │ │ Members  │ │ Invoices │ │ Reports  │ │ Settings │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE NETWORK                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes (Serverless)                   │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │   │
│  │  │ /api/auth/*  │ │ /api/members │ │ /api/reports │                 │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │   │
│  │  │ /api/invoices│ │ /api/users   │ │ /api/email   │                 │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ Prisma Client
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (PostgreSQL)                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  User    │ │  Member  │ │ Invoice  │ │ Accrual  │ │ AuditLog │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
junobo-membership/
├── prisma/
│   └── schema.prisma              # Database schema definition
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (dashboard)/           # Protected dashboard routes (grouped)
│   │   │   ├── layout.tsx         # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # Main dashboard with stats & charts
│   │   │   ├── members/
│   │   │   │   ├── page.tsx       # Members list with search/filter
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Individual member detail
│   │   │   ├── invoices/
│   │   │   │   └── page.tsx       # Invoice listing & search
│   │   │   ├── upload/
│   │   │   │   └── page.tsx       # Excel upload interface
│   │   │   ├── reports/
│   │   │   │   └── page.tsx       # Report generation & export
│   │   │   ├── email/
│   │   │   │   └── page.tsx       # Email report sending
│   │   │   └── settings/
│   │   │       └── page.tsx       # User management (Admin only)
│   │   │
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/
│   │   │   │   │   └── route.ts   # NextAuth handler
│   │   │   │   └── register/
│   │   │   │       └── route.ts   # User registration
│   │   │   ├── members/
│   │   │   │   ├── route.ts       # GET/POST members
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET/PUT/DELETE member
│   │   │   ├── invoices/
│   │   │   │   ├── route.ts       # GET invoices
│   │   │   │   └── upload/
│   │   │   │       └── route.ts   # POST Excel upload
│   │   │   ├── reports/
│   │   │   │   ├── route.ts       # GET various reports
│   │   │   │   └── export/
│   │   │   │       └── route.ts   # GET export to Excel
│   │   │   ├── users/
│   │   │   │   ├── route.ts       # GET/POST users
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET/PUT/DELETE user
│   │   │   └── email/
│   │   │       └── route.ts       # POST send email
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   ├── register/
│   │   │   └── page.tsx           # Registration page
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Root redirect to dashboard
│   │   └── globals.css            # Global styles
│   │
│   ├── components/                # Reusable UI components
│   │   ├── sidebar.tsx            # Navigation sidebar
│   │   ├── stat-card.tsx          # Dashboard stat card
│   │   ├── charts.tsx             # Recharts components
│   │   └── providers.tsx          # Context providers
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth configuration
│   │   └── utils.ts               # Helper functions
│   │
│   └── middleware.ts              # Auth middleware
│
├── public/                        # Static assets
│   └── favicon.ico
│
├── .env                           # Environment variables (local)
├── .env.local                     # Local overrides
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Dependencies
```

---

## 🗄 Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Member      │       │    Invoice      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │◄──────│ memberId (FK)   │
│ email           │       │ globalId        │       │ id (PK)         │
│ password        │       │ name            │       │ invoiceNo       │
│ name            │       │ email           │       │ invoiceDate     │
│ role            │       │ state           │       │ totalAmount     │
│ createdAt       │       │ status          │       │ totalTax        │
└─────────────────┘       │ product         │       │ product         │
        │                 │ membershipType  │       │ calculationMonth│
        │                 │ membershipStart │       │ uploadMonth     │
        │                 │ membershipEnd   │       └────────┬────────┘
        │                 └─────────────────┘                │
        │                                                    │
        ▼                                                    ▼
┌─────────────────┐                              ┌─────────────────┐
│   UploadLog     │                              │    Accrual      │
├─────────────────┤                              ├─────────────────┤
│ id (PK)         │                              │ id (PK)         │
│ userId (FK)     │                              │ invoiceId (FK)  │
│ fileName        │                              │ accrualMonth    │
│ recordsCreated  │                              │ amount          │
│ uploadMonth     │                              │ taxAmount       │
│ createdAt       │                              │ createdAt       │
└─────────────────┘                              └─────────────────┘
```

### Schema Details

```prisma
// User - System users with role-based access
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // bcrypt hashed
  name          String?
  role          String    @default("MANAGEMENT") // ADMIN, FINANCE, MANAGEMENT
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  uploadLogs    UploadLog[]
  auditLogs     AuditLog[]
}

// Member - Junobo members
model Member {
  id                  String    @id @default(cuid())
  globalId            String    @unique  // Junobo member ID
  name                String
  email               String?
  pinCode             String?
  state               String?
  status              String    @default("ACTIVE") // ACTIVE, EXPIRED, RENEWED
  product             String?   // Local, Every House, Under 27, etc.
  membershipType      String?   // Annual, Quarterly
  membershipStartDate DateTime?
  membershipEndDate   DateTime?
  paymentStartDate    DateTime?
  paymentEndDate      DateTime?
  registration        String?
  location            String    @default("Mumbai")
  invoices            Invoice[]
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

// Invoice - Membership invoices
model Invoice {
  id                  String    @id @default(cuid())
  invoiceNo           String
  invoiceDate         DateTime
  memberId            String
  member              Member    @relation(fields: [memberId], references: [id])
  name                String    // Member name at time of invoice
  membership          Float     @default(0)
  membershipTotal     Float     @default(0)
  cgst                Float     @default(0) // 9%
  sgst                Float     @default(0) // 9%
  igst                Float     @default(0) // 18%
  totalTax            Float     @default(0)
  totalAmount         Float
  description         String?
  membershipStartDate DateTime?
  membershipEndDate   DateTime?
  renewalType         String?   // Renewal / Quarterly / New
  product             String?
  monthsTenure        Int?
  calculationMonth    Int?      // 3, 6, or 12 - for accrual
  uploadMonth         String    // YYYY-MM format
  accruals            Accrual[]
  createdAt           DateTime  @default(now())
  
  @@unique([invoiceNo, uploadMonth])
}

// Accrual - Monthly revenue recognition
model Accrual {
  id            String   @id @default(cuid())
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  accrualMonth  String   // YYYY-MM format
  amount        Float    // Monthly accrued amount
  taxAmount     Float    // Monthly accrued tax
  createdAt     DateTime @default(now())
  
  @@unique([invoiceId, accrualMonth])
  @@index([accrualMonth])
}

// UploadLog - Track Excel uploads
model UploadLog {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  fileName        String
  uploadMonth     String
  recordsCreated  Int      @default(0)
  recordsUpdated  Int      @default(0)
  errors          Int      @default(0)
  createdAt       DateTime @default(now())
}
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │────▶│ Login Page   │────▶│ NextAuth API │────▶│ Database │
│          │◀────│              │◀────│ (JWT Token)  │◀────│ (User)   │
└──────────┘     └──────────────┘     └──────────────┘     └──────────┘
     │                                       │
     │         JWT Token in Cookie           │
     │◀──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Protected Routes                                │
│  - Session validated on each request                                  │
│  - Role checked for authorization                                     │
└──────────────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

| Role | Dashboard | Upload | Members | Invoices | Reports | Email | Settings |
|------|-----------|--------|---------|----------|---------|-------|----------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| FINANCE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| MANAGEMENT | ✅ | ❌ | ✅ (read) | ✅ (read) | ✅ | ❌ | ❌ |

### Implementation

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        if (!user || !bcrypt.compare(credentials.password, user.password)) {
          throw new Error("Invalid credentials")
        }
        return { id: user.id, email: user.email, role: user.role }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    }
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }
}
```

---

## 🌐 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/callback/credentials` | Login | ❌ |
| GET | `/api/auth/session` | Get session | ❌ |
| POST | `/api/auth/signout` | Logout | ✅ |
| POST | `/api/auth/register` | Register user | ❌ |

### Members

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/members` | List members (paginated) | ✅ | All |
| GET | `/api/members?search=xxx` | Search members | ✅ | All |
| GET | `/api/members/[id]` | Get member details | ✅ | All |
| PUT | `/api/members/[id]` | Update member | ✅ | ADMIN, FINANCE |
| DELETE | `/api/members/[id]` | Delete member | ✅ | ADMIN |

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search by name, email, globalId
- `status` - Filter by status (ACTIVE, EXPIRED, RENEWED)
- `product` - Filter by product type

### Invoices

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/invoices` | List invoices | ✅ | All |
| POST | `/api/invoices/upload` | Upload Excel file | ✅ | ADMIN, FINANCE |
| DELETE | `/api/invoices?month=YYYY-MM` | Delete by month | ✅ | ADMIN |

**Upload Request:**
```typescript
// POST /api/invoices/upload
// Content-Type: multipart/form-data
{
  file: File,        // Excel file (.xlsx, .xls)
  month: "2026-01"   // Upload month (YYYY-MM)
}
```

**Upload Response:**
```json
{
  "message": "Upload successful",
  "stats": {
    "total": 55,
    "created": 50,
    "updated": 5,
    "errors": 0
  }
}
```

### Reports

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports?type=dashboard` | Dashboard summary | ✅ |
| GET | `/api/reports?type=summary&month=YYYY-MM` | Revenue summary | ✅ |
| GET | `/api/reports?type=product&month=YYYY-MM` | Product-wise revenue | ✅ |
| GET | `/api/reports?type=quarterly&year=2026` | Quarterly comparison | ✅ |
| GET | `/api/reports?type=member-status` | Member status breakdown | ✅ |
| GET | `/api/reports?type=upcoming-renewals` | Upcoming renewals | ✅ |
| GET | `/api/reports?type=accrual&month=YYYY-MM` | Accrual report | ✅ |
| GET | `/api/reports/export?type=xxx` | Export to Excel | ✅ |

**Dashboard Response:**
```json
{
  "report": "Dashboard",
  "data": {
    "revenue": {
      "currentMonth": 4500000,
      "lastMonth": 4200000,
      "change": 7.14,
      "tax": 810000,
      "invoiceCount": 55
    },
    "members": {
      "total": 250,
      "active": 200,
      "expired": 30,
      "upcomingRenewals": 15
    },
    "productDistribution": [
      { "product": "Local", "count": 120 },
      { "product": "Every House", "count": 80 }
    ],
    "monthlyTrend": [
      { "month": "Jan 2026", "revenue": 4500000 }
    ]
  }
}
```

### Users (Admin Only)

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| GET | `/api/users` | List all users | ✅ | ADMIN |
| POST | `/api/users` | Create user | ✅ | ADMIN |
| PUT | `/api/users/[id]` | Update user | ✅ | ADMIN |
| DELETE | `/api/users/[id]` | Delete user | ✅ | ADMIN |

**Create User Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "FINANCE"
}
```

### Email

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| POST | `/api/email` | Send report email | ✅ | ADMIN, FINANCE |

**Request:**
```json
{
  "to": ["manager@junobo.com"],
  "subject": "Monthly Revenue Report",
  "reportType": "summary",
  "month": "2026-01"
}
```

---

## ⚙️ Core Features

### 1. Excel Upload & Processing

**Supported Columns (23 columns):**
```
Invoice No., Invoice Date, Global ID, Name, State, Email Id, 
Registration, Membership, Month Total, CGST 9%, SGST 9%, 
CGST 18%, SGST 18%, Total Tax, Description, Membership Start Date,
Membership End Date, Payment Start Date, Payment End Date, 
Renewal/Quarterly, Product, Months, Calculations of Month
```

**Processing Flow:**
```
Excel Upload → Parse with xlsx → Normalize Headers → 
Validate Data → Upsert Members → Create Invoices → 
Generate Accruals → Return Stats
```

**Header Normalization:**
The system handles various header formats:
- "Invoice No." → invoiceno
- "INVOICE NUMBER" → invoiceno
- "Inv No" → invoiceno

### 2. Accrual Accounting

**Purpose:** Spread revenue recognition across membership months

**Example:**
```
Invoice: ₹1,20,000 (Annual Membership)
Calculations of Month: 12

Accrual Entries:
- Jan 2026: ₹10,000
- Feb 2026: ₹10,000
- Mar 2026: ₹10,000
... (12 months total)
```

**Implementation:**
```typescript
if (calculationMonth && calculationMonth > 1) {
  const monthlyAmount = totalAmount / calculationMonth
  const monthlyTax = totalTax / calculationMonth
  
  for (let i = 0; i < calculationMonth; i++) {
    const accrualDate = addMonths(startDate, i)
    await prisma.accrual.create({
      data: {
        invoiceId: invoice.id,
        accrualMonth: format(accrualDate, 'yyyy-MM'),
        amount: monthlyAmount,
        taxAmount: monthlyTax
      }
    })
  }
}
```

### 3. Report Generation

**Report Types:**

| Report | Description | Key Metrics |
|--------|-------------|-------------|
| Dashboard | Overview stats | Revenue, Members, Renewals |
| Summary | Monthly revenue | Gross, Tax, Net, Count |
| Product | By membership type | Revenue per product |
| Quarterly | Q1-Q4 comparison | Quarter-wise revenue |
| Member Status | Active/Expired breakdown | Count by status |
| Upcoming Renewals | Next 30 days | Members to renew |
| Accrual | Monthly recognition | Accrued vs Invoiced |

### 4. Member Lifecycle

**Status Transitions:**
```
NEW MEMBER ──▶ ACTIVE ──▶ EXPIRED
                 │            │
                 ▼            ▼
              RENEWED ◀──────┘
```

**Automatic Status Update:**
- ACTIVE: `membershipEndDate > today`
- EXPIRED: `membershipEndDate <= today`
- RENEWED: When new invoice uploaded for expired member

---

## 🎨 Frontend Components

### Layout Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Root Layout                              │
│  ┌────────────┐  ┌────────────────────────────────────────────┐ │
│  │            │  │           Dashboard Layout                  │ │
│  │  Sidebar   │  │  ┌────────────────────────────────────┐   │ │
│  │            │  │  │         Page Content               │   │ │
│  │ - Dashboard│  │  │                                    │   │ │
│  │ - Upload   │  │  │   - Stat Cards                     │   │ │
│  │ - Members  │  │  │   - Data Tables                    │   │ │
│  │ - Invoices │  │  │   - Charts                         │   │ │
│  │ - Reports  │  │  │   - Forms                          │   │ │
│  │ - Email    │  │  │                                    │   │ │
│  │ - Settings │  │  └────────────────────────────────────┘   │ │
│  │            │  │                                            │ │
│  │ [Logout]   │  │                                            │ │
│  └────────────┘  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | File | Description |
|-----------|------|-------------|
| Sidebar | `components/sidebar.tsx` | Navigation with role-based menu |
| StatCard | `components/stat-card.tsx` | Dashboard statistics card |
| Charts | `components/charts.tsx` | Revenue, Product, Status charts |
| Providers | `components/providers.tsx` | Session, Theme providers |

### State Management

- **Server State:** React Query / SWR (API caching)
- **Client State:** React useState/useEffect
- **Session State:** NextAuth useSession hook
- **URL State:** Next.js useSearchParams

---

## 🔧 Environment Setup

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@junobo.com"
```

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/balatechn/junobo-membership.git
cd junobo-membership

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Generate Prisma client
npx prisma generate

# 5. Push schema to database
npx prisma db push

# 6. Seed initial admin user (optional)
npx prisma db seed

# 7. Start development server
npm run dev
```

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Create migration
npx prisma migrate dev --name migration_name
```

---

## 🚀 Deployment

### Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod
```

### Environment Variables on Vercel

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| DATABASE_URL | Supabase connection string (pooler) |
| DIRECT_URL | Supabase direct connection string |
| NEXTAUTH_SECRET | Random 32+ character string |
| NEXTAUTH_URL | https://your-domain.vercel.app |

### Supabase Setup

1. Create project at supabase.com
2. Get connection strings from Settings → Database
3. Use **Transaction pooler** URL for `DATABASE_URL`
4. Use **Direct connection** URL for `DIRECT_URL`

### CI/CD Pipeline

```yaml
# GitHub Actions (auto-deploy on push)
# Vercel handles this automatically when connected to GitHub
```

---

## 📊 Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| API Caching | Cache-Control headers (30s dashboard, 10s users) |
| Client Caching | In-memory cache for dashboard (1 minute TTL) |
| DB Connection Pooling | Supabase PgBouncer |
| Package Optimization | Tree-shaking for lucide-react, date-fns |
| Session Caching | JWT with 30-day expiry |
| Parallel Queries | Promise.all for dashboard data |

---

## 🔒 Security Considerations

| Area | Implementation |
|------|----------------|
| Password Storage | bcrypt with 12 rounds |
| Session | HTTP-only JWT cookies |
| CSRF | NextAuth built-in protection |
| Input Validation | Server-side validation on all endpoints |
| SQL Injection | Prisma parameterized queries |
| XSS | React automatic escaping |
| RBAC | Role checks on all protected routes |

---

## 📝 API Error Handling

```typescript
// Standard error response format
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional info
}

// HTTP Status Codes
200 - Success
201 - Created
400 - Bad Request (validation error)
401 - Unauthorized (not logged in)
403 - Forbidden (insufficient permissions)
404 - Not Found
500 - Internal Server Error
```

---

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Build for production
npm run build

# Run linting
npm run lint
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

## 👥 Support

For questions or issues:
- Create a GitHub issue
- Contact: bala.techn@gmail.com

---

**Version:** 1.0.0  
**Last Updated:** January 29, 2026  
**Author:** Junobo Mumbai Development Team
