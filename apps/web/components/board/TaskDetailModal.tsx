'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Task } from '@kanban/types';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Lightweight markdown renderer — no external deps
// Handles: headings, bold, italic, inline code, fenced code blocks,
//          unordered/ordered lists, blockquotes, links, hr, paragraphs.
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      let end = i + 1;
      while (end < lines.length && !lines[end].startsWith('```')) end++;
      const code = lines.slice(i + 1, end).join('\n');
      nodes.push(<pre key={key++}><code>{code}</code></pre>);
      i = end < lines.length ? end + 1 : lines.length;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      nodes.push(<hr key={key++} />);
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++} dangerouslySetInnerHTML={{ __html: parseInline(line.slice(4)) }} />);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={key++} dangerouslySetInnerHTML={{ __html: parseInline(line.slice(3)) }} />);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={key++} dangerouslySetInnerHTML={{ __html: parseInline(line.slice(2)) }} />);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote key={key++} dangerouslySetInnerHTML={{ __html: parseInline(quoteLines.join(' ')) }} />,
      );
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++}>
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(
        <ol key={key++}>
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ol>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect consecutive "plain" lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,6} /.test(lines[i]) &&
      !/^> /.test(lines[i]) &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !lines[i].startsWith('```') &&
      !/^-{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} dangerouslySetInnerHTML={{ __html: parseInline(paraLines.join('\n').replace(/\n/g, '<br/>')) }} />,
      );
    }
  }

  return <div className="markdown text-sm">{nodes}</div>;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface TaskDetailModalProps {
  task: Task;
  onSave: (description: string) => Promise<void>;
  onClose: () => void;
}

export function TaskDetailModal({ task, onSave, onClose }: TaskDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState(task.description);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep draft in sync if task prop updates externally
  useEffect(() => {
    setDraft(task.description);
  }, [task.description]);

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

        {/* Body */}
        {mode === 'view' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {task.description.trim() ? (
              <MarkdownRenderer content={task.description} />
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
                  <MarkdownRenderer content={draft} />
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
