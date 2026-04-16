import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV1 } from 'ai';
import type { Task, TaskStatus, ToolCall } from '@kanban/types';
import { config } from '../../config.js';
import { prisma } from '../../lib/prisma.js';
import { listTasks } from '../tasks/tasks.service.js';
import { createAgentTools } from './agent.tools.js';

const STATUSES: TaskStatus[] = ['INBOX', 'TODO', 'IN_PROGRESS', 'DONE'];

export function getModel(): LanguageModelV1 {
  switch (config.LLM_PROVIDER) {
    case 'openai':
      return createOpenAI({ apiKey: config.OPENAI_API_KEY })('gpt-4o');
    case 'anthropic':
      return createAnthropic({ apiKey: config.ANTHROPIC_API_KEY })('claude-sonnet-4-20250514');
    case 'ollama':
      return createOpenAI({
        baseURL: 'http://localhost:11434/v1',
        apiKey: 'ollama',
      })('llama3');
  }
}

export function buildSystemPrompt(tasks: Task[]): string {
  const grouped: Record<TaskStatus, Task[]> = {
    INBOX: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  let board = '';
  for (const status of STATUSES) {
    board += `\n### ${status}\n`;
    const column = grouped[status];
    if (column.length === 0) {
      board += '_(empty)_\n';
    } else {
      for (const t of column) {
        const desc = t.description ? ` — "${t.description.slice(0, 80)}"` : '';
        board += `- [${t.id}] ${t.title} (pos: ${t.positionIndex})${desc}\n`;
      }
    }
  }

  return `You are a Kanban board assistant for project management.
You can create, update, move, and delete tasks on the board using the provided tools.

## Current Board State
${board}
## Rules
- When moving tasks, use fractional positionIndex values (e.g. 1.5 to insert between 1.0 and 2.0).
- Valid task statuses: INBOX, TODO, IN_PROGRESS, DONE.
- Always confirm what you did after performing actions.
- Use the task IDs shown in brackets when referencing tasks.`;
}

export async function runAgent({ projectId, query }: { projectId: string; query: string }) {
  const tasks = await listTasks(projectId);
  const systemPrompt = buildSystemPrompt(tasks);
  const tools = createAgentTools(projectId);

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    prompt: query,
    tools,
    maxSteps: 5,
    onFinish: async ({ text, steps }) => {
      const toolCalls = extractToolCalls(steps);
      await prisma.agentLog.create({
        data: {
          projectId,
          query,
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
