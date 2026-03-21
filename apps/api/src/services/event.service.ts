import { prisma } from '../lib/prisma.js';

export async function logEvent(
  projectId: string,
  action: string,
  taskId?: string,
): Promise<void> {
  await prisma.event.create({
    data: { projectId, action, taskId },
  });
}
