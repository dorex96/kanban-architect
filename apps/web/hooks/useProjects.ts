import useSWR from 'swr';
import type { Project } from '@kanban/types';
import { api } from '@/lib/api';

export function useProjects(fallbackData?: Project[]) {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    '/projects',
    () => api.get<Project[]>('/projects'),
    { fallbackData },
  );

  const projects = data ?? [];

  async function addProject(name: string) {
    const created = await api.post<Project>('/projects', { name });
    await mutate([...projects, created], { revalidate: false });
    return created;
  }

  async function renameProject(id: string, name: string) {
    const prev = projects;
    await mutate(
      projects.map((p) => (p.id === id ? { ...p, name } : p)),
      { revalidate: false },
    );
    try {
      await api.patch<Project>(`/projects/${id}`, { name });
    } catch (err) {
      await mutate(prev, { revalidate: false });
      throw err;
    }
  }

  async function removeProject(id: string) {
    const prev = projects;
    await mutate(
      projects.filter((p) => p.id !== id),
      { revalidate: false },
    );
    try {
      await api.delete(`/projects/${id}`);
    } catch (err) {
      await mutate(prev, { revalidate: false });
      throw err;
    }
  }

  return { projects, isLoading, error, addProject, renameProject, removeProject };
}
