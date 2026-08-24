-- Align company_projects with Prisma CompanyProject.projectUrl
ALTER TABLE "company_projects" ADD COLUMN IF NOT EXISTS "project_url" TEXT NOT NULL DEFAULT '';
