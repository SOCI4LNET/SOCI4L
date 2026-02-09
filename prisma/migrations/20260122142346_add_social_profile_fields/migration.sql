-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "slug" TEXT,
    "owner" TEXT,
    "ownerAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNCLAIMED',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP,
    "displayName" TEXT,
    "bio" TEXT,
    "socialLinks" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "ShowcaseItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShowcaseItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_address_key" ON "Profile"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");

-- CreateIndex
CREATE INDEX "Profile_address_idx" ON "Profile"("address");

-- CreateIndex
CREATE INDEX "Profile_slug_idx" ON "Profile"("slug");

-- CreateIndex
CREATE INDEX "Profile_owner_idx" ON "Profile"("owner");

-- CreateIndex
CREATE INDEX "Profile_ownerAddress_idx" ON "Profile"("ownerAddress");

-- CreateIndex
CREATE INDEX "ShowcaseItem_profileId_idx" ON "ShowcaseItem"("profileId");
