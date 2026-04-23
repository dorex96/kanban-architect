-- CreateEnum
CREATE TYPE "WeeklyProjectCheckRunStatus" AS ENUM ('SUCCESS', 'ERROR', 'SKIP');

-- CreateEnum
CREATE TYPE "WeeklyProjectCheckTriggerType" AS ENUM ('SCHEDULED', 'MANUAL');

-- CreateTable
CREATE TABLE "WeeklyProjectCheckRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "triggerType" "WeeklyProjectCheckTriggerType" NOT NULL,
    "status" "WeeklyProjectCheckRunStatus" NOT NULL,
    "tasksAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "generatedText" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyProjectCheckRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyProjectCheckRun_projectId_idx" ON "WeeklyProjectCheckRun"("projectId");

-- CreateIndex
CREATE INDEX "WeeklyProjectCheckRun_createdAt_idx" ON "WeeklyProjectCheckRun"("createdAt");

-- AddForeignKey
ALTER TABLE "WeeklyProjectCheckRun" ADD CONSTRAINT "WeeklyProjectCheckRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
