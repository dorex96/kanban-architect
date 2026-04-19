'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { Message } from '@ai-sdk/react';
import { useSWRConfig } from 'swr';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { AgentMessage } from './AgentMessage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AgentSidebarProps {
  projectId: string;
  onClose: () => void;
  isOpen: boolean;
  initialInput?: string;
}

interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AgentSidebar({ projectId, onClose, isOpen, initialInput }: AgentSidebarProps) {
  const { mutate } = useSWRConfig();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [initialMessages, setInitialMessages] = useState<Message[] | undefined>(undefined);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Load persisted chat history on mount
  useEffect(() => {
    let cancelled = false;
    api
      .get<PersistedMessage[]>(`/agent/messages?projectId=${projectId}`)
      .then((msgs) => {
        if (cancelled) return;
        setInitialMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as Message['role'],
            content: m.content,
          })),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setInitialMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    setInput,
  } = useChat({
    api: `${API_BASE}/agent/run`,
    body: { projectId },
    initialMessages: initialMessages ?? [],
    onFinish: () => {
      // Revalidate board data so agent-created tasks appear
      mutate(`/tasks?projectId=${projectId}`);
    },
    onError: (err) => {
      // Check if this is a configuration error from the API
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.code === 'CONFIGURATION_ERROR') {
          setConfigError(parsed.error);
          return;
        }
      } catch {
        // Not a JSON error
      }
      setConfigError(null);
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Focus input when sidebar opens (with delay for slide transition)
  useEffect(() => {
    if (isOpen && !loadingHistory) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadingHistory]);

  // Pre-fill input when opened from a notification reply
  useEffect(() => {
    if (initialInput) setInput(initialInput);
  }, [initialInput, setInput]);

  // Auto-resize textarea
  const handleAutoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  // Reset textarea height when input is cleared (after submit)
  useEffect(() => {
    if (!input) {
      const el = inputRef.current;
      if (el) el.style.height = 'auto';
    }
  }, [input]);

  async function handleClearHistory() {
    try {
      await api.delete(`/agent/messages?projectId=${projectId}`);
      setMessages([]);
      setConfigError(null);
    } catch {
      // Ignore clear errors
    }
  }

  function onFormSubmit(e: React.FormEvent) {
    setConfigError(null);
    handleSubmit(e);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFormSubmit(e);
    }
  }

  const displayError = configError ?? (error ? error.message : null);

  return (
    <div className="flex h-full flex-col border-l border-stone-200 bg-stone-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✦</span>
          <h2 className="text-sm font-semibold text-stone-900">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              title="Clear chat history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            title="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center py-8 text-sm text-stone-400">
            Loading chat history…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="text-3xl">✦</span>
            <p className="text-sm font-medium text-stone-600">AI Assistant</p>
            <p className="max-w-[240px] text-xs text-stone-400">
              Describe a goal and I&apos;ll create tasks for your board. Or ask me to organize, move, or update existing tasks.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <AgentMessage
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={message.content}
              toolInvocations={
                'toolInvocations' in message
                  ? (message.toolInvocations as Parameters<typeof AgentMessage>[0]['toolInvocations'])
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Error display */}
      {displayError && (
        <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {configError ? (
            <>
              <span className="font-semibold">Configuration Error: </span>
              {configError}
            </>
          ) : (
            <>
              <span className="font-semibold">Error: </span>
              {displayError}
            </>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={onFormSubmit} className="border-t border-stone-200 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onInput={handleAutoResize}
            onKeyDown={handleKeyDown}
            placeholder="Describe a goal or ask about tasks…"
            rows={1}
            className={cn(
              'max-h-24 min-h-[38px] flex-1 resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm',
              'overflow-y-auto',
              'placeholder:text-stone-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400',
            )}
            disabled={isLoading || loadingHistory}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || loadingHistory}
            className={cn(
              'shrink-0 rounded-lg bg-violet-600 p-2 text-white transition-colors',
              'hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            title="Send message"
          >
            {isLoading ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
