-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'PRODUCT', 'ORDER');

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';
