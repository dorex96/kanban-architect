import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/errors.js';
import type { Notification } from '@kanban/types';

export async function createNotification(projectId: string, message: string): Promise<Notification> {
  const row = await prisma.notification.create({
    data: { projectId, message },
  });
  return toNotification(row);
}

export async function listNotifications(projectId: string): Promise<Notification[]> {
  const rows = await prisma.notification.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toNotification);
}

export async function markAsRead(id: string): Promise<Notification> {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Notification not found');
  const row = await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return toNotification(row);
}

export async function replyToNotification(id: string, reply: string): Promise<Notification> {
  const existing = await prisma.notification.findUnique({ where: { id } });
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

// ── helpers ──────────────────────────────────────────────────────────────────

function toNotification(row: {
  id: string;
  projectId: string;
  message: string;
  isRead: boolean;
  reply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
}): Notification {
  return {
    id: row.id,
    projectId: row.projectId,
    message: row.message,
    isRead: row.isRead,
    reply: row.reply,
    repliedAt: row.repliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
