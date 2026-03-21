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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Projects</h1>
      <ProjectList fallbackData={projects} />
    </main>
  );
}
