'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'call' | 'partial-call' | 'result';
  result?: unknown;
}

interface ThoughtProcessProps {
  toolInvocations: ToolInvocation[];
}

const TOOL_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  create_task: { label: 'Create Task', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: '＋' },
  create_project: { label: 'Create Project', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: '＋' },
  update_task: { label: 'Update Task', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '✎' },
  move_task: { label: 'Move Task', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: '→' },
  delete_task: { label: 'Delete Task', color: 'text-red-600 bg-red-50 border-red-200', icon: '✕' },
  list_tasks: { label: 'List Tasks', color: 'text-stone-600 bg-stone-50 border-stone-200', icon: '☰' },
  list_projects: { label: 'List Projects', color: 'text-stone-600 bg-stone-50 border-stone-200', icon: '☰' },
};

function getToolStyle(toolName: string) {
  return TOOL_STYLES[toolName] ?? {
    label: toolName,
    color: 'text-stone-600 bg-stone-50 border-stone-200',
    icon: '⚙',
  };
}

function formatArgs(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(', ');
}

export function ThoughtProcess({ toolInvocations }: ThoughtProcessProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (toolInvocations.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {toolInvocations.map((invocation) => {
        const style = getToolStyle(invocation.toolName);
        const isExpanded = expandedIds.has(invocation.toolCallId);
        const isLoading = invocation.state === 'call' || invocation.state === 'partial-call';
        const hasResult = invocation.state === 'result';
        const result = invocation.result as { success?: boolean; error?: string } | undefined;
        const isSuccess = result?.success !== false;

        return (
          <div
            key={invocation.toolCallId}
            className={cn('rounded-md border text-xs', style.color)}
          >
            <button
              onClick={() => toggleExpand(invocation.toolCallId)}
              className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left"
            >
              <span className="shrink-0 text-sm">{style.icon}</span>
              <span className="flex-1 font-medium">{style.label}</span>
              {isLoading && (
                <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {hasResult && (
                <span className={cn('shrink-0 text-sm', isSuccess ? 'text-emerald-500' : 'text-red-500')}>
                  {isSuccess ? '✓' : '✗'}
                </span>
              )}
              <span className="shrink-0 text-[10px] text-stone-400">
                {isExpanded ? '▾' : '▸'}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-current/10 px-2 py-1.5 font-mono text-[11px]">
                <div className="text-stone-500">
                  <span className="font-semibold">args:</span>{' '}
                  {formatArgs(invocation.args)}
                </div>
                {hasResult && result && (
                  <div className={cn('mt-1', isSuccess ? 'text-emerald-600' : 'text-red-600')}>
                    <span className="font-semibold">result:</span>{' '}
                    {result.error ?? 'success'}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
