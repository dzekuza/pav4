/*
  Warnings:

  - You are about to drop the column `user` on the `Conversion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[affiliateId]` on the `businesses` table will be added. If there are existing duplicate values, this will fail.

*/

-- First, add affiliateId as optional to businesses table
ALTER TABLE "businesses" ADD COLUMN "affiliateId" TEXT;

-- Generate affiliate IDs for existing businesses
UPDATE "businesses" SET "affiliateId" = 'PAV' || LPAD(id::text, 8, '0') WHERE "affiliateId" IS NULL;

-- Make affiliateId required
ALTER TABLE "businesses" ALTER COLUMN "affiliateId" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "businesses_affiliateId_key" ON "businesses"("affiliateId");

-- Add businessId and customerId to Conversion table (optional first)
ALTER TABLE "Conversion" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Conversion" ADD COLUMN "customerId" TEXT;

-- For existing conversions, we'll use a default business ID
-- This assumes the first business in the system
UPDATE "Conversion" SET "businessId" = (SELECT "affiliateId" FROM "businesses" LIMIT 1) WHERE "businessId" IS NULL;

-- Make businessId required
ALTER TABLE "Conversion" ALTER COLUMN "businessId" SET NOT NULL;

-- Drop the old user column
ALTER TABLE "Conversion" DROP COLUMN "user";

-- CreateIndex
CREATE INDEX "Conversion_businessId_idx" ON "Conversion"("businessId");

-- CreateIndex
CREATE INDEX "Conversion_timestamp_idx" ON "Conversion"("timestamp");
