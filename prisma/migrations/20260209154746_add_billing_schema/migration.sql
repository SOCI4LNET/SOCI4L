/*
  Warnings:

  - You are about to drop the column `lumaConfig` on the `Profile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slugHash]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EmailSubscription" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Follow" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LinkCategory" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "lumaConfig",
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "premiumExpiresAt" TIMESTAMP(3),
ADD COLUMN     "premiumLastTxHash" TEXT,
ADD COLUMN     "primaryRole" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
ADD COLUMN     "secondaryRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slugClaimedAt" TIMESTAMP(3),
ADD COLUMN     "slugHash" TEXT,
ADD COLUMN     "statusMessage" TEXT,
ALTER COLUMN "claimedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProfileLink" RENAME CONSTRAINT "new_ProfileLink_pkey" TO "ProfileLink_pkey",
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ShowcaseItem" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformUsername" TEXT NOT NULL,
    "platformUserId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerAddress" TEXT NOT NULL,
    "blockedAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "linkId" TEXT,
    "linkTitle" TEXT,
    "linkUrl" TEXT,
    "categoryId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "referrer" TEXT,
    "country" TEXT,
    "device" TEXT,
    "visitorWallet" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tier" TEXT NOT NULL,
    "profileClaimed" INTEGER NOT NULL DEFAULT 0,
    "displayName" INTEGER NOT NULL DEFAULT 0,
    "bio" INTEGER NOT NULL DEFAULT 0,
    "socialLinks" INTEGER NOT NULL DEFAULT 0,
    "profileLinks" INTEGER NOT NULL DEFAULT 0,
    "followers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminAddress" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mute" (
    "id" TEXT NOT NULL,
    "muterAddress" TEXT NOT NULL,
    "mutedAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserList" (
    "id" TEXT NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserListMember" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "memberAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserListMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocsAdmin" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocsAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocsArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlugCooldown" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "slugHash" TEXT NOT NULL,
    "previousOwner" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "cooldownEndsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlugCooldown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "key" TEXT NOT NULL,
    "lastSyncedBlock" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialConnection_profileId_idx" ON "SocialConnection"("profileId");

-- CreateIndex
CREATE INDEX "SocialConnection_platformUsername_idx" ON "SocialConnection"("platformUsername");

-- CreateIndex
CREATE UNIQUE INDEX "SocialConnection_platform_platformUserId_key" ON "SocialConnection"("platform", "platformUserId");

-- CreateIndex
CREATE INDEX "UserActivityLog_profileId_idx" ON "UserActivityLog"("profileId");

-- CreateIndex
CREATE INDEX "UserActivityLog_createdAt_idx" ON "UserActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "Block_blockerAddress_idx" ON "Block"("blockerAddress");

-- CreateIndex
CREATE INDEX "Block_blockedAddress_idx" ON "Block"("blockedAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerAddress_blockedAddress_key" ON "Block"("blockerAddress", "blockedAddress");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_profileId_idx" ON "AnalyticsEvent"("profileId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_profileId_type_idx" ON "AnalyticsEvent"("profileId", "type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_linkId_idx" ON "AnalyticsEvent"("linkId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_profileId_idx" ON "ScoreSnapshot"("profileId");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_profileId_createdAt_idx" ON "ScoreSnapshot"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminAddress_idx" ON "AdminAuditLog"("adminAddress");

-- CreateIndex
CREATE INDEX "Mute_muterAddress_idx" ON "Mute"("muterAddress");

-- CreateIndex
CREATE INDEX "Mute_mutedAddress_idx" ON "Mute"("mutedAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Mute_muterAddress_mutedAddress_key" ON "Mute"("muterAddress", "mutedAddress");

-- CreateIndex
CREATE INDEX "UserList_creatorAddress_idx" ON "UserList"("creatorAddress");

-- CreateIndex
CREATE INDEX "UserListMember_listId_idx" ON "UserListMember"("listId");

-- CreateIndex
CREATE INDEX "UserListMember_memberAddress_idx" ON "UserListMember"("memberAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserListMember_listId_memberAddress_key" ON "UserListMember"("listId", "memberAddress");

-- CreateIndex
CREATE UNIQUE INDEX "DocsAdmin_address_key" ON "DocsAdmin"("address");

-- CreateIndex
CREATE INDEX "DocsAdmin_address_idx" ON "DocsAdmin"("address");

-- CreateIndex
CREATE UNIQUE INDEX "DocsArticle_slug_key" ON "DocsArticle"("slug");

-- CreateIndex
CREATE INDEX "DocsArticle_slug_idx" ON "DocsArticle"("slug");

-- CreateIndex
CREATE INDEX "DocsArticle_category_idx" ON "DocsArticle"("category");

-- CreateIndex
CREATE INDEX "DocsArticle_published_idx" ON "DocsArticle"("published");

-- CreateIndex
CREATE UNIQUE INDEX "SlugCooldown_slugHash_key" ON "SlugCooldown"("slugHash");

-- CreateIndex
CREATE INDEX "SlugCooldown_slugHash_idx" ON "SlugCooldown"("slugHash");

-- CreateIndex
CREATE INDEX "SlugCooldown_cooldownEndsAt_idx" ON "SlugCooldown"("cooldownEndsAt");

-- CreateIndex
CREATE INDEX "ProcessedEvent_txHash_idx" ON "ProcessedEvent"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEvent_txHash_logIndex_eventName_key" ON "ProcessedEvent"("txHash", "logIndex", "eventName");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_slugHash_key" ON "Profile"("slugHash");

-- CreateIndex
CREATE INDEX "Profile_isBanned_idx" ON "Profile"("isBanned");

-- CreateIndex
CREATE INDEX "ProfileLink_createdAt_idx" ON "ProfileLink"("createdAt");

-- AddForeignKey
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityLog" ADD CONSTRAINT "UserActivityLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserListMember" ADD CONSTRAINT "UserListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "UserList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocsArticle" ADD CONSTRAINT "DocsArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "DocsAdmin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
