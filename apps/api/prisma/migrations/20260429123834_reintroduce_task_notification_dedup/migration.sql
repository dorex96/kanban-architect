-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "taskId" TEXT;

-- CreateTable
CREATE TABLE "SentNotificationLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sentDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentNotificationLog_projectId_idx" ON "SentNotificationLog"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SentNotificationLog_taskId_sentDate_key" ON "SentNotificationLog"("taskId", "sentDate");

-- CreateIndex
CREATE INDEX "Notification_taskId_isRead_deletedAt_idx" ON "Notification"("taskId", "isRead", "deletedAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentNotificationLog" ADD CONSTRAINT "SentNotificationLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentNotificationLog" ADD CONSTRAINT "SentNotificationLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
