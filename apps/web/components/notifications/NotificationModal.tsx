'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Notification, NotificationReplyContext } from '@kanban/types';

interface NotificationModalProps {
  notification: Notification;
  onClose: () => void;
  onOpenSidebar: (prefill?: string, replyContext?: NotificationReplyContext) => void;
  onDelete: (id: string) => void;
}

export function NotificationModal({
  notification,
  onClose,
  onOpenSidebar,
  onDelete,
}: NotificationModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleReply = () => {
    onOpenSidebar('', {
      notificationId: notification.id,
      notificationMessage: notification.message,
      notificationCreatedAt: notification.createdAt,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg text-violet-600">✦</span>
            <span className="text-sm font-semibold text-stone-800">Message from AI Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="markdown text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{notification.message}</ReactMarkdown>
          </div>
        </div>

        <div className="border-t border-stone-100 px-5 pb-5 pt-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => {
                onDelete(notification.id);
                onClose();
              }}
              className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              Delete
            </button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <button
                onClick={onClose}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                Close
              </button>
              <button
                onClick={handleReply}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                Reply in Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
