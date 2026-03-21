'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@kanban/types';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';

const STATUS_LABELS: Record<TaskStatus, string> = {
  INBOX: 'Inbox',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  INBOX: 'bg-gray-100 text-gray-700',
  TODO: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-green-100 text-green-700',
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  children?: React.ReactNode;
}

export function KanbanColumn({
  status,
  tasks,
  onRename,
  onDelete,
  children,
}: KanbanColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-3">
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            STATUS_COLORS[status],
          )}
        >
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-gray-400">{tasks.length}</span>
      </div>

      {children && <div className="px-2 pb-2">{children}</div>}

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex min-h-[40px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2',
              snapshot.isDraggingOver && 'bg-blue-50/50 rounded-lg',
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
                      onRename={onRename}
                      onDelete={onDelete}
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
