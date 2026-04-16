import { tool } from 'ai';
import { z } from 'zod';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
} from '../tasks/tasks.service.js';
import { listProjects, createProject } from '../projects/projects.service.js';

const taskStatusEnum = z.enum(['INBOX', 'TODO', 'IN_PROGRESS', 'DONE']);

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
      description: 'Create a new task in the INBOX column.',
      parameters: z.object({
        title: z.string().describe('Title of the task'),
        description: z.string().optional().describe('Optional task description'),
      }),
      execute: async ({ title, description }) => {
        try {
          const task = await createTask(projectId, title, description);
          return { success: true as const, task };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    update_task: tool({
      description:
        'Update a task\'s title, description, or status. Provide only the fields to change.',
      parameters: z.object({
        taskId: z.string().describe('ID of the task to update'),
        title: z.string().optional().describe('New title'),
        description: z.string().optional().describe('New description'),
        status: taskStatusEnum.optional().describe('New status column'),
      }),
      execute: async ({ taskId, title, description, status }) => {
        try {
          const data: Record<string, unknown> = {};
          if (title !== undefined) data.title = title;
          if (description !== undefined) data.description = description;
          if (status !== undefined) data.status = status;
          const task = await updateTask(taskId, data as Parameters<typeof updateTask>[1]);
          return { success: true as const, task };
        } catch (err: unknown) {
          return { success: false as const, error: (err as Error).message };
        }
      },
    }),

    move_task: tool({
      description:
        'Move a task to a different status column at a specific position. Use fractional positionIndex values (e.g. 1.5 to insert between 1.0 and 2.0).',
      parameters: z.object({
        taskId: z.string().describe('ID of the task to move'),
        status: taskStatusEnum.describe('Target status column'),
        positionIndex: z.number().describe('Fractional position in the target column'),
      }),
      execute: async ({ taskId, status, positionIndex }) => {
        try {
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
  };
}
