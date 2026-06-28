-- Company project moderation and custom services
CREATE TYPE "CompanyProjectStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "company_projects" ADD COLUMN "status" "CompanyProjectStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "company_projects" SET "status" = 'APPROVED';

ALTER TABLE "company_projects" ADD COLUMN "custom_services" JSONB;

CREATE INDEX "company_projects_status_idx" ON "company_projects"("status");
