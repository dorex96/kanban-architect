import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HttpError } from './lib/errors.js';
import projectsRouter from './routers/projects.js';
import tasksRouter from './routers/tasks.js';

const app = new Hono();

app.use('/*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/projects', projectsRouter);
app.route('/tasks', tasksRouter);

app.onError((err, c) => {
  if (err instanceof HttpError) {
    const status = err.status as 400 | 401 | 403 | 404 | 409 | 500;
    return c.json({ error: err.message }, status);
  }
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '4000', 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running on http://localhost:${port}`);
});

export default app;
