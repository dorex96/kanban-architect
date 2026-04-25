-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_projectId_deletedAt_idx" ON "Notification"("projectId", "deletedAt");
