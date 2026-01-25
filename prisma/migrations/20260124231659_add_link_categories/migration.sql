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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkCategory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProfileLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfileLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LinkCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProfileLink" ("createdAt", "enabled", "id", "order", "profileId", "title", "updatedAt", "url") SELECT "createdAt", "enabled", "id", "order", "profileId", "title", "updatedAt", "url" FROM "ProfileLink";
DROP TABLE "ProfileLink";
ALTER TABLE "new_ProfileLink" RENAME TO "ProfileLink";
CREATE INDEX "ProfileLink_profileId_idx" ON "ProfileLink"("profileId");
CREATE INDEX "ProfileLink_profileId_enabled_idx" ON "ProfileLink"("profileId", "enabled");
CREATE INDEX "ProfileLink_categoryId_idx" ON "ProfileLink"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LinkCategory_profileId_idx" ON "LinkCategory"("profileId");

-- CreateIndex
CREATE INDEX "LinkCategory_profileId_isVisible_idx" ON "LinkCategory"("profileId", "isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "LinkCategory_profileId_slug_key" ON "LinkCategory"("profileId", "slug");
