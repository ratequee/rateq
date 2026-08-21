-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN "privacy_policy_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "privacy_policy_ar" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "terms_of_service_en" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "terms_of_service_ar" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill category order from creation time
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
  FROM "categories"
)
UPDATE "categories" c
SET "sort_order" = ordered.rn
FROM ordered
WHERE c.id = ordered.id;
