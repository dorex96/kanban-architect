'use client';

import { useState } from 'react';
import type { Task } from '@kanban/types';
import { cn } from '@/lib/utils';
import { KanbanBoard } from './KanbanBoard';
import { AgentSidebar } from '../agent/AgentSidebar';

interface BoardWithSidebarProps {
  projectId: string;
  fallbackTasks: Task[];
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
  prefillInput?: string;
}

export function BoardWithSidebar({
  projectId,
  fallbackTasks,
  sidebarOpen: controlledOpen,
  onToggleSidebar,
  prefillInput,
}: BoardWithSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const sidebarOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setSidebarOpen = (open: boolean) => {
    if (onToggleSidebar) onToggleSidebar(open);
    else setInternalOpen(open);
  };

  return (
    <div className="relative flex h-full">
      <div className="min-w-0 flex-1">
        <KanbanBoard projectId={projectId} fallbackTasks={fallbackTasks} />
      </div>

      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar container — always rendered, hidden via transform */}
      <div
        className={cn(
          // Mobile: fixed full-width overlay (sm: capped at 384px)
          'fixed inset-y-0 right-0 z-50 w-full sm:w-96',
          // Desktop: relative panel beside board
          'md:relative md:inset-auto md:z-auto md:w-96 md:shrink-0',
          // Slide transition
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <AgentSidebar
          projectId={projectId}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          initialInput={prefillInput}
        />
      </div>

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
