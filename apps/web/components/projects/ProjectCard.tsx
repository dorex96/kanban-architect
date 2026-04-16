'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Project } from '@kanban/types';

interface ProjectCardProps {
  project: Project;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    setEditName(project.name);
  }, [project.name]);

  async function commitRename() {
    const trimmed = editName.trim();
    setEditing(false);
    if (!trimmed || trimmed === project.name) {
      setEditName(project.name);
      return;
    }
    try {
      await onRename(project.id, trimmed);
    } catch {
      setEditName(project.name);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') {
      setEditName(project.name);
      setEditing(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      await onDelete(project.id);
      setDeleteDialogOpen(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteDialog() {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  }

  const date = new Date(project.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div className="group flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm transition-all hover:-translate-y-px hover:shadow-md">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              className="w-full rounded border border-violet-400 px-2 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          ) : (
            <Link
              href={`/board/${project.id}`}
              className="block truncate text-sm font-medium text-stone-900 transition-colors hover:text-violet-600"
            >
              {project.name}
            </Link>
          )}
          <p className="mt-0.5 text-xs text-stone-400">Created {date}</p>
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            title="Rename"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
          <button
            onClick={openDeleteDialog}
            className="rounded p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-project-title-${project.id}`}
        >
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="space-y-2">
              <h2 id={`delete-project-title-${project.id}`} className="text-base font-semibold text-stone-900">
                Delete project?
              </h2>
              <p className="text-sm leading-relaxed text-stone-600">
                This will permanently delete <span className="font-medium text-stone-900">{project.name}</span>
                {' '}and its related tasks.
              </p>
              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
