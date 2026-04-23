import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class MockConfigurationError extends Error {}

  return {
    generateText: vi.fn(),
    listProjects: vi.fn(),
    getProject: vi.fn(),
    listTasks: vi.fn(),
    listNotifications: vi.fn(),
    createNotification: vi.fn(),
    createRun: vi.fn(),
    findRuns: vi.fn(),
    getModel: vi.fn(),
    MockConfigurationError,
  };
});

vi.mock('ai', () => ({
  generateText: mocks.generateText,
}));

vi.mock('../../config.js', () => ({
  config: {
    WEEKLY_PROJECT_CHECK_MAX_PROMPT_CHARS: 12000,
    WEEKLY_PROJECT_CHECK_MAX_OUTPUT_TOKENS: 900,
    WEEKLY_PROJECT_CHECK_MAX_RETRIES: 2,
    WEEKLY_PROJECT_CHECK_RETRY_DELAY_MS: 0,
    WEEKLY_PROJECT_CHECK_RETRY_SECOND_DELAY_MS: 0,
    WEEKLY_PROJECT_CHECK_HISTORY_LIMIT: 20,
  },
}));

vi.mock('../projects/projects.service.js', () => ({
  listProjects: mocks.listProjects,
  getProject: mocks.getProject,
}));

vi.mock('../tasks/tasks.service.js', () => ({
  listTasks: mocks.listTasks,
}));

vi.mock('../notifications/notifications.service.js', () => ({
  listNotifications: mocks.listNotifications,
  createNotification: mocks.createNotification,
}));

vi.mock('../agent/providers/base.js', () => ({
  getModel: mocks.getModel,
  ConfigurationError: mocks.MockConfigurationError,
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    weeklyProjectCheckRun: {
      create: mocks.createRun,
      findMany: mocks.findRuns,
    },
  },
}));

import {
  listWeeklyProjectCheckHistory,
  runWeeklyProjectCheckBatch,
} from './weekly-project-check.service.js';

describe('weekly-project-check.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getModel.mockReturnValue({});
  });

  it('creates notification and success log with retry on transient llm failure', async () => {
    mocks.listProjects.mockResolvedValue([{ id: 'p1', name: 'Proj', createdAt: new Date().toISOString() }]);
    mocks.listTasks.mockResolvedValue([
      {
        id: 't1',
        projectId: 'p1',
        title: 'Task A',
        description: '',
        status: 'TODO',
        positionIndex: 1,
        priority: 1,
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
      },
    ]);
    mocks.listNotifications.mockResolvedValue([]);
    mocks.generateText
      .mockRejectedValueOnce(new Error('timeout from provider'))
      .mockResolvedValueOnce({ text: '## Criticita\n- Nessuna\n## Suggerimenti per la prossima settimana\n- Prosegui\n## Sentiment generale\nIn linea' });

    const summary = await runWeeklyProjectCheckBatch();

    expect(summary.successRuns).toBe(1);
    expect(summary.failedRuns).toBe(0);
    expect(mocks.generateText).toHaveBeenCalledTimes(2);
    expect(mocks.createNotification).toHaveBeenCalledTimes(1);
    expect(mocks.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SUCCESS',
          projectId: 'p1',
        }),
      }),
    );
  });

  it('logs skip when project has no tasks', async () => {
    mocks.listProjects.mockResolvedValue([{ id: 'p1', name: 'Proj', createdAt: new Date().toISOString() }]);
    mocks.listTasks.mockResolvedValue([]);

    const summary = await runWeeklyProjectCheckBatch();

    expect(summary.skippedRuns).toBe(1);
    expect(mocks.createNotification).not.toHaveBeenCalled();
    expect(mocks.createRun).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SKIP',
          tasksAnalyzed: 0,
        }),
      }),
    );
  });

  it('runs on selected project when projectId is provided', async () => {
    mocks.getProject.mockResolvedValue({ id: 'p1', name: 'Proj', createdAt: new Date().toISOString() });
    mocks.listTasks.mockResolvedValue([]);

    const summary = await runWeeklyProjectCheckBatch({ triggerType: 'MANUAL', projectId: 'p1' });

    expect(summary.checkedProjects).toBe(1);
    expect(mocks.getProject).toHaveBeenCalledWith('p1');
    expect(mocks.listProjects).not.toHaveBeenCalled();
  });

  it('returns history ordered from persistence layer mapping date fields', async () => {
    const now = new Date();
    mocks.findRuns.mockResolvedValue([
      {
        id: 'run1',
        projectId: 'p1',
        triggerType: 'MANUAL',
        status: 'SUCCESS',
        tasksAnalyzed: 3,
        generatedText: 'text',
        errorMessage: null,
        startedAt: now,
        finishedAt: now,
        createdAt: now,
      },
    ]);

    const history = await listWeeklyProjectCheckHistory('p1', 5);

    expect(mocks.findRuns).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'p1' },
        take: 5,
      }),
    );
    expect(history[0]?.id).toBe('run1');
    expect(history[0]?.createdAt).toBe(now.toISOString());
  });
});
