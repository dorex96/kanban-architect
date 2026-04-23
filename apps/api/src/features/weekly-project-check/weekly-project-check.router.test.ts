import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runOnce: vi.fn(),
  listHistory: vi.fn(),
}));

vi.mock('./weekly-project-check.scheduler.js', () => ({
  runWeeklyProjectCheckCycleOnce: mocks.runOnce,
}));

vi.mock('./weekly-project-check.service.js', () => ({
  listWeeklyProjectCheckHistory: mocks.listHistory,
}));

vi.mock('../../config.js', () => ({
  config: {
    WEEKLY_PROJECT_CHECK_HISTORY_LIMIT: 20,
  },
}));

import weeklyProjectCheckRouter from './weekly-project-check.router.js';

describe('weekly-project-check.router', () => {
  it('runs manual check with optional projectId', async () => {
    mocks.runOnce.mockResolvedValue({ ok: true });

    const res = await weeklyProjectCheckRouter.request('http://localhost/run-once', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projectId: 'p1' }),
    });

    expect(res.status).toBe(200);
    expect(mocks.runOnce).toHaveBeenCalledWith('p1');
  });

  it('returns history for project', async () => {
    mocks.listHistory.mockResolvedValue([{ id: 'r1' }]);

    const res = await weeklyProjectCheckRouter.request(
      'http://localhost/history?projectId=p1&limit=10',
      { method: 'GET' },
    );

    expect(res.status).toBe(200);
    expect(mocks.listHistory).toHaveBeenCalledWith('p1', 10);
  });

  it('validates required projectId for history', async () => {
    const res = await weeklyProjectCheckRouter.request('http://localhost/history', { method: 'GET' });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
