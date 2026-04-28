import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notificationCreate: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationUpdate: vi.fn(),
  notificationUpdateMany: vi.fn(),
  sentNotificationLogFindFirst: vi.fn(),
  sentNotificationLogUpsert: vi.fn(),
  chatMessageCreate: vi.fn(),
  transaction: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    notification: {
      create: mocks.notificationCreate,
      findMany: mocks.notificationFindMany,
      findFirst: mocks.notificationFindFirst,
      update: mocks.notificationUpdate,
      updateMany: mocks.notificationUpdateMany,
    },
    sentNotificationLog: {
      findFirst: mocks.sentNotificationLogFindFirst,
      upsert: mocks.sentNotificationLogUpsert,
    },
    chatMessage: {
      create: mocks.chatMessageCreate,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock('../events/events.service.js', () => ({
  logEvent: mocks.logEvent,
}));

import {
  createNotification,
  hasDailyTaskNotification,
  hasPendingTaskNotification,
  listNotifications,
  markAsRead,
  replyToNotification,
  softDeleteNotification,
  softDeleteReadNotifications,
} from './notifications.service.js';
import { HttpError } from '../../lib/errors.js';

describe('notifications.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (operations: unknown[]) => Promise.all(operations));
  });

  it('listNotifications excludes soft-deleted notifications', async () => {
    mocks.notificationFindMany.mockResolvedValue([
      {
        id: 'n1',
        projectId: 'p1',
        taskId: null,
        message: 'hello',
        isRead: false,
        reply: null,
        repliedAt: null,
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
      },
    ]);

    const rows = await listNotifications('p1');

    expect(mocks.notificationFindMany).toHaveBeenCalledWith({
      where: { projectId: 'p1', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('n1');
  });

  it('softDeleteNotification sets deletedAt and notification is no longer returned from list', async () => {
    const activeRows: Array<{
      id: string;
      projectId: string;
      taskId: string | null;
      message: string;
      isRead: boolean;
      reply: string | null;
      repliedAt: Date | null;
      createdAt: Date;
      deletedAt: Date | null;
    }> = [
      {
        id: 'n1',
        projectId: 'p1',
        taskId: null,
        message: 'one',
        isRead: false,
        reply: null,
        repliedAt: null,
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        deletedAt: null,
      },
    ];

    mocks.notificationFindFirst.mockImplementation(async ({ where }: { where: { id: string; deletedAt: null } }) => {
      return activeRows.find((row) => row.id === where.id && row.deletedAt === null) ?? null;
    });

    mocks.notificationUpdate.mockImplementation(async ({ where, data }: { where: { id: string }; data: { deletedAt: Date } }) => {
      const row = activeRows.find((item) => item.id === where.id);
      if (!row) throw new Error('Row not found');
      row.deletedAt = data.deletedAt;
      return row;
    });

    mocks.notificationFindMany.mockImplementation(async ({ where }: { where: { projectId: string; deletedAt: null } }) => {
      return activeRows.filter((row) => row.projectId === where.projectId && row.deletedAt === where.deletedAt);
    });

    const deleted = await softDeleteNotification('n1');
    const listed = await listNotifications('p1');

    expect(deleted.id).toBe('n1');
    expect(listed).toEqual([]);
    expect(mocks.logEvent).toHaveBeenCalledWith('p1', 'notification.soft_deleted');
  });

  it('softDeleteReadNotifications deletes only read notifications', async () => {
    mocks.notificationUpdateMany.mockResolvedValue({ count: 2 });

    const deletedCount = await softDeleteReadNotifications('p1');

    expect(deletedCount).toBe(2);
    expect(mocks.notificationUpdateMany).toHaveBeenCalledWith({
      where: {
        projectId: 'p1',
        isRead: true,
        deletedAt: null,
      },
      data: {
        deletedAt: expect.any(Date),
      },
    });
    expect(mocks.logEvent).toHaveBeenCalledWith('p1', 'notification.read_bulk_soft_deleted');
  });

  it('markAsRead returns 404 for soft-deleted notification', async () => {
    mocks.notificationFindFirst.mockResolvedValue(null);

    const call = markAsRead('missing');
    await expect(call).rejects.toBeInstanceOf(HttpError);
    await expect(call).rejects.toMatchObject({ status: 404 });
  });

  it('replyToNotification returns 404 for soft-deleted notification', async () => {
    mocks.notificationFindFirst.mockResolvedValue(null);

    const call = replyToNotification('missing', 'reply');
    await expect(call).rejects.toBeInstanceOf(HttpError);
    await expect(call).rejects.toMatchObject({ status: 404 });
  });

  // ── hasPendingTaskNotification ───────────────────────────────────────────

  it('hasPendingTaskNotification returns true when an unread non-deleted notification exists', async () => {
    mocks.notificationFindFirst.mockResolvedValue({ id: 'n1' });

    const result = await hasPendingTaskNotification('task-1');

    expect(mocks.notificationFindFirst).toHaveBeenCalledWith({
      where: { taskId: 'task-1', isRead: false, deletedAt: null },
      select: { id: true },
    });
    expect(result).toBe(true);
  });

  it('hasPendingTaskNotification returns false when no matching notification exists', async () => {
    mocks.notificationFindFirst.mockResolvedValue(null);

    const result = await hasPendingTaskNotification('task-1');

    expect(result).toBe(false);
  });

  it('hasPendingTaskNotification returns false when the existing notification is already read', async () => {
    mocks.notificationFindFirst.mockResolvedValue(null);

    const result = await hasPendingTaskNotification('task-2');

    expect(result).toBe(false);
  });

  // ── hasDailyTaskNotification ─────────────────────────────────────────────

  it('hasDailyTaskNotification returns true when a log entry exists for the given date', async () => {
    mocks.sentNotificationLogFindFirst.mockResolvedValue({ id: 'log-1' });

    const result = await hasDailyTaskNotification('task-1', '2026-04-28');

    expect(mocks.sentNotificationLogFindFirst).toHaveBeenCalledWith({
      where: { taskId: 'task-1', sentDate: '2026-04-28' },
      select: { id: true },
    });
    expect(result).toBe(true);
  });

  it('hasDailyTaskNotification returns false when no log entry exists for the date', async () => {
    mocks.sentNotificationLogFindFirst.mockResolvedValue(null);

    const result = await hasDailyTaskNotification('task-1', '2026-04-28');

    expect(result).toBe(false);
  });

  // ── createNotification with taskId ───────────────────────────────────────

  it('createNotification with taskId upserts a SentNotificationLog entry', async () => {
    const now = new Date('2026-04-28T15:00:00.000Z');
    vi.setSystemTime(now);

    mocks.notificationCreate.mockResolvedValue({
      id: 'n1',
      projectId: 'p1',
      taskId: 'task-1',
      message: 'Task is overdue',
      isRead: false,
      reply: null,
      repliedAt: null,
      createdAt: now,
    });
    mocks.sentNotificationLogUpsert.mockResolvedValue({});

    const notification = await createNotification('p1', 'Task is overdue', 'task-1');

    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: { projectId: 'p1', message: 'Task is overdue', taskId: 'task-1' },
    });
    expect(mocks.sentNotificationLogUpsert).toHaveBeenCalledWith({
      where: { taskId_sentDate: { taskId: 'task-1', sentDate: '2026-04-28' } },
      create: { taskId: 'task-1', projectId: 'p1', sentDate: '2026-04-28' },
      update: {},
    });
    expect(notification.taskId).toBe('task-1');

    vi.useRealTimers();
  });

  it('createNotification without taskId does not write a SentNotificationLog entry', async () => {
    mocks.notificationCreate.mockResolvedValue({
      id: 'n2',
      projectId: 'p1',
      taskId: null,
      message: 'Workload alert',
      isRead: false,
      reply: null,
      repliedAt: null,
      createdAt: new Date(),
    });

    const notification = await createNotification('p1', 'Workload alert');

    expect(mocks.sentNotificationLogUpsert).not.toHaveBeenCalled();
    expect(notification.taskId).toBeNull();
  });
});
