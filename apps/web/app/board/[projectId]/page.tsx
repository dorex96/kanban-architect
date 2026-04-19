import type { Project, Task, Notification } from '@kanban/types';
import { api } from '@/lib/api';
import { BoardPageClient } from '../../../components/board/BoardPageClient';

interface PageProps {
  params: { projectId: string };
}

export default async function BoardPage({ params }: PageProps) {
  const { projectId } = params;

  let project: Project | null = null;
  let tasks: Task[] = [];
  let notifications: Notification[] = [];

  try {
    [project, tasks, notifications] = await Promise.all([
      api.get<Project>(`/projects/${projectId}`),
      api.get<Task[]>(`/tasks?projectId=${projectId}`),
      api.get<Notification[]>(`/notifications?projectId=${projectId}`),
    ]);
  } catch {
    // API may be unreachable during SSR — render with defaults
  }

  return (
    <BoardPageClient
      projectId={projectId}
      projectName={project?.name ?? 'Board'}
      fallbackTasks={tasks}
      fallbackNotifications={notifications}
    />
  );
}
