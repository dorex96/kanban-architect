'use client';

import { useEffect, useRef, useState } from 'react';
import type { Notification } from '@kanban/types';
import { cn } from '@/lib/utils';

interface NotificationModalProps {
  notification: Notification;
  onClose: () => void;
  onReply: (id: string, reply: string) => Promise<void>;
  onOpenSidebar: () => void;
}

export function NotificationModal({
  notification,
  onClose,
  onReply,
  onOpenSidebar,
}: NotificationModalProps) {
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSend = async () => {
    if (!reply.trim() || status !== 'idle') return;
    setStatus('sending');
    try {
      await onReply(notification.id, reply.trim());
      setStatus('sent');
    } catch {
      setStatus('idle');
    }
  };

  const handleOpenSidebar = () => {
    onClose();
    onOpenSidebar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
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

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-stone-700">{notification.message}</p>
        </div>

        {/* Reply section */}
        <div className="border-t border-stone-100 px-5 pb-5 pt-4">
          {status === 'sent' ? (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium text-emerald-600">Reply sent! ✓</p>
              <p className="text-xs text-stone-500">Open the AI Assistant to continue the conversation and see the response.</p>
              <button
                onClick={handleOpenSidebar}
                className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
              >
                Open AI Assistant
              </button>
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-xs font-medium text-stone-500">Your reply</label>
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your reply… (Enter to send)"
                rows={3}
                className={cn(
                  'w-full resize-none rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800',
                  'placeholder:text-stone-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200',
                )}
              />
              <button
                onClick={handleSend}
                disabled={!reply.trim() || status === 'sending'}
                className={cn(
                  'mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                  'bg-violet-600 hover:bg-violet-700',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {status === 'sending' ? 'Sending…' : 'Send Reply'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
