-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "autoTags" TEXT[],
ADD COLUMN     "sentiment" "Sentiment";

-- CreateIndex
CREATE INDEX "Review_sentiment_idx" ON "Review"("sentiment");
