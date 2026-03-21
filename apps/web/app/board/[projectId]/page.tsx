import Link from 'next/link';
import type { Project, Task } from '@kanban/types';
import { api } from '@/lib/api';
import { KanbanBoard } from '../../../components/board/KanbanBoard';

interface PageProps {
  params: { projectId: string };
}

export default async function BoardPage({ params }: PageProps) {
  const { projectId } = params;

  let project: Project | null = null;
  let tasks: Task[] = [];

  try {
    [project, tasks] = await Promise.all([
      api.get<Project>(`/projects/${projectId}`),
      api.get<Task[]>(`/tasks?projectId=${projectId}`),
    ]);
  } catch {
    // API may be unreachable during SSR — render with defaults
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <Link
          href="/"
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Back to projects"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">
          {project?.name ?? 'Board'}
        </h1>
      </header>

      <div className="min-h-0 flex-1">
        <KanbanBoard projectId={projectId} fallbackTasks={tasks} />
      </div>
    </main>
  );
}
