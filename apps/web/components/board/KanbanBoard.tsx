'use client';

import { useState } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@kanban/types';
import { useBoard } from '@/hooks/useBoard';
import { KanbanColumn } from './KanbanColumn';
import { AddTaskInline } from './AddTaskInline';
import { type SortBy, type SortDir } from './SortControls';

const STATUSES: TaskStatus[] = ['INBOX', 'TODO', 'IN_PROGRESS', 'DONE'];

type ColumnSort = { sortBy: SortBy; sortDir: SortDir };
type ColumnSortState = Record<TaskStatus, ColumnSort>;

function getDurationMs(task: Task): number | null {
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
      aVal = getDurationMs(a);
      bVal = getDurationMs(b);
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

function createInitialSortState(): ColumnSortState {
  return {
    INBOX: { sortBy: 'position', sortDir: 'asc' },
    TODO: { sortBy: 'position', sortDir: 'asc' },
    IN_PROGRESS: { sortBy: 'position', sortDir: 'asc' },
    DONE: { sortBy: 'position', sortDir: 'asc' },
  };
}

export function KanbanBoard({ projectId, fallbackTasks }: KanbanBoardProps) {
  const { board, addTask, renameTask, updateDescription, deleteTask, moveTask, updateTask } = useBoard(
    projectId,
    fallbackTasks,
  );
  const [columnSorts, setColumnSorts] = useState<ColumnSortState>(createInitialSortState);

  function handleSortByChange(status: TaskStatus, value: SortBy) {
    setColumnSorts((prev) => ({
      ...prev,
      [status]: {
        sortBy: value,
        sortDir: value === 'position' ? 'asc' : prev[status].sortDir,
      },
    }));
  }

  function handleSortDirToggle(status: TaskStatus) {
    setColumnSorts((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        sortDir: prev[status].sortDir === 'asc' ? 'desc' : 'asc',
      },
    }));
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const sourceStatus = source.droppableId as TaskStatus;
    const sourceSort = columnSorts[sourceStatus];
    const isSameColumn = source.droppableId === destination.droppableId;

    // When a non-position sort is active, disallow within-column reordering
    // since visual order is controlled by the sort, not positionIndex
    if (isSameColumn && sourceSort.sortBy !== 'position') return;

    if (isSameColumn && source.index === destination.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    const destinationSort = columnSorts[newStatus];

    // Use the same sorted order as the visual column so destination.index
    // correctly maps to the right position when a custom sort is active.
    const visualColumn = sortTasks(board[newStatus], destinationSort.sortBy, destinationSort.sortDir).filter(
      (t) => t.id !== draggableId,
    );

    let newPositionIndex: number;
    if (visualColumn.length === 0) {
      newPositionIndex = 1.0;
    } else if (destination.index === 0) {
      newPositionIndex = visualColumn[0].positionIndex / 2;
    } else if (destination.index >= visualColumn.length) {
      newPositionIndex = visualColumn[visualColumn.length - 1].positionIndex + 1.0;
    } else {
      const before = visualColumn[destination.index - 1].positionIndex;
      const after = visualColumn[destination.index].positionIndex;
      newPositionIndex = (before + after) / 2;
    }

    moveTask(draggableId, newStatus, newPositionIndex);
  }

  return (
    <div className="flex h-full flex-col">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="bg-board-canvas flex flex-1 gap-4 overflow-x-auto p-6">
          {STATUSES.map((status) => {
            const sort = columnSorts[status];
            return (
              <KanbanColumn
                key={status}
                status={status}
                tasks={sortTasks(board[status], sort.sortBy, sort.sortDir)}
                sortBy={sort.sortBy}
                sortDir={sort.sortDir}
                onSortByChange={(value) => handleSortByChange(status, value)}
                onSortDirToggle={() => handleSortDirToggle(status)}
                onRename={renameTask}
                onDescriptionUpdate={updateDescription}
                onDelete={deleteTask}
                onUpdate={updateTask}
              >
                {status === 'INBOX' && <AddTaskInline onAdd={addTask} />}
              </KanbanColumn>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
