import type { Task } from '@kanban/types';
import { config } from '../../config.js';
import {
  createNotification,
  hasDailyTaskNotification,
  hasPendingTaskNotification,
  hasRecentNotification,
  toDateString,
} from '../notifications/notifications.service.js';
import { listProjects } from '../projects/projects.service.js';
import { listTasks } from '../tasks/tasks.service.js';

interface TaskHealthSignalThresholds {
  deadlineLookaheadHours: number;
  workloadOpenThreshold: number;
  workloadInProgressThreshold: number;
  dedupeWindowHours: number;
}

export interface TaskHealthCheckSummary {
  checkedProjects: number;
  createdNotifications: number;
  dedupedNotifications: number;
  errors: string[];
  startedAt: string;
  finishedAt: string;
}

const DONE_STATUS = 'DONE';

export async function runTaskHealthCheck(
  thresholds: TaskHealthSignalThresholds = {
    deadlineLookaheadHours: config.TASK_DEADLINE_LOOKAHEAD_HOURS,
    workloadOpenThreshold: config.TASK_WORKLOAD_OPEN_THRESHOLD,
    workloadInProgressThreshold: config.TASK_WORKLOAD_IN_PROGRESS_THRESHOLD,
    dedupeWindowHours: config.TASK_HEALTH_DEDUPE_WINDOW_HOURS,
  },
): Promise<TaskHealthCheckSummary> {
  const startedAt = new Date();
  const summary: TaskHealthCheckSummary = {
    checkedProjects: 0,
    createdNotifications: 0,
    dedupedNotifications: 0,
    errors: [],
    startedAt: startedAt.toISOString(),
    finishedAt: startedAt.toISOString(),
  };

  const dedupeSince = new Date(startedAt.getTime() - thresholds.dedupeWindowHours * 60 * 60 * 1000);
  const deadlineLimit = new Date(startedAt.getTime() + thresholds.deadlineLookaheadHours * 60 * 60 * 1000);

  const projects = await listProjects();

  for (const project of projects) {
    summary.checkedProjects += 1;

    try {
      const tasks = await listTasks(project.id);
      const openTasks = tasks.filter((task) => task.status !== DONE_STATUS);

      for (const task of openTasks) {
        if (!task.endDate) continue;
        const dueDate = new Date(task.endDate);
        if (Number.isNaN(dueDate.getTime())) continue;

        if (dueDate < startedAt) {
          const overdueHours = Math.max(1, Math.round((startedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60)));
          const message = `Task "${task.title}" is overdue by ${overdueHours}h (due ${dueDate.toISOString()}).`;
          const created = await createDedupedNotification(project.id, message, dedupeSince, task.id);
          if (created) summary.createdNotifications += 1;
          else summary.dedupedNotifications += 1;
          continue;
        }

        if (dueDate <= deadlineLimit) {
          const hoursLeft = Math.max(1, Math.round((dueDate.getTime() - startedAt.getTime()) / (1000 * 60 * 60)));
          const message = `Task "${task.title}" is due in ${hoursLeft}h (${dueDate.toISOString()}).`;
          const created = await createDedupedNotification(project.id, message, dedupeSince, task.id);
          if (created) summary.createdNotifications += 1;
          else summary.dedupedNotifications += 1;
        }
      }

      const inProgressTasks = openTasks.filter((task) => task.status === 'IN_PROGRESS');
      if (openTasks.length >= thresholds.workloadOpenThreshold) {
        const message = buildWorkloadOpenMessage(openTasks.length, thresholds.workloadOpenThreshold);
        const created = await createDedupedNotification(project.id, message, dedupeSince);
        if (created) summary.createdNotifications += 1;
        else summary.dedupedNotifications += 1;
      }

      if (inProgressTasks.length >= thresholds.workloadInProgressThreshold) {
        const message = buildWorkloadInProgressMessage(
          inProgressTasks.length,
          thresholds.workloadInProgressThreshold,
        );
        const created = await createDedupedNotification(project.id, message, dedupeSince);
        if (created) summary.createdNotifications += 1;
        else summary.dedupedNotifications += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(`Project ${project.id}: ${message}`);
    }
  }

  summary.finishedAt = new Date().toISOString();
  return summary;
}

function buildWorkloadOpenMessage(openCount: number, threshold: number): string {
  return `Workload alert: ${openCount} open tasks (threshold ${threshold}). Consider reducing backlog size.`;
}

function buildWorkloadInProgressMessage(inProgressCount: number, threshold: number): string {
  return `Workload alert: ${inProgressCount} tasks in progress (threshold ${threshold}). Consider splitting or reprioritizing active work.`;
}

async function createDedupedNotification(
  projectId: string,
  message: string,
  dedupeSince: Date,
  taskId?: string,
): Promise<boolean> {
  if (taskId) {
    const isPending = await hasPendingTaskNotification(taskId);
    if (isPending) return false;

    const today = toDateString(new Date());
    const sentToday = await hasDailyTaskNotification(taskId, today);
    if (sentToday) return false;

    await createNotification(projectId, message, taskId);
    return true;
  }

  // Workload alerts (project-level, no specific task): keep time-window dedup by message text.
  const alreadyNotified = await hasRecentNotification(projectId, message, dedupeSince);
  if (alreadyNotified) return false;

  await createNotification(projectId, message);
  return true;
}

export function selectOverdueTasks(tasks: Task[], now: Date): Task[] {
  return tasks.filter((task) => task.status !== DONE_STATUS && Boolean(task.endDate) && new Date(task.endDate as string) < now);
}
