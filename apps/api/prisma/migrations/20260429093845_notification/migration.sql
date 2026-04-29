/*
  Warnings:

  - You are about to drop the column `taskId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the `SentNotificationLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_taskId_fkey";

-- DropForeignKey
ALTER TABLE "SentNotificationLog" DROP CONSTRAINT "SentNotificationLog_projectId_fkey";

-- DropForeignKey
ALTER TABLE "SentNotificationLog" DROP CONSTRAINT "SentNotificationLog_taskId_fkey";

-- DropIndex
DROP INDEX "Notification_taskId_isRead_deletedAt_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "taskId";

-- DropTable
DROP TABLE "SentNotificationLog";
