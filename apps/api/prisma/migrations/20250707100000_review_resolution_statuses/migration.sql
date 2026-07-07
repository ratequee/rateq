-- Add resolution outcome statuses for clearer reviewer/admin workflow labels
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'MODIFIED';
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';
ALTER TYPE "ReviewStatus" ADD VALUE IF NOT EXISTS 'PROCEEDED';

ALTER TYPE "ModerationAction" ADD VALUE IF NOT EXISTS 'RESOLUTION_MODIFIED';
