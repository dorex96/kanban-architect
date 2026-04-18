import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { runAgent, ConfigurationError } from './agent.coordinator.js';

const router = new Hono();

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

const runAgentSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  projectId: z.string().min(1),
});

const projectIdQuerySchema = z.object({
  projectId: z.string().min(1),
});

// POST /agent/run — streaming agent response (useChat compatible)
router.post(
  '/run',
  zValidator('json', runAgentSchema),
  async (c) => {
    const { projectId, messages } = c.req.valid('json');
    try {
      const result = await runAgent({ projectId, messages });
      return result.toDataStreamResponse({
        getErrorMessage: (error: unknown) => {
          if (error instanceof Error) {
            return error.message;
          }
          return 'Unexpected agent error';
        },
      });
    } catch (err) {
      if (err instanceof ConfigurationError) {
        return c.json({ error: err.message, code: 'CONFIGURATION_ERROR' }, 422);
      }
      throw err;
    }
  },
);

// GET /agent/messages?projectId= — load persisted chat history
router.get(
  '/messages',
  zValidator('query', projectIdQuerySchema),
  async (c) => {
    const { projectId } = c.req.valid('query');
    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return c.json(messages);
  },
);

// DELETE /agent/messages?projectId= — clear chat history
router.delete(
  '/messages',
  zValidator('query', projectIdQuerySchema),
  async (c) => {
    const { projectId } = c.req.valid('query');
    await prisma.chatMessage.deleteMany({ where: { projectId } });
    return c.body(null, 204);
  },
);

// GET /agent/logs?projectId= — past agent interactions
router.get(
  '/logs',
  zValidator('query', projectIdQuerySchema),
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
