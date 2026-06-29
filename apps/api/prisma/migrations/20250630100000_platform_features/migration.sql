-- Category icons
ALTER TABLE "categories" ADD COLUMN "icon_url" TEXT;

-- Category subcategories
CREATE TABLE "category_subcategories" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_subcategories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "category_subcategories_category_id_slug_key" ON "category_subcategories"("category_id", "slug");
CREATE INDEX "category_subcategories_category_id_sort_order_idx" ON "category_subcategories"("category_id", "sort_order");

ALTER TABLE "category_subcategories" ADD CONSTRAINT "category_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Company subcategories and verified stamp
ALTER TABLE "companies" ADD COLUMN "subcategory_ids" JSONB;
ALTER TABLE "companies" ADD COLUMN "show_verified_stamp" BOOLEAN NOT NULL DEFAULT false;

-- Company favorites
CREATE TABLE "company_favorites" (
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_favorites_pkey" PRIMARY KEY ("user_id","company_id")
);

CREATE INDEX "company_favorites_company_id_idx" ON "company_favorites"("company_id");

ALTER TABLE "company_favorites" ADD CONSTRAINT "company_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_favorites" ADD CONSTRAINT "company_favorites_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Review reports
CREATE TYPE "ReviewReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "review_reports" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT,
    "status" "ReviewReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_reports_review_id_idx" ON "review_reports"("review_id");
CREATE INDEX "review_reports_status_created_at_idx" ON "review_reports"("status", "created_at");

ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Reviewer invitation requests
CREATE TYPE "ReviewerInvitationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "reviewer_invitation_requests" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "service_provided" TEXT NOT NULL,
    "proof_urls" JSONB NOT NULL DEFAULT '[]',
    "status" "ReviewerInvitationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" TEXT,

    CONSTRAINT "reviewer_invitation_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reviewer_invitation_requests_company_id_status_idx" ON "reviewer_invitation_requests"("company_id", "status");
CREATE INDEX "reviewer_invitation_requests_status_created_at_idx" ON "reviewer_invitation_requests"("status", "created_at");

ALTER TABLE "reviewer_invitation_requests" ADD CONSTRAINT "reviewer_invitation_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviewer_invitation_requests" ADD CONSTRAINT "reviewer_invitation_requests_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Admin activity entity types
ALTER TYPE "AdminActivityEntityType" ADD VALUE IF NOT EXISTS 'REVIEW_REPORT';
ALTER TYPE "AdminActivityEntityType" ADD VALUE IF NOT EXISTS 'REVIEWER_INVITATION_REQUEST';
