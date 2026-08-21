-- Convert legal text columns to JSON arrays of { id, title, description, sortOrder }.
-- Plain-text values that are not JSON arrays are cleared (fall back to built-in copy).

ALTER TABLE "site_settings"
  ALTER COLUMN "privacy_policy_en" TYPE JSONB
  USING (
    CASE
      WHEN "privacy_policy_en" IS NULL OR btrim("privacy_policy_en") = '' THEN NULL
      WHEN left(btrim("privacy_policy_en"), 1) = '[' THEN "privacy_policy_en"::jsonb
      ELSE NULL
    END
  );

ALTER TABLE "site_settings"
  ALTER COLUMN "privacy_policy_ar" TYPE JSONB
  USING (
    CASE
      WHEN "privacy_policy_ar" IS NULL OR btrim("privacy_policy_ar") = '' THEN NULL
      WHEN left(btrim("privacy_policy_ar"), 1) = '[' THEN "privacy_policy_ar"::jsonb
      ELSE NULL
    END
  );

ALTER TABLE "site_settings"
  ALTER COLUMN "terms_of_service_en" TYPE JSONB
  USING (
    CASE
      WHEN "terms_of_service_en" IS NULL OR btrim("terms_of_service_en") = '' THEN NULL
      WHEN left(btrim("terms_of_service_en"), 1) = '[' THEN "terms_of_service_en"::jsonb
      ELSE NULL
    END
  );

ALTER TABLE "site_settings"
  ALTER COLUMN "terms_of_service_ar" TYPE JSONB
  USING (
    CASE
      WHEN "terms_of_service_ar" IS NULL OR btrim("terms_of_service_ar") = '' THEN NULL
      WHEN left(btrim("terms_of_service_ar"), 1) = '[' THEN "terms_of_service_ar"::jsonb
      ELSE NULL
    END
  );
