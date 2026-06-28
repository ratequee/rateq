-- ReviewReply.updated_at was omitted from the prior migration on already-deployed databases.
ALTER TABLE "review_replies" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "review_replies" SET "updated_at" = "created_at" WHERE "updated_at" IS DISTINCT FROM "created_at";
