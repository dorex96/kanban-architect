import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler } from './middlewares/error-handler.js';
import projectsRouter from './features/projects/projects.router.js';
import tasksRouter from './features/tasks/tasks.router.js';
import agentRouter from './features/agent/agent.router.js';
import notificationsRouter from './features/notifications/notifications.router.js';
import taskHealthRouter from './features/task-health/task-health.router.js';
import { startTaskHealthScheduler, stopTaskHealthScheduler } from './features/task-health/task-health.scheduler.js';
import weeklyProjectCheckRouter from './features/weekly-project-check/weekly-project-check.router.js';
import {
  startWeeklyProjectCheckScheduler,
  stopWeeklyProjectCheckScheduler,
} from './features/weekly-project-check/weekly-project-check.scheduler.js';

const app = new Hono();

app.use('/*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/projects', projectsRouter);
app.route('/tasks', tasksRouter);
app.route('/agent', agentRouter);
app.route('/notifications', notificationsRouter);
app.route('/internal/task-health', taskHealthRouter);
app.route('/internal/weekly-project-check', weeklyProjectCheckRouter);

app.onError(errorHandler);

const port = parseInt(process.env.PORT || '4000', 10);

startTaskHealthScheduler();
startWeeklyProjectCheckScheduler();

process.on('SIGINT', () => {
  stopTaskHealthScheduler();
  stopWeeklyProjectCheckScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopTaskHealthScheduler();
  stopWeeklyProjectCheckScheduler();
  process.exit(0);
});

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`);
});

export default app;
