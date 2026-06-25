-- Granular admin permissions for delegated platform operators
CREATE TYPE "AdminPermission" AS ENUM (
  'STATS',
  'COMPANIES',
  'DIRECTORY',
  'MODERATION',
  'CONTENT',
  'INVITATIONS',
  'TEAM'
);

ALTER TABLE "users" ADD COLUMN "admin_permissions" "AdminPermission"[] NOT NULL DEFAULT ARRAY[]::"AdminPermission"[];

UPDATE "users"
SET "admin_permissions" = ARRAY['STATS','COMPANIES','DIRECTORY','MODERATION','CONTENT','INVITATIONS','TEAM']::"AdminPermission"[]
WHERE "role" = 'ADMIN';
