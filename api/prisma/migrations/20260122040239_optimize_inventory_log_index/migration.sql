-- CreateIndex
CREATE INDEX "InventoryLog_skuId_createdAt_idx" ON "InventoryLog"("skuId", "createdAt" DESC);
