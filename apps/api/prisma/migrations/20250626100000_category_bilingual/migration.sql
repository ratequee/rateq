-- Bilingual category names (English + Arabic)
ALTER TABLE "categories" ADD COLUMN "name_en" TEXT;
ALTER TABLE "categories" ADD COLUMN "name_ar" TEXT;

UPDATE "categories" SET "name_en" = "name", "name_ar" = "name";

ALTER TABLE "categories" ALTER COLUMN "name_en" SET NOT NULL;
ALTER TABLE "categories" ALTER COLUMN "name_ar" SET NOT NULL;

ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";
ALTER TABLE "categories" DROP COLUMN "name";

CREATE UNIQUE INDEX "categories_name_en_key" ON "categories"("name_en");
