import { z } from 'zod';

export const runWeeklyProjectCheckQuerySchema = z.object({
  trigger: z.enum(['manual']).optional(),
});
