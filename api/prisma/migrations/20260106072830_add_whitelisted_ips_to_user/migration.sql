-- AlterTable
ALTER TABLE "User" ADD COLUMN     "whitelistedIps" JSONB DEFAULT '[]';
