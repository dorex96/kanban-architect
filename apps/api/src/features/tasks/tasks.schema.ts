import { z } from 'zod';
import { taskStatusEnum } from '../../common/schemas.js';

export const listTasksQuerySchema = z.object({ projectId: z.string().min(1) });

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: taskStatusEnum.optional(),
    priority: z.number().int().min(1).max(5).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field required',
  });

export const reorderTaskSchema = z.object({ positionIndex: z.number() });
