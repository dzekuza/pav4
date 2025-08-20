-- CreateTable
CREATE TABLE "session_attributions" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "orderId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "businessDomain" TEXT,
    "shopDomain" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "customerEmail" TEXT,
    "customerId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_attributions_businessId_idx" ON "session_attributions"("businessId");

-- CreateIndex
CREATE INDEX "session_attributions_sessionId_idx" ON "session_attributions"("sessionId");

-- CreateIndex
CREATE INDEX "session_attributions_orderId_idx" ON "session_attributions"("orderId");

-- CreateIndex
CREATE INDEX "session_attributions_timestamp_idx" ON "session_attributions"("timestamp");

-- CreateIndex
CREATE INDEX "session_attributions_businessId_timestamp_idx" ON "session_attributions"("businessId", "timestamp");

-- CreateIndex
CREATE INDEX "session_attributions_utmSource_utmMedium_utmCampaign_idx" ON "session_attributions"("utmSource", "utmMedium", "utmCampaign");

-- AddForeignKey
ALTER TABLE "session_attributions" ADD CONSTRAINT "session_attributions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
