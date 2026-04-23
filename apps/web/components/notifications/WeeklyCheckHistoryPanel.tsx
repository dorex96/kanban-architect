'use client';

import type { WeeklyProjectCheckRunItem } from '@kanban/types';
import { cn } from '@/lib/utils';

interface WeeklyCheckHistoryPanelProps {
  runs: WeeklyProjectCheckRunItem[];
  loading?: boolean;
}

function statusLabel(status: WeeklyProjectCheckRunItem['status']): string {
  switch (status) {
    case 'SUCCESS':
      return 'Success';
    case 'ERROR':
      return 'Error';
    case 'SKIP':
      return 'Skip';
  }
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function WeeklyCheckHistoryPanel({ runs, loading }: WeeklyCheckHistoryPanelProps) {
  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-[26rem] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl">
      <div className="border-b border-stone-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Weekly Check History</p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-5 text-sm text-stone-500">Loading history...</p>
        ) : runs.length === 0 ? (
          <p className="px-4 py-5 text-sm text-stone-400">No weekly checks yet</p>
        ) : (
          <ul>
            {runs.map((run) => (
              <li key={run.id} className="border-b border-stone-100 px-4 py-3 last:border-b-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      run.status === 'SUCCESS' && 'bg-emerald-100 text-emerald-700',
                      run.status === 'ERROR' && 'bg-rose-100 text-rose-700',
                      run.status === 'SKIP' && 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {statusLabel(run.status)}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-stone-400">{run.triggerType}</span>
                  <span className="ml-auto text-xs text-stone-400">{timeAgo(run.createdAt)}</span>
                </div>

                <p className="mt-1 text-xs text-stone-500">
                  Tasks analyzed: <span className="font-medium text-stone-700">{run.tasksAnalyzed}</span>
                </p>

                {run.errorMessage && <p className="mt-1 text-xs text-rose-600">{run.errorMessage}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
