import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from './projects.service.js';
import { createProjectSchema, updateProjectSchema } from './projects.schema.js';

const router = new Hono();

// GET /projects
router.get('/', async (c) => {
  const projects = await listProjects();
  return c.json(projects);
});

// POST /projects
router.post(
  '/',
  zValidator('json', createProjectSchema),
  async (c) => {
    const { name } = c.req.valid('json');
    const project = await createProject(name);
    return c.json(project, 201);
  },
);

// PATCH /projects/:id
router.patch(
  '/:id',
  zValidator('json', updateProjectSchema),
  async (c) => {
    const { name } = c.req.valid('json');
    const project = await updateProject(c.req.param('id'), name);
    return c.json(project);
  },
);

// DELETE /projects/:id
router.delete('/:id', async (c) => {
  await deleteProject(c.req.param('id'));
  return c.body(null, 204);
});

export default router;
