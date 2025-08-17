-- Add Shopify OAuth fields to businesses table
ALTER TABLE "businesses" ADD COLUMN "shopifyAccessToken" TEXT;
ALTER TABLE "businesses" ADD COLUMN "shopifyShop" TEXT;
ALTER TABLE "businesses" ADD COLUMN "shopifyScopes" TEXT;
ALTER TABLE "businesses" ADD COLUMN "shopifyConnectedAt" TIMESTAMP;

-- Add indexes for better performance
CREATE INDEX "businesses_shopifyShop_idx" ON "businesses"("shopifyShop");
CREATE INDEX "businesses_shopifyConnectedAt_idx" ON "businesses"("shopifyConnectedAt");
