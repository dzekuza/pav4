-- CreateTable
CREATE TABLE "domain_verifications" (
    "id" SERIAL NOT NULL,
    "businessId" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_connections" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpires" TIMESTAMP(3),
    "profile" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "id" SERIAL NOT NULL,
    "state" TEXT NOT NULL,
    "oauthToken" TEXT,
    "oauthSecret" TEXT,
    "provider" TEXT NOT NULL,
    "userId" INTEGER,
    "redirectUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_verifications_verificationToken_key" ON "domain_verifications"("verificationToken");

-- CreateIndex
CREATE INDEX "domain_verifications_businessId_idx" ON "domain_verifications"("businessId");

-- CreateIndex
CREATE INDEX "domain_verifications_domain_idx" ON "domain_verifications"("domain");

-- CreateIndex
CREATE INDEX "domain_verifications_verificationToken_idx" ON "domain_verifications"("verificationToken");

-- CreateIndex
CREATE INDEX "domain_verifications_status_idx" ON "domain_verifications"("status");

-- CreateIndex
CREATE INDEX "oauth_connections_provider_idx" ON "oauth_connections"("provider");

-- CreateIndex
CREATE INDEX "oauth_connections_userId_idx" ON "oauth_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_connections_userId_provider_key" ON "oauth_connections"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_states_state_key" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_provider_idx" ON "oauth_states"("provider");

-- CreateIndex
CREATE INDEX "oauth_states_state_idx" ON "oauth_states"("state");

-- CreateIndex
CREATE INDEX "oauth_states_userId_idx" ON "oauth_states"("userId");

-- CreateIndex
CREATE INDEX "commissions_status_paidAt_idx" ON "commissions"("status", "paidAt");

-- CreateIndex
CREATE INDEX "commissions_userId_status_idx" ON "commissions"("userId", "status");

-- CreateIndex
CREATE INDEX "favorites_userId_createdAt_idx" ON "favorites"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "sales_businessId_status_idx" ON "sales"("businessId", "status");

-- CreateIndex
CREATE INDEX "sales_createdAt_status_idx" ON "sales"("createdAt", "status");

-- CreateIndex
CREATE INDEX "sales_userId_createdAt_idx" ON "sales"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "search_history_userId_timestamp_idx" ON "search_history"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "tracking_events_affiliateId_timestamp_idx" ON "tracking_events"("affiliateId", "timestamp");

-- CreateIndex
CREATE INDEX "tracking_events_businessId_timestamp_idx" ON "tracking_events"("businessId", "timestamp");

-- CreateIndex
CREATE INDEX "tracking_events_eventType_timestamp_idx" ON "tracking_events"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "webhook_events_status_createdAt_idx" ON "webhook_events"("status", "createdAt");

-- CreateIndex
CREATE INDEX "webhook_events_webhookId_status_idx" ON "webhook_events"("webhookId", "status");

-- AddForeignKey
ALTER TABLE "domain_verifications" ADD CONSTRAINT "domain_verifications_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
