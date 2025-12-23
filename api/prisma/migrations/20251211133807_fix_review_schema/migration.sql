/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId,skuId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Review_userId_productId_key";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "skuId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_productId_skuId_key" ON "Review"("userId", "productId", "skuId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE SET NULL ON UPDATE CASCADE;
