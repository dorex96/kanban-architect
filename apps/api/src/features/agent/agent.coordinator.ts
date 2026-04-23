import { streamText } from 'ai';
import type { LanguageModelV1 } from 'ai';
import type { ToolCall } from '@kanban/types';
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
}: {
  projectId: string;
  messages: ChatMessage[];
}) {
  const model = getModel();
  const tasks = await listTasks(projectId);
  const systemPrompt = buildSystemPrompt(tasks);
  const tools = createAgentTools(projectId);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  // Save the user message to DB
  if (lastUserMessage) {
    await prisma.chatMessage.create({
      data: { projectId, role: 'user', content: lastUserMessage },
    });
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
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
