-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "resolution_requested_at" TIMESTAMP(3);

-- Existing reviews awaiting a window choice: start the 24h clock from last update
UPDATE "reviews"
SET "resolution_requested_at" = "updated_at"
WHERE "status" = 'RESOLUTION_PENDING'
  AND "resolution_deadline_at" IS NULL
  AND "resolution_requested_at" IS NULL;
