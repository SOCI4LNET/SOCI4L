-- CreateTable
CREATE TABLE "LinkCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "LinkCategory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
-- SQLite workaround replaced with Postgres ALTER TABLE
ALTER TABLE "ProfileLink" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LinkCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ProfileLink_categoryId_idx" ON "ProfileLink"("categoryId");


-- CreateIndex
CREATE INDEX "LinkCategory_profileId_idx" ON "LinkCategory"("profileId");

-- CreateIndex
CREATE INDEX "LinkCategory_profileId_isVisible_idx" ON "LinkCategory"("profileId", "isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "LinkCategory_profileId_slug_key" ON "LinkCategory"("profileId", "slug");
