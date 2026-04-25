import { z } from 'zod';

export const createNotificationSchema = z.object({
  projectId: z.string(),
  message: z.string().min(1),
});

export const listNotificationsQuerySchema = z.object({
  projectId: z.string(),
});

export const deleteReadNotificationsQuerySchema = z.object({
  projectId: z.string(),
});

export const replyNotificationSchema = z.object({
  reply: z.string().min(1),
});
