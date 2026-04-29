export type TaskStatus = 'INBOX' | 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  positionIndex: number;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: number;
  startDate?: string | null;
  endDate?: string | null;
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
  taskId: string | null;
  message: string;
  isRead: boolean;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface NotificationReplyContext {
  notificationId: string;
  notificationMessage: string;
  notificationCreatedAt: string;
}

export interface Event {
  id: string;
  projectId: string;
  taskId: string | null;
  action: string;
  timestamp: string;
}

export type WeeklyCheckTriggerType = 'SCHEDULED' | 'MANUAL';
export type WeeklyCheckRunStatus = 'SUCCESS' | 'ERROR' | 'SKIP';

export interface WeeklyProjectCheckBatchSummary {
  checkedProjects: number;
  successRuns: number;
  skippedRuns: number;
  failedRuns: number;
  createdNotifications: number;
  startedAt: string;
  finishedAt: string;
  errors: string[];
}

export interface WeeklyProjectCheckRunItem {
  id: string;
  projectId: string;
  triggerType: WeeklyCheckTriggerType;
  status: WeeklyCheckRunStatus;
  tasksAnalyzed: number;
  generatedText: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string;
  createdAt: string;
}
