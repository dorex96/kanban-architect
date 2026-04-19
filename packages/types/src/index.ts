export type TaskStatus = 'INBOX' | 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  positionIndex: number;
  createdAt: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateProjectInput {
  name: string;
}

export type Board = Record<TaskStatus, Task[]>;

export interface ToolCallResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: ToolCallResult;
}

export interface AgentLogEntry {
  id: string;
  projectId: string;
  query: string;
  reasoning: string;
  toolCalls: ToolCall[];
  status: 'success' | 'error';
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  projectId: string;
  message: string;
  isRead: boolean;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface Event {
  id: string;
  projectId: string;
  taskId: string | null;
  action: string;
  timestamp: string;
}
