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
}

export function NotificationPanel({ notifications, onClose, onSelect }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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
      <div className="border-b border-stone-100 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Notifications</span>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-stone-400">No notifications yet</p>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    onSelect(n);
                    onClose();
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50',
                    !n.isRead && 'bg-violet-50 hover:bg-violet-100/60',
                  )}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
