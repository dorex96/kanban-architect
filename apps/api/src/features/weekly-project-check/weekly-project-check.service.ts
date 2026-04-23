import { generateText } from 'ai';
import { config } from '../../config.js';
import { prisma } from '../../lib/prisma.js';
import { createNotification, listNotifications } from '../notifications/notifications.service.js';
import { listProjects } from '../projects/projects.service.js';
import { listTasks } from '../tasks/tasks.service.js';
import { getModel } from '../agent/providers/base.js';
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

export async function runWeeklyProjectCheckBatch(
  triggerType: WeeklyCheckTriggerType = 'SCHEDULED',
): Promise<WeeklyProjectCheckBatchSummary> {
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

  const projects = await listProjects();

  for (const project of projects) {
    summary.checkedProjects += 1;

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
        continue;
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

      const { text } = await generateText({
        model: getModel(),
        system: buildWeeklyProjectCheckSystemPrompt(),
        prompt,
        maxTokens: config.WEEKLY_PROJECT_CHECK_MAX_OUTPUT_TOKENS,
        temperature: 0.2,
      });

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

  summary.finishedAt = new Date().toISOString();
  return summary;
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
