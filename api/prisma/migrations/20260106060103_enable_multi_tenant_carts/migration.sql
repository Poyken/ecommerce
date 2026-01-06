/*
  Warnings:

  - A unique constraint covering the columns `[userId,tenantId]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Cart_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_tenantId_key" ON "Cart"("userId", "tenantId");
