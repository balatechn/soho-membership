# API Reference - Junobo Membership Management

## Base URL

```
Production: https://soho-membership.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

All protected endpoints require a valid session cookie. Sessions are managed by NextAuth.js using JWT tokens.

### Headers

```http
Cookie: next-auth.session-token=<JWT_TOKEN>
Content-Type: application/json
```

---

## 1. Authentication Endpoints

### POST /api/auth/callback/credentials

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "url": "http://localhost:3000/dashboard"
}
```

**Response (Error - 401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### GET /api/auth/session

Get current user session.

**Response (Authenticated - 200):**
```json
{
  "user": {
    "id": "clxyz123456789",
    "email": "admin@sohohouse.com",
    "name": "Admin User",
    "role": "ADMIN"
  },
  "expires": "2026-02-28T00:00:00.000Z"
}
```

**Response (Not Authenticated - 200):**
```json
{}
```

---

### POST /api/auth/signout

Logout current user.

**Response (Success - 200):**
```json
{
  "url": "http://localhost:3000/login"
}
```

---

### POST /api/auth/register

Register a new user.

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

**Response (Success - 201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clxyz123456789",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "MANAGEMENT"
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Email already exists"
}
```

---

## 2. Members Endpoints

### GET /api/members

List all members with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search by name, email, globalId |
| status | string | - | Filter by ACTIVE, EXPIRED, RENEWED |
| product | string | - | Filter by product type |

**Request:**
```http
GET /api/members?page=1&limit=20&status=ACTIVE&search=john
```

**Response (Success - 200):**
```json
{
  "members": [
    {
      "id": "clxyz123456789",
      "globalId": "MUM001234",
      "name": "John Doe",
      "email": "john@example.com",
      "state": "Maharashtra",
      "status": "ACTIVE",
      "product": "Local",
      "membershipType": "Annual",
      "membershipStartDate": "2026-01-01T00:00:00.000Z",
      "membershipEndDate": "2027-01-01T00:00:00.000Z",
      "location": "Mumbai",
      "createdAt": "2026-01-15T10:30:00.000Z",
      "_count": {
        "invoices": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13
  }
}
```

---

### GET /api/members/:id

Get single member details with invoices.

**Request:**
```http
GET /api/members/clxyz123456789
```

**Response (Success - 200):**
```json
{
  "id": "clxyz123456789",
  "globalId": "MUM001234",
  "name": "John Doe",
  "email": "john@example.com",
  "pinCode": "400001",
  "state": "Maharashtra",
  "status": "ACTIVE",
  "product": "Local",
  "membershipType": "Annual",
  "membershipStartDate": "2026-01-01T00:00:00.000Z",
  "membershipEndDate": "2027-01-01T00:00:00.000Z",
  "paymentStartDate": "2026-01-01T00:00:00.000Z",
  "paymentEndDate": "2027-01-01T00:00:00.000Z",
  "registration": "REG001234",
  "location": "Mumbai",
  "invoices": [
    {
      "id": "clinv123456789",
      "invoiceNo": "INV-2026-001",
      "invoiceDate": "2026-01-15T00:00:00.000Z",
      "totalAmount": 120000,
      "totalTax": 21600,
      "product": "Local",
      "uploadMonth": "2026-01"
    }
  ],
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

**Response (Error - 404):**
```json
{
  "error": "Member not found"
}
```

---

### PUT /api/members/:id

Update member details.

**Auth Required:** ADMIN, FINANCE

**Request:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "status": "RENEWED",
  "membershipEndDate": "2028-01-01T00:00:00.000Z"
}
```

**Response (Success - 200):**
```json
{
  "message": "Member updated successfully",
  "member": {
    "id": "clxyz123456789",
    "name": "John Updated",
    "email": "john.updated@example.com",
    "status": "RENEWED"
  }
}
```

---

### DELETE /api/members/:id

Delete a member (also deletes associated invoices).

**Auth Required:** ADMIN

**Response (Success - 200):**
```json
{
  "message": "Member deleted successfully"
}
```

---

## 3. Invoice Endpoints

### GET /api/invoices

List invoices with filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| month | string | - | Filter by uploadMonth (YYYY-MM) |
| search | string | - | Search by invoice number, member name |
| memberId | string | - | Filter by member ID |

**Request:**
```http
GET /api/invoices?month=2026-01&page=1&limit=50
```

**Response (Success - 200):**
```json
{
  "invoices": [
    {
      "id": "clinv123456789",
      "invoiceNo": "INV-2026-001",
      "invoiceDate": "2026-01-15T00:00:00.000Z",
      "name": "John Doe",
      "membership": 100000,
      "membershipTotal": 100000,
      "cgst": 9000,
      "sgst": 9000,
      "igst": 0,
      "totalTax": 18000,
      "totalAmount": 118000,
      "product": "Local",
      "renewalType": "Renewal",
      "monthsTenure": 12,
      "calculationMonth": 12,
      "uploadMonth": "2026-01",
      "member": {
        "id": "clxyz123456789",
        "globalId": "MUM001234",
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 55,
    "totalPages": 2
  },
  "summary": {
    "totalAmount": 5400000,
    "totalTax": 972000,
    "count": 55
  }
}
```

---

### POST /api/invoices/upload

Upload Excel file with invoice data.

**Auth Required:** ADMIN, FINANCE

**Content-Type:** multipart/form-data

**Request:**
```
file: <Excel File (.xlsx, .xls)>
month: 2026-01
```

**Expected Excel Columns:**
| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| Invoice No. | String | ✅ | Invoice number |
| Invoice Date | Date | ✅ | Invoice date |
| Global ID | String | ✅ | Member ID |
| Name | String | ✅ | Member name |
| State | String | ❌ | Member state |
| Email Id | String | ❌ | Member email |
| Registration | String | ❌ | Registration number |
| Membership | Number | ❌ | Base membership amount |
| Month Total | Number | ✅ | Total amount before tax |
| CGST 9% | Number | ❌ | CGST amount (9%) |
| SGST 9% | Number | ❌ | SGST amount (9%) |
| CGST 18% | Number | ❌ | CGST amount (18%) |
| SGST 18% | Number | ❌ | SGST amount (18%) |
| Total Tax | Number | ❌ | Total tax amount |
| Description | String | ❌ | Invoice description |
| Membership Start Date | Date | ❌ | Membership start |
| Membership End Date | Date | ❌ | Membership end |
| Payment Start Date | Date | ❌ | Payment period start |
| Payment End Date | Date | ❌ | Payment period end |
| Renewal/Quarterly | String | ❌ | Renewal type |
| Product | String | ❌ | Product type |
| Months | Number | ❌ | Membership tenure |
| Calculations of Month | Number | ❌ | Accrual spread months |

**Response (Success - 200):**
```json
{
  "message": "Upload successful",
  "stats": {
    "total": 55,
    "created": 50,
    "updated": 5,
    "errors": 0
  },
  "uploadLog": {
    "id": "cllog123456789",
    "fileName": "January_2026_Invoices.xlsx",
    "uploadMonth": "2026-01",
    "recordsCreated": 50,
    "recordsUpdated": 5
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Invalid file format",
  "details": "Please upload an Excel file (.xlsx or .xls)"
}
```

---

### DELETE /api/invoices

Delete all invoices for a specific month.

**Auth Required:** ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | string | ✅ | Month to delete (YYYY-MM) |

**Request:**
```http
DELETE /api/invoices?month=2026-01
```

**Response (Success - 200):**
```json
{
  "message": "Deleted 55 invoices for 2026-01"
}
```

---

## 4. Report Endpoints

### GET /api/reports

Get various reports based on type.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | ✅ | Report type |
| month | string | ❌ | Month (YYYY-MM) |
| year | number | ❌ | Year for quarterly reports |

**Report Types:**

#### Dashboard Report
```http
GET /api/reports?type=dashboard
```

**Response:**
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
      "renewed": 20,
      "upcomingRenewals": 15
    },
    "productDistribution": [
      { "product": "Local", "count": 120, "revenue": 2000000 },
      { "product": "Every House", "count": 80, "revenue": 1800000 },
      { "product": "Under 27", "count": 50, "revenue": 700000 }
    ],
    "monthlyTrend": [
      { "month": "Oct 2025", "revenue": 3800000 },
      { "month": "Nov 2025", "revenue": 4100000 },
      { "month": "Dec 2025", "revenue": 4200000 },
      { "month": "Jan 2026", "revenue": 4500000 }
    ]
  }
}
```

#### Summary Report
```http
GET /api/reports?type=summary&month=2026-01
```

**Response:**
```json
{
  "report": "Monthly Summary",
  "month": "2026-01",
  "data": {
    "grossRevenue": 4500000,
    "totalTax": 810000,
    "netRevenue": 3690000,
    "cgst": 405000,
    "sgst": 405000,
    "igst": 0,
    "invoiceCount": 55,
    "newMembers": 10,
    "renewals": 40,
    "averageInvoiceValue": 81818
  }
}
```

#### Product Report
```http
GET /api/reports?type=product&month=2026-01
```

**Response:**
```json
{
  "report": "Product-wise Revenue",
  "month": "2026-01",
  "data": [
    {
      "product": "Local",
      "invoiceCount": 25,
      "totalRevenue": 2000000,
      "totalTax": 360000,
      "averageValue": 80000
    },
    {
      "product": "Every House",
      "invoiceCount": 20,
      "totalRevenue": 1800000,
      "totalTax": 324000,
      "averageValue": 90000
    },
    {
      "product": "Under 27",
      "invoiceCount": 10,
      "totalRevenue": 700000,
      "totalTax": 126000,
      "averageValue": 70000
    }
  ]
}
```

#### Quarterly Report
```http
GET /api/reports?type=quarterly&year=2026
```

**Response:**
```json
{
  "report": "Quarterly Comparison",
  "year": 2026,
  "data": {
    "Q1": {
      "revenue": 13500000,
      "tax": 2430000,
      "invoices": 165,
      "months": {
        "Jan": 4500000,
        "Feb": 4400000,
        "Mar": 4600000
      }
    },
    "Q2": {
      "revenue": 0,
      "tax": 0,
      "invoices": 0,
      "months": {}
    },
    "Q3": {
      "revenue": 0,
      "tax": 0,
      "invoices": 0,
      "months": {}
    },
    "Q4": {
      "revenue": 0,
      "tax": 0,
      "invoices": 0,
      "months": {}
    },
    "yearTotal": 13500000
  }
}
```

#### Member Status Report
```http
GET /api/reports?type=member-status
```

**Response:**
```json
{
  "report": "Member Status",
  "data": {
    "total": 250,
    "byStatus": {
      "ACTIVE": 200,
      "EXPIRED": 30,
      "RENEWED": 20
    },
    "byProduct": {
      "Local": { "active": 100, "expired": 15, "renewed": 5 },
      "Every House": { "active": 60, "expired": 10, "renewed": 10 },
      "Under 27": { "active": 40, "expired": 5, "renewed": 5 }
    }
  }
}
```

#### Upcoming Renewals Report
```http
GET /api/reports?type=upcoming-renewals
```

**Response:**
```json
{
  "report": "Upcoming Renewals",
  "data": {
    "next7Days": [
      {
        "id": "clxyz123",
        "globalId": "MUM001234",
        "name": "John Doe",
        "email": "john@example.com",
        "membershipEndDate": "2026-02-05",
        "product": "Local",
        "daysRemaining": 5
      }
    ],
    "next30Days": [
      // ... members expiring in 8-30 days
    ],
    "summary": {
      "next7Days": 5,
      "next30Days": 15,
      "next90Days": 40
    }
  }
}
```

#### Accrual Report
```http
GET /api/reports?type=accrual&month=2026-01
```

**Response:**
```json
{
  "report": "Accrual Report",
  "month": "2026-01",
  "data": {
    "invoicedRevenue": 4500000,
    "invoicedTax": 810000,
    "accruedRevenue": 2200000,
    "accruedTax": 396000,
    "deferredRevenue": 2300000,
    "deferredTax": 414000,
    "accrualDetails": [
      {
        "invoiceNo": "INV-2026-001",
        "invoiceAmount": 120000,
        "monthlyAccrual": 10000,
        "calculationMonth": 12,
        "memberName": "John Doe"
      }
    ]
  }
}
```

---

### GET /api/reports/export

Export report to Excel file.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | ✅ | Report type to export |
| month | string | ❌ | Month (YYYY-MM) |

**Response:** Excel file download (.xlsx)

**Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## 5. User Management Endpoints

### GET /api/users

List all users (Admin only).

**Auth Required:** ADMIN

**Response (Success - 200):**
```json
{
  "users": [
    {
      "id": "clxyz123456789",
      "email": "admin@sohohouse.com",
      "name": "Admin User",
      "role": "ADMIN",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "clxyz987654321",
      "email": "finance@sohohouse.com",
      "name": "Finance User",
      "role": "FINANCE",
      "createdAt": "2026-01-10T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/users

Create new user (Admin only).

**Auth Required:** ADMIN

**Request:**
```json
{
  "email": "newuser@sohohouse.com",
  "password": "securePassword123",
  "name": "New User",
  "role": "FINANCE"
}
```

**Validation:**
- email: Required, valid email format, unique
- password: Required, minimum 6 characters
- name: Optional
- role: Required, one of "ADMIN", "FINANCE", "MANAGEMENT"

**Response (Success - 201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "clnew123456789",
    "email": "newuser@sohohouse.com",
    "name": "New User",
    "role": "FINANCE"
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Email already exists"
}
```

---

### GET /api/users/:id

Get single user details.

**Auth Required:** ADMIN

**Response (Success - 200):**
```json
{
  "id": "clxyz123456789",
  "email": "user@sohohouse.com",
  "name": "User Name",
  "role": "FINANCE",
  "createdAt": "2026-01-10T00:00:00.000Z",
  "updatedAt": "2026-01-20T00:00:00.000Z"
}
```

---

### PUT /api/users/:id

Update user details.

**Auth Required:** ADMIN

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@sohohouse.com",
  "password": "newPassword123",
  "role": "MANAGEMENT"
}
```

**Notes:**
- Password is optional (only updated if provided)
- Cannot demote yourself from ADMIN role
- Email must remain unique

**Response (Success - 200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "clxyz123456789",
    "email": "updated@sohohouse.com",
    "name": "Updated Name",
    "role": "MANAGEMENT"
  }
}
```

---

### DELETE /api/users/:id

Delete a user.

**Auth Required:** ADMIN

**Notes:**
- Cannot delete yourself

**Response (Success - 200):**
```json
{
  "message": "User deleted successfully"
}
```

**Response (Error - 400):**
```json
{
  "error": "Cannot delete your own account"
}
```

---

## 6. Email Endpoints

### POST /api/email

Send report via email.

**Auth Required:** ADMIN, FINANCE

**Request:**
```json
{
  "to": ["manager@sohohouse.com", "cfo@sohohouse.com"],
  "subject": "Monthly Revenue Report - January 2026",
  "reportType": "summary",
  "month": "2026-01",
  "includeAttachment": true
}
```

**Response (Success - 200):**
```json
{
  "message": "Email sent successfully",
  "recipients": ["manager@sohohouse.com", "cfo@sohohouse.com"]
}
```

**Response (Error - 500):**
```json
{
  "error": "Failed to send email",
  "details": "SMTP connection failed"
}
```

---

## Error Response Format

All API errors follow this format:

```json
{
  "error": "Human readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Not authenticated |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource |
| 500 | INTERNAL_ERROR | Server error |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding:
- 100 requests per minute for authenticated users
- 10 requests per minute for login attempts

---

## Versioning

Current API version: v1 (implicit in all endpoints)

Future versions will use URL prefix: `/api/v2/...`
