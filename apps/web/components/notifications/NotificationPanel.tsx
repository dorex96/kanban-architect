'use client';

import { useEffect, useRef } from 'react';
import type { Notification } from '@kanban/types';
import { cn } from '@/lib/utils';

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onSelect: (notification: Notification) => void;
  onDelete: (id: string) => void;
  onDeleteRead: () => void;
}

export function NotificationPanel({
  notifications,
  onClose,
  onSelect,
  onDelete,
  onDeleteRead,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const hasReadNotifications = notifications.some((notification) => notification.isRead);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Notifications</span>
        <button
          onClick={onDeleteRead}
          disabled={!hasReadNotifications}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-stone-400">No notifications yet</p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li key={n.id} className="border-b border-stone-50 last:border-b-0">
                <div
                  className={cn(
                    'flex items-start gap-2 px-4 py-3 transition-colors hover:bg-stone-50',
                    !n.isRead && 'bg-violet-50 hover:bg-violet-100/60',
                  )}
                >
                  <button
                    onClick={() => {
                      onSelect(n);
                      onClose();
                    }}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.isRead ? 'bg-stone-200' : 'bg-violet-500',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-stone-700">{n.message}</p>
                      <p className="mt-0.5 text-xs text-stone-400">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>

                <button
                  onClick={() => onDelete(n.id)}
                  className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-rose-600"
                  title="Delete notification"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.5 2a1 1 0 00-1 1V4H5a1 1 0 100 2h.222l.773 9.278A2 2 0 007.988 17h4.024a2 2 0 001.993-1.722L14.778 6H15a1 1 0 100-2h-2.5V3a1 1 0 00-1-1h-3zM9.5 4v-.5h1V4h-1zm-1.27 2a.75.75 0 00-.748.812l.5 7a.75.75 0 101.496-.106l-.5-7A.75.75 0 008.23 6zm3.54 0a.75.75 0 00-.748.706l-.5 7a.75.75 0 101.496.106l.5-7A.75.75 0 0011.77 6z" clipRule="evenodd" />
                  </svg>
                </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
