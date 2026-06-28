-- Review reply moderation
CREATE TYPE "ReviewReplyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "review_replies" ADD COLUMN "status" "ReviewReplyStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "review_replies" SET "status" = 'APPROVED';

ALTER TABLE "review_replies" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "review_replies" SET "updated_at" = "created_at";

-- Company social links & multi-category
ALTER TABLE "companies" ADD COLUMN "whatsapp_number" TEXT;
ALTER TABLE "companies" ADD COLUMN "instagram_url" TEXT;
ALTER TABLE "companies" ADD COLUMN "youtube_url" TEXT;
ALTER TABLE "companies" ADD COLUMN "facebook_url" TEXT;
ALTER TABLE "companies" ADD COLUMN "linkedin_url" TEXT;
ALTER TABLE "companies" ADD COLUMN "twitter_url" TEXT;
ALTER TABLE "companies" ADD COLUMN "category_ids" JSONB;

UPDATE "companies"
SET "category_ids" = jsonb_build_array("category_id")
WHERE "category_id" IS NOT NULL;

-- Expanded company projects
ALTER TABLE "company_projects" ADD COLUMN "slug" TEXT;
ALTER TABLE "company_projects" ADD COLUMN "description" TEXT;
ALTER TABLE "company_projects" ADD COLUMN "demo_images" JSONB;
ALTER TABLE "company_projects" ADD COLUMN "client_name" TEXT;
ALTER TABLE "company_projects" ADD COLUMN "location" TEXT;
ALTER TABLE "company_projects" ADD COLUMN "project_date" TIMESTAMP(3);
ALTER TABLE "company_projects" ADD COLUMN "service_ids" JSONB;

UPDATE "company_projects"
SET "slug" = LOWER(REGEXP_REPLACE(COALESCE("title", 'project'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING("id", 1, 6)
WHERE "slug" IS NULL;

ALTER TABLE "company_projects" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "company_projects_company_id_slug_key" ON "company_projects"("company_id", "slug");
