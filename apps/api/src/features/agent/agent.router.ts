import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { runAgent } from './agent.coordinator.js';

const router = new Hono();

const runAgentSchema = z.object({
  projectId: z.string().min(1),
  query: z.string().min(1),
});

const logsQuerySchema = z.object({
  projectId: z.string().min(1),
});

// POST /agent/run — streaming agent response
router.post(
  '/run',
  zValidator('json', runAgentSchema),
  async (c) => {
    const { projectId, query } = c.req.valid('json');
    const result = await runAgent({ projectId, query });
    return result.toDataStreamResponse();
  },
);

// GET /agent/logs?projectId= — past agent interactions
router.get(
  '/logs',
  zValidator('query', logsQuerySchema),
  async (c) => {
    const { projectId } = c.req.valid('query');
    const logs = await prisma.agentLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return c.json(logs);
  },
);

export default router;
