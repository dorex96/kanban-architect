import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { runWeeklyProjectCheckCycleOnce } from './weekly-project-check.scheduler.js';
import {
  runWeeklyProjectCheckBodySchema,
  weeklyProjectCheckHistoryQuerySchema,
} from './weekly-project-check.schema.js';
import { listWeeklyProjectCheckHistory } from './weekly-project-check.service.js';
import { config } from '../../config.js';

const weeklyProjectCheckRouter = new Hono();

// Internal endpoint for deterministic scheduler verification.
weeklyProjectCheckRouter.post('/run-once', zValidator('json', runWeeklyProjectCheckBodySchema), async (c) => {
  const { projectId } = c.req.valid('json');
  const summary = await runWeeklyProjectCheckCycleOnce(projectId);
  return c.json(summary);
});

weeklyProjectCheckRouter.get('/history', zValidator('query', weeklyProjectCheckHistoryQuerySchema), async (c) => {
  const { projectId, limit } = c.req.valid('query');
  const runs = await listWeeklyProjectCheckHistory(projectId, limit ?? config.WEEKLY_PROJECT_CHECK_HISTORY_LIMIT);
  return c.json(runs);
});

export default weeklyProjectCheckRouter;
