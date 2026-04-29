'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Notification, NotificationReplyContext, Task } from '@kanban/types';
import { useNotifications } from '@/hooks/useNotifications';
import { useWeeklyProjectCheck } from '@/hooks/useWeeklyProjectCheck';
import { BoardWithSidebar } from './BoardWithSidebar';
import { NotificationBell } from '../notifications/NotificationBell';
import { WeeklyCheckHistoryPanel } from '../notifications/WeeklyCheckHistoryPanel';

interface BoardPageClientProps {
  projectId: string;
  projectName: string;
  fallbackTasks: Task[];
  fallbackNotifications: Notification[];
}

export function BoardPageClient({
  projectId,
  projectName,
  fallbackTasks,
  fallbackNotifications,
}: BoardPageClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prefillInput, setPrefillInput] = useState('');
  const [replyContext, setReplyContext] = useState<NotificationReplyContext | undefined>(undefined);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const notifications = useNotifications(projectId, fallbackNotifications);
  const weeklyCheck = useWeeklyProjectCheck(projectId);

  const handleOpenSidebar = (prefill = '', nextReplyContext?: NotificationReplyContext) => {
    setSidebarOpen(true);
    setPrefillInput(prefill);
    setReplyContext(nextReplyContext);
  };

  const handleToggleSidebar = (open: boolean) => {
    setSidebarOpen(open);
    if (!open) {
      setPrefillInput('');
      setReplyContext(undefined);
    }
  };

  const handleRunWeeklyCheck = async () => {
    setRunError(null);
    setIsRunningCheck(true);
    try {
      await weeklyCheck.runManualCheck(projectId);
      await notifications.mutate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run weekly check';
      setRunError(message);
    } finally {
      setIsRunningCheck(false);
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="z-10 flex shrink-0 items-center gap-3 border-b border-stone-200 bg-white/95 px-6 py-3 backdrop-blur-sm">
        <Link
          href="/"
          className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          title="Back to projects"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold tracking-tight text-stone-900">{projectName}</h1>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => void handleRunWeeklyCheck()}
            disabled={isRunningCheck}
            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunningCheck ? 'Running weekly check...' : 'Run weekly check'}
          </button>

          <div className="relative">
            <button
              onClick={() => setHistoryOpen((value) => !value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-50"
            >
              Weekly history
            </button>

            {historyOpen && (
              <WeeklyCheckHistoryPanel runs={weeklyCheck.history} loading={weeklyCheck.isLoading} />
            )}
          </div>

          <NotificationBell
            projectId={projectId}
            fallbackData={fallbackNotifications}
            onOpenSidebar={handleOpenSidebar}
          />
        </div>
      </header>

      {runError && (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-2 text-sm text-rose-700">{runError}</div>
      )}

      <div className="min-h-0 flex-1">
        <BoardWithSidebar
          projectId={projectId}
          fallbackTasks={fallbackTasks}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          prefillInput={prefillInput}
          replyContext={replyContext}
        />
      </div>
    </main>
  );
}
