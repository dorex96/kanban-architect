import { streamText } from 'ai';
import type { LanguageModelV1 } from 'ai';
import type { Prisma } from '@prisma/client';
import type { NotificationReplyContext, ToolCall } from '@kanban/types';
import { prisma } from '../../lib/prisma.js';
import { listTasks } from '../tasks/tasks.service.js';
import { createAgentTools } from './agent.tools.js';
import { buildSystemPrompt } from './agent.prompts.js';
import { getModel as getProviderModel } from './providers/base.js';
export { ConfigurationError } from './providers/base.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function getModel(): LanguageModelV1 {
  return getProviderModel();
}

export async function runAgent({
  projectId,
  messages,
  replyContext,
}: {
  projectId: string;
  messages: ChatMessage[];
  replyContext?: NotificationReplyContext;
}) {
  const model = getModel();
  const tasks = await listTasks(projectId);
  const systemPrompt = buildSystemPrompt(tasks);
  const tools = createAgentTools(projectId);
  const contextualMessages = applyReplyContext(messages, replyContext);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  // Save the user message to DB
  if (lastUserMessage) {
    await prisma.chatMessage.create({
      data: {
        projectId,
        role: 'user',
        content: lastUserMessage,
        replyContext: replyContext
          ? ({
              notificationId: replyContext.notificationId,
              notificationMessage: replyContext.notificationMessage,
              notificationCreatedAt: replyContext.notificationCreatedAt,
            } satisfies Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: contextualMessages,
    tools,
    maxSteps: 5,
    onFinish: async ({ text, steps }) => {
      // Save the assistant response to DB
      if (text) {
        await prisma.chatMessage.create({
          data: { projectId, role: 'assistant', content: text },
        });
      }

      const toolCalls = extractToolCalls(steps);
      await prisma.agentLog.create({
        data: {
          projectId,
          query: lastUserMessage,
          reasoning: text,
          toolCalls: toolCalls as unknown as Parameters<typeof prisma.agentLog.create>[0]['data']['toolCalls'],
          status: 'success',
        },
      });
    },
  });

  return result;
}

function applyReplyContext(messages: ChatMessage[], replyContext?: NotificationReplyContext): ChatMessage[] {
  if (!replyContext) {
    return messages;
  }

  const enriched = [...messages];
  for (let i = enriched.length - 1; i >= 0; i -= 1) {
    if (enriched[i].role !== 'user') {
      continue;
    }

    const sourceMessage = replyContext.notificationMessage.length > 2000
      ? `${replyContext.notificationMessage.slice(0, 2000)}...`
      : replyContext.notificationMessage;
    const userReply = enriched[i].content;
    enriched[i] = {
      ...enriched[i],
      content: [
        '[Reply Context]',
        'The user opened chat via "Reply in Chat" from an app notification.',
        `Notification ID: ${replyContext.notificationId}`,
        `Notification createdAt: ${replyContext.notificationCreatedAt}`,
        'Original notification message:',
        sourceMessage,
        '',
        'Treat this as a direct follow-up to that notification and answer in that context.',
        'Important safety rule for follow-ups: if the user reply is ambiguous or very short (for example: "Implementato", "Fatto", "Ok"), do not apply bulk changes to multiple tasks.',
        'When ambiguity exists, ask a clarification question, or at most act on exactly one clearly identified task.',
        '',
        `User reply: ${userReply}`,
      ].join('\n'),
    };
    break;
  }

  return enriched;
}

function extractToolCalls(
  steps: Array<{ toolCalls?: Array<{ toolCallId: string; toolName: string; args: unknown }>; toolResults?: Array<{ toolCallId: string; result: unknown }> }>,
): ToolCall[] {
  return steps.flatMap((step) =>
    (step.toolCalls ?? []).map((tc) => ({
      id: tc.toolCallId,
      name: tc.toolName,
      args: tc.args as Record<string, unknown>,
      result: step.toolResults?.find((tr) => tr.toolCallId === tc.toolCallId)?.result as
        | ToolCall['result']
        | undefined,
    })),
  );
}
