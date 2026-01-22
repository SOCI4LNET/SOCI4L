-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerAddress" TEXT NOT NULL,
    "followingAddress" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Follow_followerAddress_idx" ON "Follow"("followerAddress");

-- CreateIndex
CREATE INDEX "Follow_followingAddress_idx" ON "Follow"("followingAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerAddress_followingAddress_key" ON "Follow"("followerAddress", "followingAddress");
