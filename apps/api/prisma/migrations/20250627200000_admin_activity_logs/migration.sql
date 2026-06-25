CREATE TYPE "AdminActivityEntityType" AS ENUM (
  'COMPANY_VERIFICATION',
  'COMPANY_PROFILE_CHANGE',
  'REVIEW'
);

CREATE TYPE "AdminActivityAction" AS ENUM (
  'APPROVED',
  'REJECTED',
  'REVISION_REQUESTED',
  'RESOLVED',
  'DELETED'
);

CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "entity_type" "AdminActivityEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_label" TEXT NOT NULL,
    "action" "AdminActivityAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_activity_logs_created_at_idx" ON "admin_activity_logs"("created_at");
CREATE INDEX "admin_activity_logs_admin_id_created_at_idx" ON "admin_activity_logs"("admin_id", "created_at");
CREATE INDEX "admin_activity_logs_entity_type_entity_id_idx" ON "admin_activity_logs"("entity_type", "entity_id");

ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
