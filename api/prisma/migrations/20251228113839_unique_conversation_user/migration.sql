/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `ChatConversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatConversation_userId_key" ON "ChatConversation"("userId");
