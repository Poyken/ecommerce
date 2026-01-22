-- CreateIndex
CREATE INDEX "CartItem_tenantId_cartId_idx" ON "CartItem"("tenantId", "cartId");

-- CreateIndex
CREATE INDEX "CartItem_tenantId_skuId_idx" ON "CartItem"("tenantId", "skuId");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_orderId_idx" ON "OrderItem"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "OrderItem_tenantId_skuId_idx" ON "OrderItem"("tenantId", "skuId");
