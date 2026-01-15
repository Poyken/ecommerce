-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('REFUND_ONLY', 'RETURN_AND_REFUND', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnMethod" AS ENUM ('AT_COUNTER', 'PICKUP', 'SELF_SHIP');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('ORIGINAL_PAYMENT', 'BANK_TRANSFER', 'WALLET');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReturnStatus" ADD VALUE 'WAITING_FOR_RETURN';
ALTER TYPE "ReturnStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "ReturnStatus" ADD VALUE 'INSPECTING';

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "bankAccount" JSONB,
ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "inspectionNotes" TEXT,
ADD COLUMN     "pickupAddress" JSONB,
ADD COLUMN     "refundMethod" "RefundMethod" NOT NULL DEFAULT 'ORIGINAL_PAYMENT',
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "returnMethod" "ReturnMethod" NOT NULL DEFAULT 'SELF_SHIP',
ADD COLUMN     "trackingCode" TEXT,
ADD COLUMN     "type" "ReturnType" NOT NULL DEFAULT 'RETURN_AND_REFUND';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Tenant_deletedAt_idx" ON "Tenant"("deletedAt");

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
