/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tenantId` on table `Address` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Blog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Brand` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Cart` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Coupon` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `FeatureFlag` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `InventoryLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `NewsletterSubscriber` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Sku` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Wishlist` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Coupon" DROP CONSTRAINT "Coupon_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "FeatureFlag" DROP CONSTRAINT "FeatureFlag_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryLog" DROP CONSTRAINT "InventoryLog_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "NewsletterSubscriber" DROP CONSTRAINT "NewsletterSubscriber_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Sku" DROP CONSTRAINT "Sku_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_tenantId_fkey";

-- DropIndex
DROP INDEX "Product_categoryId_name_idx";

-- DropIndex
DROP INDEX "idx_product_active_category";

-- DropIndex
DROP INDEX "idx_product_category_brand_price";

-- DropIndex
DROP INDEX "idx_product_category_price";

-- DropIndex
DROP INDEX "Role_name_key";

-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Blog" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Brand" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Cart" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FeatureFlag" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventoryLog" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingAddressSnapshot" JSONB,
ALTER COLUMN "shippingAddress" DROP NOT NULL,
ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "skuNameSnapshot" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "categoryId",
ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "Sku" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Wishlist" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateTable
CREATE TABLE "ProductToCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ProductToCategory_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductToCategory_categoryId_idx" ON "ProductToCategory"("categoryId");

-- CreateIndex
CREATE INDEX "ProductToCategory_productId_idx" ON "ProductToCategory"("productId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "AuditLog_payload_idx" ON "AuditLog" USING GIN ("payload");

-- CreateIndex
CREATE INDEX "Blog_tenantId_category_idx" ON "Blog"("tenantId", "category");

-- CreateIndex
CREATE INDEX "Blog_tenantId_publishedAt_idx" ON "Blog"("tenantId", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Brand_tenantId_createdAt_idx" ON "Brand"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Category_tenantId_parentId_idx" ON "Category"("tenantId", "parentId");

-- CreateIndex
CREATE INDEX "Category_tenantId_createdAt_idx" ON "Category"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_brand_price" ON "Product"("brandId", "minPrice", "maxPrice", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_price_range" ON "Product"("minPrice", "maxPrice", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_product_active" ON "Product"("deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Product_metadata_idx" ON "Product" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "Product_tenantId_deletedAt_idx" ON "Product"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_tenantId_brandId_deletedAt_idx" ON "Product"("tenantId", "brandId", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_tenantId_minPrice_maxPrice_deletedAt_idx" ON "Product"("tenantId", "minPrice", "maxPrice", "deletedAt");

-- CreateIndex
CREATE INDEX "Review_tenantId_productId_isApproved_createdAt_idx" ON "Review"("tenantId", "productId", "isApproved", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_name_key" ON "Role"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Sku_metadata_idx" ON "Sku" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "Sku_tenantId_productId_status_idx" ON "Sku"("tenantId", "productId", "status");

-- CreateIndex
CREATE INDEX "User_tenantId_createdAt_idx" ON "User"("tenantId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Wishlist_tenantId_userId_createdAt_idx" ON "Wishlist"("tenantId", "userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductToCategory" ADD CONSTRAINT "ProductToCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductToCategory" ADD CONSTRAINT "ProductToCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
