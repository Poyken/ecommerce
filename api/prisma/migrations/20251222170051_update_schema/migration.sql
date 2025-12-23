-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "reply" TEXT,
ADD COLUMN     "replyAt" TIMESTAMP(3);
