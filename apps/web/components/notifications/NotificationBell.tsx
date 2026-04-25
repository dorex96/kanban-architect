'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Notification } from '@kanban/types';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationPanel } from './NotificationPanel';
import { NotificationModal } from './NotificationModal';

interface NotificationBellProps {
  projectId: string;
  fallbackData?: Notification[];
  onOpenSidebar: (prefill?: string) => void;
}

export function NotificationBell({ projectId, fallbackData, onOpenSidebar }: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    deleteReadNotifications,
  } = useNotifications(
    projectId,
    fallbackData,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  useEffect(() => {
    if (!selected) return;
    const stillVisible = notifications.some((notification) => notification.id === selected.id);
    if (!stillVisible) {
      setSelected(null);
    }
  }, [notifications, selected]);

  const handleSelect = async (n: Notification) => {
    setSelected(n);
    if (!n.isRead) await markAsRead(n.id);
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
    if (selected?.id === id) {
      setSelected(null);
    }
  };

  const handleDeleteReadNotifications = async () => {
    await deleteReadNotifications();
    if (selected?.isRead) {
      setSelected(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        title="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setPanelOpen(false)}
          onSelect={handleSelect}
          onDelete={(id) => {
            void handleDeleteNotification(id);
          }}
          onDeleteRead={() => {
            void handleDeleteReadNotifications();
          }}
        />
      )}

      {selected && createPortal(
        <NotificationModal
          notification={selected}
          onClose={() => setSelected(null)}
          onOpenSidebar={onOpenSidebar}
          onDelete={(id) => {
            void handleDeleteNotification(id);
          }}
        />,
        document.body,
      )}
    </div>
  );
}
