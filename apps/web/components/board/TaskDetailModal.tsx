'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '@kanban/types';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Priority config
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<number, { label: string; active: string; hover: string }> = {
  1: { label: 'P1', active: 'bg-red-100 text-red-700', hover: 'hover:bg-red-50 hover:text-red-600' },
  2: { label: 'P2', active: 'bg-orange-100 text-orange-700', hover: 'hover:bg-orange-50 hover:text-orange-600' },
  3: { label: 'P3', active: 'bg-yellow-100 text-yellow-700', hover: 'hover:bg-yellow-50 hover:text-yellow-600' },
  4: { label: 'P4', active: 'bg-blue-100 text-blue-700', hover: 'hover:bg-blue-50 hover:text-blue-600' },
  5: { label: 'P5', active: 'bg-stone-100 text-stone-500', hover: 'hover:bg-stone-100 hover:text-stone-600' },
};

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface TaskDetailModalProps {
  task: Task;
  onSave: (description: string) => Promise<void>;
  onUpdateMeta?: (data: { priority?: number; startDate?: string | null; endDate?: string | null }) => Promise<void>;
  onClose: () => void;
}

export function TaskDetailModal({ task, onSave, onUpdateMeta, onClose }: TaskDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState(task.description);
  const [saving, setSaving] = useState(false);
  const [priority, setPriority] = useState(task.priority ?? 3);
  const [startDate, setStartDate] = useState(task.startDate ? task.startDate.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(task.endDate ? task.endDate.slice(0, 10) : '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(task.description);
  }, [task.description]);

  useEffect(() => {
    setPriority(task.priority ?? 3);
    setStartDate(task.startDate ? task.startDate.slice(0, 10) : '');
    setEndDate(task.endDate ? task.endDate.slice(0, 10) : '');
  }, [task.priority, task.startDate, task.endDate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') mode === 'edit' ? handleCancel() : onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onClose]);

  useEffect(() => {
    if (mode === 'edit') textareaRef.current?.focus();
  }, [mode]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      setMode('view');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(task.description);
    setMode('view');
  }

  async function handlePriorityChange(p: number) {
    setPriority(p);
    await onUpdateMeta?.({ priority: p });
  }

  async function handleDateChange(field: 'startDate' | 'endDate', value: string) {
    const isoValue = value ? new Date(value).toISOString() : null;
    if (field === 'startDate') setStartDate(value);
    else setEndDate(value);
    await onUpdateMeta?.({ [field]: isoValue });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && mode === 'view') onClose(); }}
    >
      <div
        className={cn(
          'flex w-full flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl transition-all duration-200',
          mode === 'edit' ? 'max-w-4xl' : 'max-w-xl',
        )}
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="truncate pr-4 text-base font-semibold tracking-tight text-stone-900">
            {task.title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Meta section */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-stone-100 bg-stone-50/50 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-400">Priority</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriorityChange(p)}
                  className={cn(
                    'h-6 w-8 rounded text-xs font-semibold transition-colors',
                    p === priority
                      ? PRIORITY_CONFIG[p].active
                      : `bg-stone-100 text-stone-400 ${PRIORITY_CONFIG[p].hover}`,
                  )}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-400">Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="rounded border border-stone-200 px-2 py-0.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-400">End</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="rounded border border-stone-200 px-2 py-0.5 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        {mode === 'view' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {task.description.trim() ? (
              <MarkdownContent content={task.description} className="text-sm" />
            ) : (
              <p className="text-sm italic text-stone-400">No description yet. Click Edit to add one.</p>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 divide-x divide-stone-200 overflow-hidden">
            {/* Editor pane */}
            <div className="flex w-1/2 flex-col">
              <div className="shrink-0 border-b border-stone-100 px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Markdown</span>
              </div>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={'Write your description in Markdown…\n\n## Section heading\n**bold**, *italic*, `code`\n- list item\n- list item'}
                className="min-h-0 flex-1 resize-none px-4 py-3 font-mono text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none"
                style={{ minHeight: '320px' }}
              />
            </div>

            {/* Preview pane */}
            <div className="flex w-1/2 flex-col">
              <div className="shrink-0 border-b border-stone-100 px-4 py-2">
                <span className="text-xs font-medium uppercase tracking-wider text-stone-400">Preview</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                {draft.trim() ? (
                  <MarkdownContent content={draft} className="text-sm" />
                ) : (
                  <p className="text-sm italic text-stone-300">Preview will appear here…</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-stone-200 px-6 py-4">
          {mode === 'view' ? (
            <button
              onClick={() => setMode('edit')}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
