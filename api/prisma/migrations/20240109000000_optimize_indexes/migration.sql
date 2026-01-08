-- Create GIN Index for Product Full Text Search
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for Product Name and Description (Full Text Search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_product_full_text" 
ON "Product" 
USING GIN (to_tsvector('english', "name" || ' ' || coalesce("description", '')));

-- Covering Index for User Email Lookup (Optimizing Login)
-- Includes password, role, and tenantId to avoid heap fetch
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_email_lookup"
ON "User" ("email")
INCLUDE ("password", "role", "tenantId", "whitelistedIps", "permissions");

-- Optimizing Order Lookup by User (Covering Index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_order_user_lookup"
ON "Order" ("userId")
INCLUDE ("totalAmount", "status", "createdAt");
