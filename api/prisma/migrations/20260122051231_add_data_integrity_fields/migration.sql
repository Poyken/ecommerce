-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "imageSnapshotUrl" TEXT;
