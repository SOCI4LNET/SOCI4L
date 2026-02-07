-- Clean all slug data from database
UPDATE "Profile" SET 
  slug = NULL, 
  "slugHash" = NULL, 
  "slugClaimedAt" = NULL
WHERE slug IS NOT NULL;

-- Clear all cooldowns
DELETE FROM "SlugCooldown";

-- Verify cleanup
SELECT address, slug, "slugHash" FROM "Profile" WHERE slug IS NOT NULL;
