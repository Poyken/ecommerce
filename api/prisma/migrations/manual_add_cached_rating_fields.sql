-- Add cached rating fields to Product table for performance optimization
-- These fields are denormalized from Review table and updated via application logic

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "avgRating" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing data
UPDATE "Product" p SET 
  "avgRating" = COALESCE((SELECT AVG(rating) FROM "Review" WHERE "productId" = p.id AND "isApproved" = true), 0),
  "reviewCount" = (SELECT COUNT(*)::int FROM "Review" WHERE "productId" = p.id AND "isApproved" = true);
