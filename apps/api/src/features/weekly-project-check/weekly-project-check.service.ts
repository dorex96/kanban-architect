import { generateText } from 'ai';
import { config } from '../../config.js';
import { prisma } from '../../lib/prisma.js';
import { createNotification, listNotifications } from '../notifications/notifications.service.js';
import { getProject, listProjects } from '../projects/projects.service.js';
import { listTasks } from '../tasks/tasks.service.js';
import { ConfigurationError, getModel } from '../agent/providers/base.js';
import type { Project } from '@kanban/types';
import {
  buildWeeklyProjectCheckPrompt,
  buildWeeklyProjectCheckSystemPrompt,
} from './weekly-project-check.prompts.js';

type WeeklyCheckTriggerType = 'SCHEDULED' | 'MANUAL';
type WeeklyCheckRunStatus = 'SUCCESS' | 'ERROR' | 'SKIP';

export interface WeeklyProjectCheckBatchSummary {
  checkedProjects: number;
  successRuns: number;
  skippedRuns: number;
  failedRuns: number;
  createdNotifications: number;
  startedAt: string;
  finishedAt: string;
  errors: string[];
}

export interface WeeklyProjectCheckRunItem {
  id: string;
  projectId: string;
  triggerType: WeeklyCheckTriggerType;
  status: WeeklyCheckRunStatus;
  tasksAnalyzed: number;
  generatedText: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
}

export async function runWeeklyProjectCheckBatch(
  options: {
    triggerType?: WeeklyCheckTriggerType;
    projectId?: string;
  } = {},
): Promise<WeeklyProjectCheckBatchSummary> {
  const triggerType = options.triggerType ?? 'SCHEDULED';
  const startedAt = new Date();
  const summary: WeeklyProjectCheckBatchSummary = {
    checkedProjects: 0,
    successRuns: 0,
    skippedRuns: 0,
    failedRuns: 0,
    createdNotifications: 0,
    startedAt: startedAt.toISOString(),
    finishedAt: startedAt.toISOString(),
    errors: [],
  };

  const projects = options.projectId ? [await getProject(options.projectId)] : await listProjects();

  for (const project of projects) {
    summary.checkedProjects += 1;

    await runWeeklyProjectCheckForProject(project, triggerType, summary);
  }

  summary.finishedAt = new Date().toISOString();
  return summary;
}

export async function listWeeklyProjectCheckHistory(
  projectId: string,
  limit = config.WEEKLY_PROJECT_CHECK_HISTORY_LIMIT,
): Promise<WeeklyProjectCheckRunItem[]> {
  const rows = await prisma.weeklyProjectCheckRun.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    triggerType: row.triggerType,
    status: row.status,
    tasksAnalyzed: row.tasksAnalyzed,
    generatedText: row.generatedText,
    errorMessage: row.errorMessage,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }));
}

