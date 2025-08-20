/*
  Warnings:

  - A unique constraint covering the columns `[neonUserId]` on the table `businesses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "neonUserId" TEXT,
ADD COLUMN     "shopifyAccessToken" TEXT,
ADD COLUMN     "shopifyConnectedAt" TIMESTAMP(3),
ADD COLUMN     "shopifyScopes" TEXT,
ADD COLUMN     "shopifyShop" TEXT,
ADD COLUMN     "shopifyStatus" TEXT DEFAULT 'disconnected';

-- CreateIndex
CREATE UNIQUE INDEX "businesses_neonUserId_key" ON "businesses"("neonUserId");
