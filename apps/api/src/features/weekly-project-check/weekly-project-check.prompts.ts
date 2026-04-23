import type { Notification, Task } from '@kanban/types';

interface WeeklyProjectCheckPromptInput {
  projectName: string;
  periodStartIso: string;
  periodEndIso: string;
  tasks: Task[];
  overdueTasks: Task[];
  recentNotifications: Notification[];
}

export function buildWeeklyProjectCheckSystemPrompt(): string {
  return [
    'You are a senior project analyst for a Kanban workflow.',
    'Analyze the provided project snapshot and return concise Markdown in Italian.',
    'Use exactly these sections in order:',
    '## Criticita',
    '## Suggerimenti per la prossima settimana',
    '## Sentiment generale',
    'In Sentiment generale include one label: in linea | a rischio | critico and a short reason.',
    'Do not invent tools, integrations, or data that is not present in the input.',
  ].join('\n');
}

export function buildWeeklyProjectCheckPrompt(
  input: WeeklyProjectCheckPromptInput,
  maxChars: number,
): string {
  const tasksSection = input.tasks
    .map((task) =>
      [
        `- [${task.status}] ${task.title}`,
        `  priority=${task.priority}`,
        `  start=${task.startDate ?? 'null'}`,
        `  end=${task.endDate ?? 'null'}`,
        `  description=${compact(task.description)}`,
      ].join(' | '),
    )
    .join('\n');

  const overdueSection = input.overdueTasks
    .map((task) => `- ${task.title} | status=${task.status} | end=${task.endDate ?? 'null'} | priority=${task.priority}`)
    .join('\n');

  const notificationsSection = input.recentNotifications
    .map((notification) => `- ${notification.createdAt} | ${compact(notification.message)}`)
    .join('\n');

  const prompt = [
    '# Weekly Project State Check',
    `Project: ${input.projectName}`,
    `Period: ${input.periodStartIso} -> ${input.periodEndIso}`,
    '',
    '## Input Summary',
    `- Total tasks: ${input.tasks.length}`,
    `- Overdue tasks: ${input.overdueTasks.length}`,
    `- Notifications last 7d: ${input.recentNotifications.length}`,
    '',
    '## Tasks',
    tasksSection || '- none',
    '',
    '## Overdue Tasks',
    overdueSection || '- none',
    '',
    '## Notification History (last 7 days)',
    notificationsSection || '- none',
    '',
    'Return only the final Markdown report.',
  ].join('\n');

  return truncatePrompt(prompt, maxChars);
}

function truncatePrompt(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const marker = '\n\n[TRUNCATED TO FIT CONTEXT WINDOW]';
  const limit = Math.max(0, maxChars - marker.length);
  return `${text.slice(0, limit)}${marker}`;
}

function compact(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return '(empty)';
  return normalized.length > 220 ? `${normalized.slice(0, 220)}...` : normalized;
}
