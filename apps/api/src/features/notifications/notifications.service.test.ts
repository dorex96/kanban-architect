import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  notificationCreate: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationUpdate: vi.fn(),
  notificationUpdateMany: vi.fn(),
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
});
