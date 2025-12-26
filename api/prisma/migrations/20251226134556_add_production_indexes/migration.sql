-- DropIndex
DROP INDEX "Order_userId_status_idx";

-- DropIndex
DROP INDEX "Product_brandId_idx";

-- DropIndex
DROP INDEX "Product_categoryId_brandId_minPrice_maxPrice_idx";

-- DropIndex
DROP INDEX "Product_createdAt_idx";

-- DropIndex
DROP INDEX "Product_minPrice_maxPrice_idx";

-- CreateIndex
CREATE INDEX "idx_order_user_history" ON "Order"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_order_user_status" ON "Order"("userId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_order_status_date" ON "Order"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_order_payment_created" ON "Order"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "idx_order_shipping_code" ON "Order"("shippingCode");

-- CreateIndex
CREATE INDEX "idx_product_category_brand_price" ON "Product"("categoryId", "brandId", "minPrice", "maxPrice", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_category_price" ON "Product"("categoryId", "minPrice", "maxPrice", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_brand_created" ON "Product"("brandId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_price_asc" ON "Product"("minPrice", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_price_desc" ON "Product"("maxPrice" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_active_category" ON "Product"("deletedAt", "categoryId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_rating" ON "Product"("avgRating" DESC, "reviewCount" DESC);
