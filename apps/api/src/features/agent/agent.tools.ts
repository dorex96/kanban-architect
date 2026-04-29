import { tool } from 'ai';
import { z } from 'zod';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
} from '../tasks/tasks.service.js';
import { listProjects, createProject } from '../projects/projects.service.js';
import { createNotification } from '../notifications/notifications.service.js';

const taskStatusEnum = z.enum(['INBOX', 'TODO', 'IN_PROGRESS', 'DONE']);
const taskPrioritySchema = z.number().int().min(1).max(5);
const taskDateSchema = z.string().datetime().nullable();

export function createAgentTools(projectId: string) {
  return {
    list_tasks: tool({
      description: 'List all tasks in the current project, grouped by status.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const tasks = await listTasks(projectId);
          return { success: true as const, tasks };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    create_task: tool({
      description:
        'Create a new task in the INBOX column. You can optionally set priority and ISO datetime schedule fields.',
      parameters: z.object({
        title: z.string().describe('Title of the task'),
        description: z.string().optional().describe('Optional task description'),
        priority: taskPrioritySchema.optional().describe('Optional priority from 1 (highest) to 5 (lowest)'),
        startDate: taskDateSchema.optional().describe('Optional ISO datetime start date, or null to leave unset'),
        endDate: taskDateSchema.optional().describe('Optional ISO datetime end date, or null to leave unset'),
      }),
      execute: async ({ title, description, priority, startDate, endDate }) => {
        try {
          const task = await createTask(
            projectId,
            title,
            description,
            priority,
            startDate,
            endDate,
          );
          return { success: true as const, task };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    update_task: tool({
      description:
        'Update a task\'s title, description, status, priority, or schedule. Provide only the fields to change and use null to clear dates. IMPORTANT: if changing status to any non-INBOX value, startDate and endDate must both be set (either already on the task or provided in this call).',
      parameters: z.object({
        taskId: z.string().describe('ID of the task to update'),
        title: z.string().optional().describe('New title'),
        description: z.string().optional().describe('New description'),
        status: taskStatusEnum.optional().describe('New status column'),
        priority: taskPrioritySchema.optional().describe('New priority from 1 (highest) to 5 (lowest)'),
        startDate: taskDateSchema.optional().describe('New ISO datetime start date, or null to clear it'),
        endDate: taskDateSchema.optional().describe('New ISO datetime end date, or null to clear it'),
      }),
      execute: async ({ taskId, title, description, status, priority, startDate, endDate }) => {
        try {
          // Enforce dates when moving to any non-INBOX status
          if (status !== undefined && status !== 'INBOX') {
            const existing = await getTask(taskId);
            const effectiveStart = startDate !== undefined ? startDate : existing.startDate;
            const effectiveEnd = endDate !== undefined ? endDate : existing.endDate;
            if (!effectiveStart || !effectiveEnd) {
              return {
                success: false as const,
                error: `Cannot move task to ${status}: both startDate and endDate must be set. Please ask the user for the missing dates before proceeding.`,
              };
            }
          }
          const data: Record<string, unknown> = {};
          if (title !== undefined) data.title = title;
          if (description !== undefined) data.description = description;
          if (status !== undefined) data.status = status;
          if (priority !== undefined) data.priority = priority;
          if (startDate !== undefined) data.startDate = startDate;
          if (endDate !== undefined) data.endDate = endDate;
          const task = await updateTask(taskId, data as Parameters<typeof updateTask>[1]);
          return { success: true as const, task };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    move_task: tool({
      description:
        'Move a task to a different status column at a specific position. Use fractional positionIndex values (e.g. 1.5 to insert between 1.0 and 2.0). IMPORTANT: if the target status is not INBOX, both startDate and endDate must be set on the task. If they are not set, ask the user for the dates before calling this tool.',
      parameters: z.object({
        taskId: z.string().describe('ID of the task to move'),
        status: taskStatusEnum.describe('Target status column'),
        positionIndex: z.number().describe('Fractional position in the target column'),
      }),
      execute: async ({ taskId, status, positionIndex }) => {
        try {
          // Enforce dates when moving to any non-INBOX status
          if (status !== 'INBOX') {
            const existing = await getTask(taskId);
            if (!existing.startDate || !existing.endDate) {
              return {
                success: false as const,
                error: `Cannot move task to ${status}: both startDate and endDate must be set. Please ask the user for the missing dates before proceeding.`,
              };
            }
          }
          await updateTask(taskId, { status });
          const task = await reorderTask(taskId, positionIndex);
          return { success: true as const, task };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    delete_task: tool({
      description: 'Permanently delete a task by its ID.',
      parameters: z.object({
        taskId: z.string().describe('ID of the task to delete'),
      }),
      execute: async ({ taskId }) => {
        try {
          await deleteTask(taskId);
          return { success: true as const };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    list_projects: tool({
      description: 'List all projects.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const projects = await listProjects();
          return { success: true as const, projects };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    create_project: tool({
      description: 'Create a new project with the given name.',
      parameters: z.object({
        name: z.string().describe('Name of the project'),
      }),
      execute: async ({ name }) => {
        try {
          const project = await createProject(name);
          return { success: true as const, project };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    send_notification: tool({
      description:
        'Send a notification or question to the user. Use this when you need user input, want to ask a follow-up question, or need to flag something important for their attention.',
      parameters: z.object({
        message: z
          .string()
          .describe('The notification message or question to display to the user'),
      }),
      execute: async ({ message }) => {
        try {
          const notification = await createNotification(projectId, message);
          return { success: true as const, notificationId: notification.id };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),
  };
}
