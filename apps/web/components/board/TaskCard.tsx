'use client';

import { useRef, useState } from 'react';
import type { Task, TaskStatus } from '@kanban/types';
import { cn } from '@/lib/utils';
import { TaskDetailModal } from './TaskDetailModal';

const STATUS_CARD_BORDER: Record<TaskStatus, string> = {
  INBOX: 'border-l-stone-300',
  TODO: 'border-l-violet-400',
  IN_PROGRESS: 'border-l-amber-400',
  DONE: 'border-l-emerald-400',
};

const PRIORITY_BADGE: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-blue-100 text-blue-700',
  5: 'bg-stone-100 text-stone-500',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

interface TaskCardProps {
  task: Task;
  status: TaskStatus;
  onRename: (id: string, title: string) => Promise<void>;
  onDescriptionUpdate: (id: string, description: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: { priority?: number; startDate?: string | null; endDate?: string | null }) => Promise<void>;
}

export function TaskCard({ task, status, onRename, onDescriptionUpdate, onDelete, onUpdate }: TaskCardProps) {
  const [editing, setEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setEditTitle(task.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commitEdit() {
    setEditing(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      await onRename(task.id, trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setEditTitle(task.title);
    }
  }

  const priorityBadgeClass = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE[3];
  const hasDate = task.startDate || task.endDate;

  return (
    <div className={cn('group rounded-lg border border-stone-200 border-l-4 bg-white p-3 shadow-sm transition-all hover:-translate-y-px hover:shadow-md', STATUS_CARD_BORDER[status])}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full rounded border border-violet-400 px-1.5 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          ) : (
            <button
              onClick={startEdit}
              className="w-full cursor-text break-words text-left text-sm font-medium text-stone-900"
              title="Click to edit"
            >
              {task.title}
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setShowDetail(true)}
            className="rounded p-1 text-stone-400 transition-colors hover:bg-violet-50 hover:text-violet-500"
            title="View details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={startEdit}
            className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            title="Rename"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded p-1 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <button
          onClick={() => setShowDetail(true)}
          className="mt-1 flex w-full items-center gap-1 text-left"
          title="View details"
        >
          <p className="line-clamp-2 break-words text-xs text-stone-400">
            {task.description}
          </p>
        </button>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className={cn('rounded px-1.5 py-0.5 text-xs font-semibold', priorityBadgeClass)}>
          P{task.priority}
        </span>
        {hasDate && (
          <span className="text-xs text-stone-400">
            {task.startDate && formatDate(task.startDate)}
            {task.startDate && task.endDate && ' → '}
            {task.endDate && formatDate(task.endDate)}
          </span>
        )}
      </div>

      {showDetail && (
        <TaskDetailModal
          task={task}
          onSave={(description) => onDescriptionUpdate(task.id, description)}
          onUpdateMeta={(data) => onUpdate(task.id, data)}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  );
}
