import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
} from './tasks.service.js';
import {
  listTasksQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  reorderTaskSchema,
} from './tasks.schema.js';

const router = new Hono();

// GET /tasks?projectId=
router.get(
  '/',
  zValidator('query', listTasksQuerySchema),
  async (c) => {
    const { projectId } = c.req.valid('query');
    const tasks = await listTasks(projectId);
    return c.json(tasks);
  },
);

// POST /tasks
router.post(
  '/',
  zValidator('json', createTaskSchema),
  async (c) => {
    const { projectId, title, description, priority, startDate, endDate } = c.req.valid('json');
    const task = await createTask(projectId, title, description, priority, startDate, endDate);
    return c.json(task, 201);
  },
);

// PATCH /tasks/:id
router.patch(
  '/:id',
  zValidator('json', updateTaskSchema),
  async (c) => {
    const data = c.req.valid('json');
    const task = await updateTask(c.req.param('id'), data);
    return c.json(task);
  },
);

// PATCH /tasks/:id/reorder
router.patch(
  '/:id/reorder',
  zValidator('json', reorderTaskSchema),
  async (c) => {
    const { positionIndex } = c.req.valid('json');
    const task = await reorderTask(c.req.param('id'), positionIndex);
    return c.json(task);
  },
);

// DELETE /tasks/:id
router.delete('/:id', async (c) => {
  await deleteTask(c.req.param('id'));
  return c.body(null, 204);
});

export default router;
