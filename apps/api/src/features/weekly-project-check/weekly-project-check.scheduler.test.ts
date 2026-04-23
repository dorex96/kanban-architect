import { beforeEach, describe, expect, it, vi } from 'vitest';

const cronMocks = vi.hoisted(() => {
  const stopMock = vi.fn();
  const destroyMock = vi.fn();
  const scheduleMock = vi.fn(() => ({
    stop: stopMock,
    destroy: destroyMock,
  }));

  return {
    stopMock,
    destroyMock,
    scheduleMock,
  };
});

const mocks = vi.hoisted(() => ({
  runBatch: vi.fn(),
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: cronMocks.scheduleMock,
  },
}));

vi.mock('../../config.js', () => ({
  config: {
    ENABLE_WEEKLY_PROJECT_CHECK_SCHEDULER: true,
    WEEKLY_PROJECT_CHECK_CRON: '0 9 * * 1',
    WEEKLY_PROJECT_CHECK_TIMEZONE: 'Europe/Rome',
  },
}));

vi.mock('./weekly-project-check.service.js', () => ({
  runWeeklyProjectCheckBatch: mocks.runBatch,
}));

import {
  runWeeklyProjectCheckCycleOnce,
  startWeeklyProjectCheckScheduler,
  stopWeeklyProjectCheckScheduler,
} from './weekly-project-check.scheduler.js';

describe('weekly-project-check.scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopWeeklyProjectCheckScheduler();
    mocks.runBatch.mockResolvedValue({
      checkedProjects: 1,
      successRuns: 1,
      skippedRuns: 0,
      failedRuns: 0,
      createdNotifications: 1,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      errors: [],
    });
  });

  it('registers cron scheduler with configured timezone', () => {
    startWeeklyProjectCheckScheduler();

    expect(cronMocks.scheduleMock).toHaveBeenCalledWith(
      '0 9 * * 1',
      expect.any(Function),
      expect.objectContaining({ timezone: 'Europe/Rome' }),
    );

    stopWeeklyProjectCheckScheduler();
    expect(cronMocks.stopMock).toHaveBeenCalled();
    expect(cronMocks.destroyMock).toHaveBeenCalled();
  });

  it('passes optional projectId on manual run', async () => {
    await runWeeklyProjectCheckCycleOnce('p1');

    expect(mocks.runBatch).toHaveBeenCalledWith({ triggerType: 'MANUAL', projectId: 'p1' });
  });
});
