'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@kanban/types';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import { SortControls, type SortBy, type SortDir } from './SortControls';

const STATUS_LABELS: Record<TaskStatus, string> = {
  INBOX: 'Inbox',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  INBOX: 'bg-stone-100 text-stone-600',
  TODO: 'bg-violet-100 text-violet-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
};

const STATUS_BORDER_COLORS: Record<TaskStatus, string> = {
  INBOX: 'border-t-stone-300',
  TODO: 'border-t-violet-400',
  IN_PROGRESS: 'border-t-amber-400',
  DONE: 'border-t-emerald-400',
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  sortBy: SortBy;
  sortDir: SortDir;
  onSortByChange: (value: SortBy) => void;
  onSortDirToggle: () => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDescriptionUpdate: (id: string, description: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: { priority?: number; startDate?: string | null; endDate?: string | null }) => Promise<void>;
  children?: React.ReactNode;
}

export function KanbanColumn({
  status,
  tasks,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirToggle,
  onRename,
  onDescriptionUpdate,
  onDelete,
  onUpdate,
  children,
}: KanbanColumnProps) {
  const canManualReorder = sortBy === 'position';

  return (
    <div className={cn('flex w-72 shrink-0 flex-col rounded-xl border border-stone-200 border-t-2 bg-white shadow-sm', STATUS_BORDER_COLORS[status])}>
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            STATUS_COLORS[status],
          )}
        >
          {STATUS_LABELS[status]}
        </span>
        <span className="ml-auto tabular-nums text-xs text-stone-400">{tasks.length}</span>
      </div>

      <div className="px-3 pb-2">
        <SortControls
          sortBy={sortBy}
          sortDir={sortDir}
          onSortByChange={onSortByChange}
          onSortDirToggle={onSortDirToggle}
        />
      </div>

      {!canManualReorder && (
        <div className="px-3 pb-2 text-[11px] text-stone-500">
          Riordino manuale disattivato in questa colonna.
        </div>
      )}

      {children && <div className="px-2 pb-2">{children}</div>}

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex min-h-[40px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2',
              snapshot.isDraggingOver && 'bg-violet-50/60 rounded-lg',
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      status={status}
                      onRename={onRename}
                      onDescriptionUpdate={onDescriptionUpdate}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
