-- ============================================================
-- PERFORMANCE OPTIMIZATION: Advanced Full-Text Search
-- ============================================================

-- 1. Create a GIN index on Product Name and Description for fast search
-- We use 'simple' or 'english' configuration. 'simple' is often better for brand names.
-- Here we use 'english' to match Prisma's default behavior.

CREATE INDEX IF NOT EXISTS idx_product_search_name_gin ON "Product" USING GIN (to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_product_search_description_gin ON "Product" USING GIN (to_tsvector('english', coalesce(description, '')));

-- 2. Optional: Combined index for more complex searches
-- CREATE INDEX IF NOT EXISTS idx_product_search_combined_gin ON "Product" USING GIN (to_tsvector('english', name || ' ' || coalesce(description, '')));

ANALYZE "Product";
