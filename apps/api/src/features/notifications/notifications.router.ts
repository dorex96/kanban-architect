import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createNotification,
  listNotifications,
  markAsRead,
  replyToNotification,
} from './notifications.service.js';
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  replyNotificationSchema,
} from './notifications.schema.js';

const notificationsRouter = new Hono();

notificationsRouter.post('/', zValidator('json', createNotificationSchema), async (c) => {
  const { projectId, message } = c.req.valid('json');
  const notification = await createNotification(projectId, message);
  return c.json(notification, 201);
});

notificationsRouter.get('/', zValidator('query', listNotificationsQuerySchema), async (c) => {
  const { projectId } = c.req.valid('query');
  const notifications = await listNotifications(projectId);
  return c.json(notifications);
});

notificationsRouter.patch('/:id/read', async (c) => {
  const id = c.req.param('id');
  const notification = await markAsRead(id);
  return c.json(notification);
});

notificationsRouter.post('/:id/reply', zValidator('json', replyNotificationSchema), async (c) => {
  const id = c.req.param('id');
  const { reply } = c.req.valid('json');
  const notification = await replyToNotification(id, reply);
  return c.json(notification);
});

export default notificationsRouter;
