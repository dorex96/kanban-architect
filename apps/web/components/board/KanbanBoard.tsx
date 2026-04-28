'use client';

import { useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@kanban/types';
import { useBoard } from '@/hooks/useBoard';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskInline } from './AddTaskInline';
import { SortControls, type SortBy, type SortDir } from './SortControls';

const STATUSES: TaskStatus[] = ['INBOX', 'TODO', 'IN_PROGRESS', 'DONE'];

function getDuration(task: Task): number | null {
  if (!task.startDate || !task.endDate) return null;
  return new Date(task.endDate).getTime() - new Date(task.startDate).getTime();
}

function sortTasks(tasks: Task[], sortBy: SortBy, sortDir: SortDir): Task[] {
  if (sortBy === 'position') return tasks;

  return [...tasks].sort((a, b) => {
    let aVal: number | null;
    let bVal: number | null;

    if (sortBy === 'priority') {
      aVal = a.priority;
      bVal = b.priority;
    } else if (sortBy === 'startDate') {
      aVal = a.startDate ? new Date(a.startDate).getTime() : null;
      bVal = b.startDate ? new Date(b.startDate).getTime() : null;
    } else if (sortBy === 'endDate') {
      aVal = a.endDate ? new Date(a.endDate).getTime() : null;
      bVal = b.endDate ? new Date(b.endDate).getTime() : null;
    } else {
      // duration
      aVal = getDuration(a);
      bVal = getDuration(b);
    }

    // Nulls always go to the end regardless of direction
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;

    const cmp = aVal - bVal;
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

interface KanbanBoardProps {
  projectId: string;
  fallbackTasks: Task[];
}

export function KanbanBoard({ projectId, fallbackTasks }: KanbanBoardProps) {
  const { board, addTask, renameTask, updateDescription, deleteTask, moveTask, updateTask } = useBoard(
    projectId,
    fallbackTasks,
  );
  const [sortBy, setSortBy] = useState<SortBy>('position');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const isSameColumn = source.droppableId === destination.droppableId;

    // When a non-position sort is active, disallow within-column reordering
    // since visual order is controlled by the sort, not positionIndex
    if (isSameColumn && sortBy !== 'position') return;

    if (isSameColumn && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    // For position calculation, always use the positionIndex-sorted column data
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-stone-100 bg-white px-6 py-2">
        <SortControls
          sortBy={sortBy}
          sortDir={sortDir}
          onSortByChange={(v) => { setSortBy(v); if (v === 'position') setSortDir('asc'); }}
          onSortDirToggle={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
        />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="bg-board-canvas flex flex-1 gap-4 overflow-x-auto p-6">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={sortTasks(board[status], sortBy, sortDir)}
              onRename={renameTask}
              onDescriptionUpdate={updateDescription}
              onDelete={deleteTask}
              onUpdate={updateTask}
            >
              {status === 'INBOX' && <AddTaskInline onAdd={addTask} />}
            </KanbanColumn>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
