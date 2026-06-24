-- AlterTable
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "resolution_window_days" INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "resolution_deadline_at" TIMESTAMP(3);
