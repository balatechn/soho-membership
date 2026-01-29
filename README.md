# Junobo Mumbai - Membership & Revenue Management App

A comprehensive membership management system built with Next.js for Junobo Mumbai to manage member invoices, track revenue, and generate reports.

## Features

### 🔐 Authentication & Access Control
- Role-based access (Admin, Finance, Management)
- Secure login with NextAuth.js
- Protected routes with middleware

### 📊 Dashboard
- Total Members count with trend
- Monthly Revenue tracking
- Active vs Pending invoices
- Renewal status
- Revenue trend charts
- Product-wise revenue breakdown
- Membership type distribution
- Quarterly comparison charts

### 📤 Excel Upload Module
- Drag & drop Excel file upload
- Preview data before import
- Validation for mandatory fields
- Duplicate detection (Invoice No + Global ID)
- Auto-update member master

### 👥 Member Management
- Complete member directory
- Member status tracking (Active, Inactive, Expired, Suspended)
- Membership type categorization
- Invoice history per member
- Total revenue per member

### 📑 Invoice & Tax Management
- All invoice listing with filters
- Tax breakdowns (CGST 9% + SGST 9% = GST 18%)
- Export to Excel

### 📈 Revenue Reports
- Monthly summary reports
- Product-wise breakdown
- Membership type analysis
- Renewals vs New members
- State-wise tax reports
- Upcoming renewals (30/60/90 days)
- Quarterly comparisons
- Payment tracking

### 📧 Automated Email Reports
- Send reports with Excel attachments
- Multiple recipient support
- Configurable email settings

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma)
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Excel Processing**: xlsx
- **Email**: Nodemailer

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/junobo-membership.git
cd junobo-membership
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration.

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Seed the database with admin user:
```bash
npm run db:seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Default Login
- **Email**: admin@junobo.com
- **Password**: admin123

## Excel Upload Format

The system expects Excel files with the following columns:

| Column | Required |
|--------|----------|
| Invoice No | ✅ |
| Invoice Date | ✅ |
| Global ID | ✅ |
| First Name | ✅ |
| Last Name | |
| Membership Type | |
| House Account Code | |
| Product Code | |
| Product Name | |
| Payment Mode | |
| Net Amount | |
| CGST Rate (9%) | |
| CGST Amount | |
| SGST Rate (9%) | |
| SGST Amount | |
| Total Tax | |
| Total Amount | |
| Credit Period Start | |
| Credit Period End | |
| Due Date | |
| UTR / Transaction Ref | |
| Payment Received Date | |
| Payment Status | |
| Remarks | |
| State Code | |

## User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access to all features |
| Finance | Upload, view invoices/reports |
| Management | View-only access |

## Deployment to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
   - `DATABASE_URL`
4. Deploy!

> **Note**: For production, consider using a PostgreSQL database instead of SQLite.

## Future Enhancements

- [ ] Scheduled email reports (cron jobs)
- [ ] API integration for live data
- [ ] WhatsApp alerts for renewals
- [ ] Multi-property support
- [ ] Advanced analytics

## License

Private - Junobo Mumbai

## Support

For support, contact the IT team at Junobo Mumbai.
