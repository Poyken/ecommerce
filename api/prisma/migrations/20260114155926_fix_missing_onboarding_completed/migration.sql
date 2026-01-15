/*
  Warnings:

  - You are about to drop the column `couponId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `Coupon` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[referralCode]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `CartItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `OptionValue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `OrderTaxDetail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PriceListItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ProductImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ProductOption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ProductToCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PromotionAction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PromotionRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `PromotionUsage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `SkuImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `SkuToOptionValue` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Coupon" DROP CONSTRAINT "Coupon_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_couponId_fkey";

-- DropIndex
DROP INDEX "Order_couponId_idx";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OptionValue" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "couponId";

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrderTaxDetail" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PriceListItem" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductToCategory" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PromotionAction" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PromotionRule" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PromotionUsage" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "SkuImage" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SkuToOptionValue" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxStaff" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "maxWarehouses" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trialDays" INTEGER NOT NULL DEFAULT 14,
ALTER COLUMN "currency" SET DEFAULT 'VND';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "businessSize" TEXT,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "currentProductCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentStaffCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentStorageUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyRevenue" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "productLimit" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredByCode" TEXT,
ADD COLUMN     "staffLimit" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "storageLimit" INTEGER NOT NULL DEFAULT 1024,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "Coupon";

-- DropEnum
DROP TYPE "DiscountType";

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "CartItem_tenantId_idx" ON "CartItem"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryItem_tenantId_idx" ON "InventoryItem"("tenantId");

-- CreateIndex
CREATE INDEX "OptionValue_tenantId_idx" ON "OptionValue"("tenantId");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_idx" ON "OrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "OrderTaxDetail_tenantId_idx" ON "OrderTaxDetail"("tenantId");

-- CreateIndex
CREATE INDEX "PriceListItem_tenantId_idx" ON "PriceListItem"("tenantId");

-- CreateIndex
CREATE INDEX "ProductImage_tenantId_idx" ON "ProductImage"("tenantId");

-- CreateIndex
CREATE INDEX "ProductOption_tenantId_idx" ON "ProductOption"("tenantId");

-- CreateIndex
CREATE INDEX "ProductToCategory_tenantId_idx" ON "ProductToCategory"("tenantId");

-- CreateIndex
CREATE INDEX "PromotionAction_tenantId_idx" ON "PromotionAction"("tenantId");

-- CreateIndex
CREATE INDEX "PromotionRule_tenantId_idx" ON "PromotionRule"("tenantId");

-- CreateIndex
CREATE INDEX "PromotionUsage_tenantId_idx" ON "PromotionUsage"("tenantId");

-- CreateIndex
CREATE INDEX "SkuImage_tenantId_idx" ON "SkuImage"("tenantId");

-- CreateIndex
CREATE INDEX "SkuToOptionValue_tenantId_idx" ON "SkuToOptionValue"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_referralCode_key" ON "Tenant"("referralCode");

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductToCategory" ADD CONSTRAINT "ProductToCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOption" ADD CONSTRAINT "ProductOption_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionValue" ADD CONSTRAINT "OptionValue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkuToOptionValue" ADD CONSTRAINT "SkuToOptionValue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRule" ADD CONSTRAINT "PromotionRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionAction" ADD CONSTRAINT "PromotionAction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionUsage" ADD CONSTRAINT "PromotionUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTaxDetail" ADD CONSTRAINT "OrderTaxDetail_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkuImage" ADD CONSTRAINT "SkuImage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
