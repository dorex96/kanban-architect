'use client';

import { useState } from 'react';

interface AddTaskInlineProps {
  onAdd: (title: string) => Promise<void>;
}

export function AddTaskInline({ onAdd }: AddTaskInlineProps) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title…"
        className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm shadow-sm placeholder:text-stone-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
        disabled={submitting}
      />
      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
}
