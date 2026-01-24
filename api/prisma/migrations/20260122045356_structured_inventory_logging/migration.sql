-- CreateEnum
CREATE TYPE "InventoryLogType" AS ENUM ('ADJUSTMENT', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN', 'PURCHASE', 'STOCKTAKE');

-- AlterTable
ALTER TABLE "InventoryLog" ADD COLUMN     "actionType" "InventoryLogType" NOT NULL DEFAULT 'ADJUSTMENT',
ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE INDEX "InventoryLog_actionType_idx" ON "InventoryLog"("actionType");
