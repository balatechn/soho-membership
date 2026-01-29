-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGEMENT',
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "globalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "pinCode" TEXT,
    "state" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "product" TEXT,
    "membershipType" TEXT,
    "membershipStartDate" DATETIME,
    "membershipEndDate" DATETIME,
    "paymentStartDate" DATETIME,
    "paymentEndDate" DATETIME,
    "registration" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Mumbai'
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinCode" TEXT,
    "state" TEXT,
    "email" TEXT,
    "registration" TEXT,
    "membership" REAL NOT NULL DEFAULT 0,
    "membershipTotal" REAL NOT NULL DEFAULT 0,
    "cgst" REAL NOT NULL DEFAULT 0,
    "sgst" REAL NOT NULL DEFAULT 0,
    "igst" REAL NOT NULL DEFAULT 0,
    "totalTax" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "description1" TEXT,
    "description" TEXT,
    "membershipStartDate" DATETIME,
    "membershipEndDate" DATETIME,
    "paymentStartDate" DATETIME,
    "paymentEndDate" DATETIME,
    "type" TEXT,
    "renewalType" TEXT,
    "month" TEXT,
    "product" TEXT,
    "monthsTenure" INTEGER,
    "calculationMonth" INTEGER,
    "billingCycle" TEXT,
    "uploadMonth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "uploadMonth" TEXT NOT NULL,
    "recordsCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "errors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reportTypes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportType" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "dayOfMonth" INTEGER,
    "recipients" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" DATETIME,
    "nextRun" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Member_globalId_key" ON "Member"("globalId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNo_uploadMonth_key" ON "Invoice"("invoiceNo", "uploadMonth");
