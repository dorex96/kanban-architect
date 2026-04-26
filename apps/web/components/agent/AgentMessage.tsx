'use client';

import type { NotificationReplyContext } from '@kanban/types';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { cn } from '@/lib/utils';
import { ThoughtProcess } from './ThoughtProcess';

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: 'call' | 'partial-call' | 'result';
  result?: unknown;
}

interface AgentMessageProps {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
  replyContext?: NotificationReplyContext;
}

function truncateReplyContext(text: string, maxLength = 220): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function AgentMessage({ role, content, toolInvocations, replyContext }: AgentMessageProps) {
  const isUser = role === 'user';
  const contextPreview = replyContext ? truncateReplyContext(replyContext.notificationMessage) : null;

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-violet-600 text-white'
            : 'bg-white text-stone-800 shadow-sm ring-1 ring-stone-200',
        )}
      >
        {isUser && contextPreview && (
          <div className="mb-2 rounded-lg border border-white/25 bg-white/10 px-2.5 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-100/90">
              Reply to notification
            </p>
            <p className="whitespace-pre-wrap break-words text-xs text-violet-50/95">{contextPreview}</p>
          </div>
        )}

        {content && (
          isUser ? (
            <div className="whitespace-pre-wrap break-words">{content}</div>
          ) : (
            <MarkdownContent content={content} className="text-sm" />
          )
        )}
        {toolInvocations && toolInvocations.length > 0 && (
          <ThoughtProcess toolInvocations={toolInvocations} />
        )}
        {!content && (!toolInvocations || toolInvocations.length === 0) && (
          <div className="flex items-center gap-2 py-1">
            <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" style={{ animationDelay: '0ms' }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" style={{ animationDelay: '150ms' }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-stone-400" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}