async function runWeeklyProjectCheckForProject(
  project: Project,
  triggerType: WeeklyCheckTriggerType,
  summary: WeeklyProjectCheckBatchSummary,
): Promise<void> {
  const projectRunStartedAt = new Date();
  try {
    const tasks = await listTasks(project.id);

    if (tasks.length === 0) {
      await createWeeklyRunLog({
        projectId: project.id,
        triggerType,
        status: 'SKIP',
        startedAt: projectRunStartedAt,
        finishedAt: new Date(),
        tasksAnalyzed: 0,
        generatedText: null,
        errorMessage: null,
      });
      summary.skippedRuns += 1;
      return;
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const overdueTasks = tasks.filter(
      (task) => task.status !== 'DONE' && Boolean(task.endDate) && new Date(task.endDate as string) < now,
    );

    const recentNotifications = (await listNotifications(project.id)).filter(
      (notification) => new Date(notification.createdAt) >= weekAgo,
    );

    const prompt = buildWeeklyProjectCheckPrompt(
      {
        projectName: project.name,
        periodStartIso: weekAgo.toISOString(),
        periodEndIso: now.toISOString(),
        tasks,
        overdueTasks,
        recentNotifications,
      },
      config.WEEKLY_PROJECT_CHECK_MAX_PROMPT_CHARS,
    );

    const text = await generateWeeklyTextWithRetry(prompt);
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('LLM returned an empty weekly project check report.');
    }

    const markdownMessage = formatWeeklyNotification(project.name, trimmedText, now);
    await createNotification(project.id, markdownMessage);

    await createWeeklyRunLog({
      projectId: project.id,
      triggerType,
      status: 'SUCCESS',
      startedAt: projectRunStartedAt,
      finishedAt: new Date(),
      tasksAnalyzed: tasks.length,
      generatedText: markdownMessage,
      errorMessage: null,
    });

    summary.successRuns += 1;
    summary.createdNotifications += 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    summary.failedRuns += 1;
    summary.errors.push(`Project ${project.id}: ${message}`);

    await createWeeklyRunLog({
      projectId: project.id,
      triggerType,
      status: 'ERROR',
      startedAt: projectRunStartedAt,
      finishedAt: new Date(),
      tasksAnalyzed: await safeTasksCount(project.id),
      generatedText: null,
      errorMessage: message,
    });
  }
}

async function generateWeeklyTextWithRetry(prompt: string): Promise<string> {
  const maxRetries = config.WEEKLY_PROJECT_CHECK_MAX_RETRIES;
  const delays = [
    config.WEEKLY_PROJECT_CHECK_RETRY_DELAY_MS,
    config.WEEKLY_PROJECT_CHECK_RETRY_SECOND_DELAY_MS,
  ];

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const { text } = await generateText({
        model: getModel(),
        system: buildWeeklyProjectCheckSystemPrompt(),
        prompt,
        maxTokens: config.WEEKLY_PROJECT_CHECK_MAX_OUTPUT_TOKENS,
        temperature: 0.2,
      });
      return text;
    } catch (error) {
      lastError = error;
      if (!isRetryableWeeklyCheckError(error) || attempt >= maxRetries) {
        break;
      }

      const delayMs = delays[attempt] ?? delays[delays.length - 1] ?? 0;
      if (delayMs > 0) {
        await delay(delayMs);
      }
      attempt += 1;
    }
  }

  throw lastError;
}

function isRetryableWeeklyCheckError(error: unknown): boolean {
  if (error instanceof ConfigurationError) return false;
  if (!(error instanceof Error)) return true;

  const message = error.message.toLowerCase();
  if (message.includes('api_key') || message.includes('api key') || message.includes('not set')) {
    return false;
  }

  return (
    message.includes('timeout') ||
    message.includes('rate') ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('network') ||
    message.includes('temporar')
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function safeTasksCount(projectId: string): Promise<number> {
  try {
    const tasks = await listTasks(projectId);
    return tasks.length;
  } catch {
    return 0;
  }
}

function formatWeeklyNotification(projectName: string, markdown: string, now: Date): string {
  const dateLabel = now.toISOString().slice(0, 10);

  return [
    `## Check Settimanale AI - ${projectName}`,
    `Periodo analizzato fino al ${dateLabel}`,
    '',
    markdown,
  ].join('\n');
}

async function createWeeklyRunLog(params: {
  projectId: string;
  triggerType: WeeklyCheckTriggerType;
  status: WeeklyCheckRunStatus;
  tasksAnalyzed: number;
  generatedText: string | null;
  errorMessage: string | null;
  startedAt: Date;
  finishedAt: Date;
}): Promise<void> {
  await prisma.weeklyProjectCheckRun.create({
    data: {
      projectId: params.projectId,
      triggerType: params.triggerType,
      status: params.status,
      tasksAnalyzed: params.tasksAnalyzed,
      generatedText: params.generatedText,
      errorMessage: params.errorMessage,
      startedAt: params.startedAt,
      finishedAt: params.finishedAt,
    },
  });
}
