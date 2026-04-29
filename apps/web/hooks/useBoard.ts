'use client';

import useSWR from 'swr';
import type { Task, TaskStatus, Board } from '@kanban/types';
import { api } from '@/lib/api';

const STATUSES: TaskStatus[] = ['INBOX', 'TODO', 'IN_PROGRESS', 'DONE'];

function groupByStatus(tasks: Task[]): Board {
  const board: Board = { INBOX: [], TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const task of tasks) {
    board[task.status].push(task);
  }
  for (const status of STATUSES) {
    board[status].sort((a, b) => a.positionIndex - b.positionIndex);
  }
  return board;
}

function flattenBoard(board: Board): Task[] {
  return STATUSES.flatMap((s) => board[s]);
}

export function useBoard(projectId: string, fallbackTasks?: Task[]) {
  const { data, error, isLoading, mutate } = useSWR<Board>(
    `/tasks?projectId=${projectId}`,
    async () => {
      const tasks = await api.get<Task[]>(`/tasks?projectId=${projectId}`);
      return groupByStatus(tasks);
    },
    { fallbackData: fallbackTasks ? groupByStatus(fallbackTasks) : undefined },
  );

  const board: Board = data ?? { INBOX: [], TODO: [], IN_PROGRESS: [], DONE: [] };

  async function addTask(title: string) {
    const optimistic: Task = {
      id: `temp-${Date.now()}`,
      projectId,
      title,
      description: '',
      status: 'INBOX',
      positionIndex: (board.INBOX.at(-1)?.positionIndex ?? 0) + 1,
      priority: 3,
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
    };
    const optimisticBoard = {
      ...board,
      INBOX: [...board.INBOX, optimistic],
    };
    await mutate(
      async () => {
        const created = await api.post<Task>('/tasks', { projectId, title });
        const tasks = flattenBoard(board).filter((t) => t.id !== optimistic.id);
        tasks.push(created);
        return groupByStatus(tasks);
      },
      { optimisticData: optimisticBoard, rollbackOnError: true },
    );
  }

  async function renameTask(id: string, title: string) {
    const prev = board;
    const optimisticBoard = Object.fromEntries(
      STATUSES.map((s) => [
        s,
        board[s].map((t) => (t.id === id ? { ...t, title } : t)),
      ]),
    ) as Board;
    await mutate(
      async () => {
        await api.patch<Task>(`/tasks/${id}`, { title });
        return optimisticBoard;
      },
      { optimisticData: optimisticBoard, rollbackOnError: true },
    );
  }

  async function updateDescription(id: string, description: string) {
    const optimisticBoard = Object.fromEntries(
      STATUSES.map((s) => [
        s,
        board[s].map((t) => (t.id === id ? { ...t, description } : t)),
      ]),
    ) as Board;
    await mutate(
      async () => {
        await api.patch<Task>(`/tasks/${id}`, { description });
        return optimisticBoard;
      },
      { optimisticData: optimisticBoard, rollbackOnError: true },
    );
  }

  async function deleteTask(id: string) {
    const optimisticBoard = Object.fromEntries(
      STATUSES.map((s) => [s, board[s].filter((t) => t.id !== id)]),
    ) as Board;
    await mutate(
      async () => {
        await api.delete(`/tasks/${id}`);
        return optimisticBoard;
      },
      { optimisticData: optimisticBoard, rollbackOnError: true },
    );
  }

  async function moveTask(
    taskId: string,
    newStatus: TaskStatus,
    newPositionIndex: number,
  ): Promise<{ blocked: true; reason: string } | undefined> {
    const task = flattenBoard(board).find((t) => t.id === taskId);
    if (!task) return;

    // Block INBOX → TODO if dates are missing
    if (task.status === 'INBOX' && newStatus === 'TODO') {
      if (!task.startDate || !task.endDate) {
        return {
          blocked: true,
          reason: 'This task needs a start date and end date before it can move to TODO. Open the task card to set them.',
        };
      }
    }

    const moved = { ...task, status: newStatus, positionIndex: newPositionIndex };

    const optimisticBoard = Object.fromEntries(
      STATUSES.map((s) => {
        const col = board[s].filter((t) => t.id !== taskId);
        if (s === newStatus) {
          col.push(moved);
          col.sort((a, b) => a.positionIndex - b.positionIndex);
        }
        return [s, col];
      }),
    ) as Board;

    await mutate(
      async () => {
        await api.patch<Task>(`/tasks/${taskId}`, { status: newStatus });
        await api.patch<Task>(`/tasks/${taskId}/reorder`, {
          positionIndex: newPositionIndex,
        });
        return optimisticBoard;
      },
      { optimisticData: optimisticBoard, rollbackOnError: true },
    );
  }

  async function updateTask(id: string, data: { priority?: number; startDate?: string | null; endDate?: string | null }) {
    const optimisticBoard = Object.fromEntries(
      STATUSES.map((s) => [
        s,
        board[s].map((t) => (t.id === id ? { ...t, ...data } : t)),
      ]),
    ) as Board;
    await mutate(
      async () => {
        await api.patch<Task>(`/tasks/${id}`, data);
        return optimisticBoard;
      },
      { optimisticData: optimisticBoard, rollbackOnError: true },
    );
  }

  return { board, isLoading, error, addTask, renameTask, updateDescription, deleteTask, moveTask, updateTask };
}
