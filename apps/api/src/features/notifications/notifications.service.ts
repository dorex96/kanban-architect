import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import { logEvent } from '../events/events.service.js';
import type { Notification } from '@kanban/types';

export async function createNotification(
  projectId: string,
  message: string,
  taskId?: string,
): Promise<Notification> {
  const row = await prisma.notification.create({
    data: { projectId, message, taskId: taskId ?? null },
  });

  if (taskId) {
    const sentDate = toDateString(new Date());
    await prisma.sentNotificationLog.upsert({
      where: { taskId_sentDate: { taskId, sentDate } },
      create: { taskId, projectId, sentDate },
      update: {},
    });
  }

  return toNotification(row);
}

export async function hasPendingTaskNotification(taskId: string): Promise<boolean> {
  const row = await prisma.notification.findFirst({
    where: {
      taskId,
      isRead: false,
      deletedAt: null,
    },
    select: { id: true },
  });
  return Boolean(row);
}

export async function hasDailyTaskNotification(taskId: string, date: string): Promise<boolean> {
  const row = await prisma.sentNotificationLog.findFirst({
    where: { taskId, sentDate: date },
    select: { id: true },
  });
  return Boolean(row);
}

export async function hasRecentNotification(
  projectId: string,
  message: string,
  since: Date,
): Promise<boolean> {
  const row = await prisma.notification.findFirst({
    where: {
      projectId,
      message,
      deletedAt: null,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return Boolean(row);
}

export async function listNotifications(projectId: string): Promise<Notification[]> {
  const rows = await prisma.notification.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toNotification);
}

export async function markAsRead(id: string): Promise<Notification> {
  const existing = await prisma.notification.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new HttpError(404, 'Notification not found');
  const row = await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return toNotification(row);
}

export async function replyToNotification(id: string, reply: string): Promise<Notification> {
  const existing = await prisma.notification.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new HttpError(404, 'Notification not found');

  const [row] = await prisma.$transaction([
    prisma.notification.update({
      where: { id },
      data: { reply, isRead: true, repliedAt: new Date() },
    }),
    prisma.chatMessage.create({
      data: {
        projectId: existing.projectId,
        role: 'user',
        content: `[Notification reply] ${reply}`,
      },
    }),
  ]);

  return toNotification(row);
}

export async function softDeleteNotification(id: string): Promise<Notification> {
  const existing = await prisma.notification.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new HttpError(404, 'Notification not found');

  const row = await prisma.notification.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logEvent(existing.projectId, 'notification.soft_deleted');
  return toNotification(row);
}

export async function softDeleteReadNotifications(projectId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      projectId,
      isRead: true,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  if (result.count > 0) {
    await logEvent(projectId, 'notification.read_bulk_soft_deleted');
  }

  return result.count;
}

// ── helpers ──────────────────────────────────────────────────────────────────

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toNotification(row: {
  id: string;
  projectId: string;
  taskId: string | null;
  message: string;
  isRead: boolean;
  reply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
}): Notification {
  return {
    id: row.id,
    projectId: row.projectId,
    taskId: row.taskId,
    message: row.message,
    isRead: row.isRead,
    reply: row.reply,
    repliedAt: row.repliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
