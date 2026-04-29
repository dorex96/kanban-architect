-- AlterTable: add optional taskId to Notification for per-task deduplication
ALTER TABLE "Notification" ADD COLUMN "taskId" TEXT;

-- CreateIndex for fast pending-notification lookup by taskId
CREATE INDEX "Notification_taskId_isRead_deletedAt_idx" ON "Notification"("taskId", "isRead", "deletedAt");

-- AddForeignKey for Notification.taskId → Task
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: SentNotificationLog — immutable log used to enforce the daily-limit rule
CREATE TABLE "SentNotificationLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sentDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique per (taskId, date) to enforce one log entry per task per day
CREATE UNIQUE INDEX "SentNotificationLog_taskId_sentDate_key" ON "SentNotificationLog"("taskId", "sentDate");

-- CreateIndex
CREATE INDEX "SentNotificationLog_projectId_idx" ON "SentNotificationLog"("projectId");

-- AddForeignKey for SentNotificationLog.taskId → Task (cascade on task delete)
ALTER TABLE "SentNotificationLog" ADD CONSTRAINT "SentNotificationLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for SentNotificationLog.projectId → Project (cascade on project delete)
ALTER TABLE "SentNotificationLog" ADD CONSTRAINT "SentNotificationLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
