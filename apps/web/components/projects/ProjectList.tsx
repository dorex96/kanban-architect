'use client';

import type { Project } from '@kanban/types';
import { useProjects } from '@/hooks/useProjects';
import { AddProjectForm } from './AddProjectForm';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  fallbackData?: Project[];
}

export function ProjectList({ fallbackData }: ProjectListProps) {
  const { projects, isLoading, addProject, renameProject, removeProject } =
    useProjects(fallbackData);

  return (
    <div className="space-y-6">
      <AddProjectForm onAdd={addProject} />

      {isLoading && projects.length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">Loading projects…</p>
      )}

      {!isLoading && projects.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-gray-500">No projects yet. Create one above to get started.</p>
        </div>
      )}

      <div className="space-y-2">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onRename={renameProject}
            onDelete={removeProject}
          />
        ))}
      </div>
    </div>
  );
}
