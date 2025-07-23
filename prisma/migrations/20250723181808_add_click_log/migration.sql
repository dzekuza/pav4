-- CreateTable
CREATE TABLE "ClickLog" (
    "id" SERIAL NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "referrer" TEXT,
    "ip" TEXT,

    CONSTRAINT "ClickLog_pkey" PRIMARY KEY ("id")
);
