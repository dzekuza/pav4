/*
  Warnings:

  - Added the required column `email` to the `businesses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `businesses` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_businesses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "country" TEXT,
    "category" TEXT,
    "commission" REAL NOT NULL DEFAULT 0,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" REAL NOT NULL DEFAULT 0,
    "adminCommissionRate" REAL NOT NULL DEFAULT 5.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_businesses" ("address", "category", "commission", "contactEmail", "contactPhone", "country", "createdAt", "description", "domain", "id", "isActive", "isVerified", "logo", "name", "updatedAt", "website", "email", "password") SELECT "address", "category", "commission", "contactEmail", "contactPhone", "country", "createdAt", "description", "domain", "id", "isActive", "isVerified", "logo", "name", "updatedAt", "website", COALESCE("contactEmail", "domain" || "@example.com"), "defaultpassword123" FROM "businesses";
DROP TABLE "businesses";
ALTER TABLE "new_businesses" RENAME TO "businesses";
CREATE UNIQUE INDEX "businesses_domain_key" ON "businesses"("domain");
CREATE UNIQUE INDEX "businesses_email_key" ON "businesses"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
