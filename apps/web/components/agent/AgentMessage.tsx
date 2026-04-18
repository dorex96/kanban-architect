'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
}

export function AgentMessage({ role, content, toolInvocations }: AgentMessageProps) {
  const isUser = role === 'user';

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
        {content && (
          isUser ? (
            <div className="whitespace-pre-wrap break-words">{content}</div>
          ) : (
            <div className="markdown text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
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
