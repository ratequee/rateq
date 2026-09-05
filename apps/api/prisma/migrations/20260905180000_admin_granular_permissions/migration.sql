-- Split CONTENT / DIRECTORY into per-sidebar permissions so each admin section
-- can be granted independently.
ALTER TYPE "AdminPermission" ADD VALUE 'CATEGORIES';
ALTER TYPE "AdminPermission" ADD VALUE 'BLOG';
ALTER TYPE "AdminPermission" ADD VALUE 'SETTINGS';
ALTER TYPE "AdminPermission" ADD VALUE 'PROJECTS';
