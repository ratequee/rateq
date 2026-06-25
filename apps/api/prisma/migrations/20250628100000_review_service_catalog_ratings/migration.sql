-- Point review service ratings at company catalog items (profile services), not category services.

ALTER TABLE "review_service_ratings" DROP CONSTRAINT IF EXISTS "review_service_ratings_category_service_id_fkey";
ALTER TABLE "review_service_ratings" DROP CONSTRAINT IF EXISTS "review_service_ratings_review_id_category_service_id_key";
DROP INDEX IF EXISTS "review_service_ratings_category_service_id_idx";

ALTER TABLE "review_service_ratings" RENAME COLUMN "category_service_id" TO "company_catalog_item_id";

ALTER TABLE "review_service_ratings"
  ADD CONSTRAINT "review_service_ratings_company_catalog_item_id_fkey"
  FOREIGN KEY ("company_catalog_item_id") REFERENCES "company_catalog_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_service_ratings"
  ADD CONSTRAINT "review_service_ratings_review_id_company_catalog_item_id_key"
  UNIQUE ("review_id", "company_catalog_item_id");

CREATE INDEX "review_service_ratings_company_catalog_item_id_idx"
  ON "review_service_ratings"("company_catalog_item_id");
