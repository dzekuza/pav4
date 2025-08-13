-- CreateTable
CREATE TABLE "shopify_events" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL,
    "event_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "shopify_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_events_event_id_key" ON "shopify_events"("event_id");

-- CreateIndex
CREATE INDEX "shopify_events_event_id_idx" ON "shopify_events"("event_id");

-- CreateIndex
CREATE INDEX "shopify_events_shop_domain_idx" ON "shopify_events"("shop_domain");

-- CreateIndex
CREATE INDEX "shopify_events_topic_idx" ON "shopify_events"("topic");

-- CreateIndex
CREATE INDEX "shopify_events_event_type_idx" ON "shopify_events"("event_type");

-- CreateIndex
CREATE INDEX "shopify_events_triggered_at_idx" ON "shopify_events"("triggered_at");

-- CreateIndex
CREATE INDEX "shopify_events_processed_at_idx" ON "shopify_events"("processed_at");

-- CreateIndex
CREATE INDEX "shopify_events_shop_domain_topic_idx" ON "shopify_events"("shop_domain", "topic");

-- CreateIndex
CREATE INDEX "shopify_events_event_type_triggered_at_idx" ON "shopify_events"("event_type", "triggered_at");
