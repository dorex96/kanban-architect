import type { Task, TaskStatus } from '@kanban/types';

const STATUSES: TaskStatus[] = ['INBOX', 'TODO', 'IN_PROGRESS', 'DONE'];

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
- When the user types a goal, break it into 3–7 actionable tasks. Each title starts with an action verb (Implement, Write, Configure, Add, Fix).
- Do not create tasks that duplicate existing ones — check titles in the board state above.
- When moving tasks, use fractional positionIndex values (e.g. 1.5 to insert between 1.0 and 2.0).
- Valid task statuses: INBOX, TODO, IN_PROGRESS, DONE.
- Always confirm what you did after performing actions.
- Use the task IDs shown in brackets when referencing tasks.
- Do not invent external integrations or services that are not mentioned by the user.`;
}
