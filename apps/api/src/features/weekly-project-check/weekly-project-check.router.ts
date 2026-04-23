import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { runWeeklyProjectCheckCycleOnce } from './weekly-project-check.scheduler.js';
import { runWeeklyProjectCheckQuerySchema } from './weekly-project-check.schema.js';

const weeklyProjectCheckRouter = new Hono();

// Internal endpoint for deterministic scheduler verification.
weeklyProjectCheckRouter.post('/run-once', zValidator('query', runWeeklyProjectCheckQuerySchema), async (c) => {
  const summary = await runWeeklyProjectCheckCycleOnce();
  return c.json(summary);
});

export default weeklyProjectCheckRouter;
