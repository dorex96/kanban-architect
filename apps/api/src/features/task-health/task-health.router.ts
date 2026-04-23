import { Hono } from 'hono';
import { runTaskHealthCycleOnce } from './task-health.scheduler.js';

const taskHealthRouter = new Hono();

// Internal endpoint for deterministic scheduler verification.
taskHealthRouter.post('/run-once', async (c) => {
  const summary = await runTaskHealthCycleOnce();
  return c.json(summary);
});

export default taskHealthRouter;
