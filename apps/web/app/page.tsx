import type { Project } from '@kanban/types';
import { api } from '@/lib/api';
import { ProjectList } from '@/components/projects/ProjectList';

export default async function Home() {
  let projects: Project[] = [];
  try {
    projects = await api.get<Project[]>('/projects');
  } catch {
    // API may be unreachable during SSR — render empty state
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-stone-900">Projects</h1>
      <p className="mb-8 text-sm text-stone-500">Your workspaces. Pick one to open its board.</p>
      <ProjectList fallbackData={projects} />
    </main>
  );
}
