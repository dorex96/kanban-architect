'use client';

import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@kanban/types';
import { useBoard } from '@/hooks/useBoard';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskInline } from './AddTaskInline';

const STATUSES: TaskStatus[] = ['INBOX', 'TODO', 'IN_PROGRESS', 'DONE'];

interface KanbanBoardProps {
  projectId: string;
  fallbackTasks: Task[];
}

export function KanbanBoard({ projectId, fallbackTasks }: KanbanBoardProps) {
  const { board, addTask, renameTask, deleteTask, moveTask } = useBoard(
    projectId,
    fallbackTasks,
  );

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const targetColumn = board[newStatus].filter((t) => t.id !== draggableId);

    let newPositionIndex: number;
    if (targetColumn.length === 0) {
      newPositionIndex = 1.0;
    } else if (destination.index === 0) {
      newPositionIndex = targetColumn[0].positionIndex / 2;
    } else if (destination.index >= targetColumn.length) {
      newPositionIndex = targetColumn[targetColumn.length - 1].positionIndex + 1.0;
    } else {
      const before = targetColumn[destination.index - 1].positionIndex;
      const after = targetColumn[destination.index].positionIndex;
      newPositionIndex = (before + after) / 2;
    }

    moveTask(draggableId, newStatus, newPositionIndex);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={board[status]}
            onRename={renameTask}
            onDelete={deleteTask}
          >
            {status === 'INBOX' && <AddTaskInline onAdd={addTask} />}
          </KanbanColumn>
        ))}
      </div>
    </DragDropContext>
  );
}
