/*
  Warnings:

  - The primary key for the `legacy_search_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `legacy_search_history` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `search_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `search_history` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `search_history` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- CreateTable
CREATE TABLE "favorites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "price" TEXT,
    "currency" TEXT,
    "url" TEXT NOT NULL,
    "image" TEXT,
    "store" TEXT,
    "merchant" TEXT,
    "stock" TEXT,
    "rating" REAL,
    "reviewsCount" INTEGER,
    "deliveryPrice" TEXT,
    "details" TEXT,
    "returnPolicy" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'New',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_legacy_search_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_legacy_search_history" ("id", "timestamp", "url", "userKey") SELECT "id", "timestamp", "url", "userKey" FROM "legacy_search_history";
DROP TABLE "legacy_search_history";
ALTER TABLE "new_legacy_search_history" RENAME TO "legacy_search_history";
CREATE INDEX "legacy_search_history_userKey_idx" ON "legacy_search_history"("userKey");
CREATE INDEX "legacy_search_history_timestamp_idx" ON "legacy_search_history"("timestamp");
CREATE TABLE "new_search_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "search_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_search_history" ("id", "requestId", "timestamp", "title", "url", "userId") SELECT "id", "requestId", "timestamp", "title", "url", "userId" FROM "search_history";
DROP TABLE "search_history";
ALTER TABLE "new_search_history" RENAME TO "search_history";
CREATE INDEX "search_history_userId_idx" ON "search_history"("userId");
CREATE INDEX "search_history_timestamp_idx" ON "search_history"("timestamp");
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "isAdmin", "password", "updatedAt") SELECT "createdAt", "email", "id", "isAdmin", "password", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE INDEX "favorites_createdAt_idx" ON "favorites"("createdAt");
