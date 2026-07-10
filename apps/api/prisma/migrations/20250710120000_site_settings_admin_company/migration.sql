-- AlterTable
ALTER TABLE "companies" ADD COLUMN "registered_by_admin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "facebook_url" TEXT,
    "twitter_url" TEXT,
    "youtube_url" TEXT,
    "linkedin_url" TEXT,
    "about_text_en" TEXT,
    "about_text_ar" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- Seed default row
INSERT INTO "site_settings" ("id", "address", "phone", "email", "website", "updated_at")
VALUES (
  'default',
  '40-44 Street, Doha',
  '+974 33044425',
  'support@RateQ.com',
  'https://www.rateq.qa/',
  CURRENT_TIMESTAMP
);
