-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "maxPrice" DECIMAL(10,2),
ADD COLUMN     "minPrice" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Product_minPrice_maxPrice_idx" ON "Product"("minPrice", "maxPrice");
