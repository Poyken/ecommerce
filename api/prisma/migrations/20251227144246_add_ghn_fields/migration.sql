-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expectedDeliveryTime" TIMESTAMP(3),
ADD COLUMN     "ghnStatus" TEXT;

-- CreateIndex
CREATE INDEX "CartItem_skuId_idx" ON "CartItem"("skuId");

-- CreateIndex
CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");

-- CreateIndex
CREATE INDEX "Review_skuId_idx" ON "Review"("skuId");
