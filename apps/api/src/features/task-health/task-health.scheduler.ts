import { config } from '../../config.js';
import { runTaskHealthCheck } from './task-health.service.js';

let schedulerTimer: NodeJS.Timeout | null = null;
let runInProgress = false;

export function startTaskHealthScheduler(): void {
  if (!config.ENABLE_TASK_HEALTH_SCHEDULER) {
    console.log('[task-health] scheduler disabled (ENABLE_TASK_HEALTH_SCHEDULER=false)');
    return;
  }

  if (schedulerTimer) {
    console.log('[task-health] scheduler already running');
    return;
  }

  console.log(
    `[task-health] scheduler enabled interval=${config.TASK_HEALTH_SCHEDULER_INTERVAL_MS}ms lookahead=${config.TASK_DEADLINE_LOOKAHEAD_HOURS}h`,
  );

  void runCycle();

  schedulerTimer = setInterval(() => {
    void runCycle();
  }, config.TASK_HEALTH_SCHEDULER_INTERVAL_MS);
}

export function stopTaskHealthScheduler(): void {
  if (!schedulerTimer) return;
  clearInterval(schedulerTimer);
  schedulerTimer = null;
  console.log('[task-health] scheduler stopped');
}

export async function runTaskHealthCycleOnce() {
  return runTaskHealthCheck();
}

async function runCycle(): Promise<void> {
  if (runInProgress) {
    console.log('[task-health] previous cycle still running, skipping tick');
    return;
  }

  runInProgress = true;
  try {
    const summary = await runTaskHealthCheck();
    console.log(
      `[task-health] cycle complete projects=${summary.checkedProjects} created=${summary.createdNotifications} deduped=${summary.dedupedNotifications} errors=${summary.errors.length}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[task-health] cycle failed: ${message}`);
  } finally {
    runInProgress = false;
  }
}
