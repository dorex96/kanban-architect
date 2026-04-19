import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import { logEvent } from '../events/events.service.js';
import type { Task, TaskStatus } from '@kanban/types';

export async function listTasks(projectId: string): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: { projectId },
    orderBy: { positionIndex: 'asc' },
  });
  return rows.map(toTask);
}

export async function createTask(
  projectId: string,
  title: string,
  description = '',
  priority = 3,
  startDate: string | null = null,
  endDate: string | null = null,
): Promise<Task> {
  const aggregate = await prisma.task.aggregate({
    where: { projectId },
    _max: { positionIndex: true },
  });
  const positionIndex = (aggregate._max.positionIndex ?? 0) + 1.0;

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description,
      positionIndex,
      priority,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });
  await logEvent(projectId, 'task.created', task.id);
  return toTask(task);
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: number;
    startDate?: string | null;
    endDate?: string | null;
  },
): Promise<Task> {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Task not found');

  const { startDate, endDate, ...rest } = data;
  const prismaData: Record<string, unknown> = { ...rest };
  if (startDate !== undefined) prismaData.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) prismaData.endDate = endDate ? new Date(endDate) : null;

  const task = await prisma.task.update({ where: { id }, data: prismaData });
  await logEvent(existing.projectId, 'task.updated', id);
  return toTask(task);
}

export async function deleteTask(id: string): Promise<void> {
  const existing = await prisma.task.findUnique({ where: { id }, select: { id: true, projectId: true } });
  if (!existing) throw new HttpError(404, 'Task not found');
  await logEvent(existing.projectId, 'task.deleted', id);
  await prisma.task.delete({ where: { id } });
}

export async function reorderTask(id: string, positionIndex: number): Promise<Task> {
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Task not found');

  const task = await prisma.task.update({ where: { id }, data: { positionIndex } });
  await logEvent(existing.projectId, 'task.reordered', id);
  return toTask(task);
}

// ── helpers ──────────────────────────────────────────────────────────────────

function toTask(row: {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  positionIndex: number;
  priority: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
}): Task {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    positionIndex: row.positionIndex,
    priority: row.priority,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
