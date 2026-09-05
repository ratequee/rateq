-- Backfill granular permissions from legacy CONTENT / DIRECTORY grants.
-- Separate migration so new enum values are committed before array updates.

UPDATE "users"
SET "admin_permissions" = ARRAY(
  SELECT DISTINCT perm::"AdminPermission"
  FROM unnest(
    "admin_permissions"
    || CASE
      WHEN 'CONTENT'::"AdminPermission" = ANY("admin_permissions")
        THEN ARRAY['CATEGORIES', 'BLOG', 'SETTINGS']::"AdminPermission"[]
      ELSE ARRAY[]::"AdminPermission"[]
    END
    || CASE
      WHEN 'DIRECTORY'::"AdminPermission" = ANY("admin_permissions")
        THEN ARRAY['PROJECTS']::"AdminPermission"[]
      ELSE ARRAY[]::"AdminPermission"[]
    END
  ) AS perm
  WHERE perm <> 'CONTENT'::"AdminPermission"
)
WHERE
  'CONTENT'::"AdminPermission" = ANY("admin_permissions")
  OR 'DIRECTORY'::"AdminPermission" = ANY("admin_permissions");
