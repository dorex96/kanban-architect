import { z } from 'zod';

export const runWeeklyProjectCheckBodySchema = z.object({
  projectId: z.string().min(1).optional(),
});

export const weeklyProjectCheckHistoryQuerySchema = z.object({
  projectId: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
