-- Quick fix: Manually clean slug from DB after successful on-chain release
-- Run this in Prisma Studio or via: npx prisma db execute --file scripts/fix-release-sync.sql

UPDATE "Profile" 
SET 
  slug = NULL,
  "slugHash" = NULL,
  "slugClaimedAt" = NULL
WHERE address = '0x26d3d5bb4da58309f3bd71714ad2317a2f31ec4d';

-- Verify
SELECT address, slug, "slugHash" FROM "Profile" 
WHERE address = '0x26d3d5bb4da58309f3bd71714ad2317a2f31ec4d';
