import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
} from '../services/task.service.js';

const taskStatusEnum = z.enum(['INBOX', 'TODO', 'IN_PROGRESS', 'DONE']);

const router = new Hono();

// GET /tasks?projectId=
router.get(
  '/',
  zValidator('query', z.object({ projectId: z.string().min(1) })),
  async (c) => {
    const { projectId } = c.req.valid('query');
    const tasks = await listTasks(projectId);
    return c.json(tasks);
  },
);

// POST /tasks
router.post(
  '/',
  zValidator(
    'json',
    z.object({
      projectId: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
    }),
  ),
  async (c) => {
    const { projectId, title, description } = c.req.valid('json');
    const task = await createTask(projectId, title, description);
    return c.json(task, 201);
  },
);

// PATCH /tasks/:id
router.patch(
  '/:id',
  zValidator(
    'json',
    z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        status: taskStatusEnum.optional(),
      })
      .refine((d) => Object.keys(d).length > 0, {
        message: 'At least one field required',
      }),
  ),
  async (c) => {
    const data = c.req.valid('json');
    const task = await updateTask(c.req.param('id'), data);
    return c.json(task);
  },
);

// PATCH /tasks/:id/reorder
router.patch(
  '/:id/reorder',
  zValidator('json', z.object({ positionIndex: z.number() })),
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
