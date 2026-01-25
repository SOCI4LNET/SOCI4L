-- CreateTable
CREATE TABLE "EmailSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailSubscription_email_key" ON "EmailSubscription"("email");

-- CreateIndex
CREATE INDEX "EmailSubscription_email_idx" ON "EmailSubscription"("email");
