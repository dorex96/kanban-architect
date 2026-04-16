'use client';

import { useState } from 'react';
import type { Task } from '@kanban/types';
import { cn } from '@/lib/utils';
import { KanbanBoard } from './KanbanBoard';
import { AgentSidebar } from '../agent/AgentSidebar';

interface BoardWithSidebarProps {
  projectId: string;
  fallbackTasks: Task[];
}

export function BoardWithSidebar({ projectId, fallbackTasks }: BoardWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1">
        <KanbanBoard projectId={projectId} fallbackTasks={fallbackTasks} />
      </div>

      {sidebarOpen && (
        <AgentSidebar projectId={projectId} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Floating toggle button (visible when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-10 flex h-12 w-12 items-center justify-center',
            'rounded-full bg-violet-600 text-white shadow-lg',
            'transition-all hover:bg-violet-700 hover:shadow-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
          )}
          title="Open AI Assistant"
        >
          <span className="text-xl">✦</span>
        </button>
      )}
    </div>
  );
}
