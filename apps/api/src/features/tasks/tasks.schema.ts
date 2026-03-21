import { z } from 'zod';
import { taskStatusEnum } from '../../common/schemas.js';

export const listTasksQuerySchema = z.object({ projectId: z.string().min(1) });

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: taskStatusEnum.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'At least one field required',
  });

export const reorderTaskSchema = z.object({ positionIndex: z.number() });
