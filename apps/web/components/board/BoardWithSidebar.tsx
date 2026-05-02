'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NotificationReplyContext, Task } from '@kanban/types';
import { cn } from '@/lib/utils';
import { KanbanBoard } from './KanbanBoard';
import { AgentSidebar } from '../agent/AgentSidebar';

const MIN_WIDTH = 280;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 384;

interface BoardWithSidebarProps {
  projectId: string;
  fallbackTasks: Task[];
  sidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
  prefillInput?: string;
  replyContext?: NotificationReplyContext;
}

export function BoardWithSidebar({
  projectId,
  fallbackTasks,
  sidebarOpen: controlledOpen,
  onToggleSidebar,
  prefillInput,
  replyContext,
}: BoardWithSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const sidebarOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setSidebarOpen = (open: boolean) => {
    if (onToggleSidebar) onToggleSidebar(open);
    else setInternalOpen(open);
  };

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = startX.current - e.clientX;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
    setSidebarWidth(newWidth);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

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
          // Desktop: relative panel beside board, width controlled by state
          'md:relative md:inset-auto md:z-auto md:shrink-0',
          // Slide transition (disable during drag to avoid jank)
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width: sidebarOpen ? `${sidebarWidth}px` : undefined }}
      >
        {/* Resize handle — desktop only */}
        {sidebarOpen && (
          <div
            onMouseDown={startResize}
            className="absolute inset-y-0 left-0 z-10 hidden w-1 cursor-col-resize md:block hover:bg-violet-400 active:bg-violet-500 transition-colors"
            title="Drag to resize"
          />
        )}
        <AgentSidebar
          projectId={projectId}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
          initialInput={prefillInput}
          replyContext={replyContext}
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
