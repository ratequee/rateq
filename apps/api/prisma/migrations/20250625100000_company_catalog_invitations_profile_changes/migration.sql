-- CreateEnum
CREATE TYPE "CompanyProfileChangeStatus" AS ENUM ('NONE', 'PENDING');
CREATE TYPE "CompanyCatalogType" AS ENUM ('SERVICE', 'ACTIVITY');
CREATE TYPE "InvitationType" AS ENUM ('COMPANY', 'REVIEWER');

-- AlterTable companies
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "name_ar" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "description_en" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "description_ar" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "profile_change_status" "CompanyProfileChangeStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "pending_profile_changes" JSONB;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "service_ids" JSONB;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "activity_ids" JSONB;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "years_established" INTEGER;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "public_project_count" INTEGER;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "private_project_count" INTEGER;

-- Backfill description_en from description
UPDATE "companies" SET "description_en" = "description" WHERE "description_en" IS NULL AND "description" IS NOT NULL;

-- CreateTable company_catalog_items
CREATE TABLE IF NOT EXISTS "company_catalog_items" (
    "id" TEXT NOT NULL,
    "type" "CompanyCatalogType" NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "company_catalog_items_type_is_active_sort_order_idx" ON "company_catalog_items"("type", "is_active", "sort_order");

-- CreateTable user_invitations
CREATE TABLE IF NOT EXISTS "user_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "InvitationType" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "company_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_invitations_token_hash_key" ON "user_invitations"("token_hash");
CREATE INDEX IF NOT EXISTS "user_invitations_email_idx" ON "user_invitations"("email");
CREATE INDEX IF NOT EXISTS "user_invitations_type_expires_at_idx" ON "user_invitations"("type", "expires_at");

ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
