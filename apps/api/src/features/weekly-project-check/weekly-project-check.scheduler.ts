import cron from 'node-cron';
import { config } from '../../config.js';
import { runWeeklyProjectCheckBatch } from './weekly-project-check.service.js';

let schedulerTask: cron.ScheduledTask | null = null;
let runInProgress = false;

export function startWeeklyProjectCheckScheduler(): void {
  if (!config.ENABLE_WEEKLY_PROJECT_CHECK_SCHEDULER) {
    console.log('[weekly-project-check] scheduler disabled (ENABLE_WEEKLY_PROJECT_CHECK_SCHEDULER=false)');
    return;
  }

  if (schedulerTask) {
    console.log('[weekly-project-check] scheduler already running');
    return;
  }

  schedulerTask = cron.schedule(
    config.WEEKLY_PROJECT_CHECK_CRON,
    () => {
      void runCycle('SCHEDULED');
    },
    {
      timezone: config.WEEKLY_PROJECT_CHECK_TIMEZONE,
    },
  );

  console.log(
    `[weekly-project-check] scheduler enabled cron="${config.WEEKLY_PROJECT_CHECK_CRON}" timezone="${config.WEEKLY_PROJECT_CHECK_TIMEZONE}"`,
  );
}

export function stopWeeklyProjectCheckScheduler(): void {
  if (!schedulerTask) return;

  schedulerTask.stop();
  schedulerTask.destroy();
  schedulerTask = null;
  console.log('[weekly-project-check] scheduler stopped');
}

export async function runWeeklyProjectCheckCycleOnce(projectId?: string) {
  return runCycle('MANUAL', projectId);
}

async function runCycle(triggerType: 'SCHEDULED' | 'MANUAL', projectId?: string) {
  if (runInProgress) {
    console.log('[weekly-project-check] previous cycle still running, skipping tick');
    return {
      checkedProjects: 0,
      successRuns: 0,
      skippedRuns: 0,
      failedRuns: 0,
      createdNotifications: 0,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      errors: ['Previous cycle still running'],
    };
  }

  runInProgress = true;
  try {
    const summary = await runWeeklyProjectCheckBatch({ triggerType, projectId });
    console.log(
      `[weekly-project-check] cycle complete trigger=${triggerType} projectId=${projectId ?? 'all'} projects=${summary.checkedProjects} success=${summary.successRuns} skipped=${summary.skippedRuns} failed=${summary.failedRuns} notifications=${summary.createdNotifications}`,
    );
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[weekly-project-check] cycle failed: ${message}`);
    throw error;
  } finally {
    runInProgress = false;
  }
}
