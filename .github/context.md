# Project Context — kanban-architect

> Living document. Update after every significant change (new file, new dependency, schema change, milestone).

## Current State

- **Phase:** Weekly AI project-state check full-stack integration in progress, with notifications soft delete now implemented end-to-end (DB `deletedAt`, API delete endpoints, optimistic UI delete actions, and backend notification tests).
- **Package manager:** npm 11.10.0 with workspaces
- **Node version:** 22.19.0
- **`apps/web/`:** Next.js 14.2 with Tailwind, project list at `/` (add/rename/delete), board view at `/board/[projectId]` with DnD columns, `useProjects` + `useBoard` SWR hooks, `lib/api.ts` client. Board sorting is now configurable independently per column (criterion + direction) with drag-and-drop reorder enabled only when a column uses default order. Agent chat sidebar via `BoardWithSidebar` + `AgentSidebar` + `AgentMessage` + `ThoughtProcess` components, using `useChat` from `@ai-sdk/react`.
- **`apps/api/`:** Hono with CORS, global error handler, `GET /health`, full Project CRUD (including `GET /projects/:id`) & Task CRUD endpoints, Agent streaming endpoint (`POST /agent/run` with useChat-compatible messages format), chat history endpoints (`GET/DELETE /agent/messages`), agent logs (`GET /agent/logs`), internal deterministic check endpoint (`POST /internal/task-health/run-once`), weekly-check internal endpoints (`POST /internal/weekly-project-check/run-once` with optional `projectId`, `GET /internal/weekly-project-check/history?projectId=&limit=`), Prisma client, Zod config. Streamed agent errors now return specific messages to the client (instead of generic text). Agent tools and system prompt now expose task `priority`, `startDate`, and `endDate`, so the AI can read, set, reschedule, and clear task timing metadata. Deterministic in-app scheduler is controlled via env vars and runs deadline/workload checks with notification dedupe. Weekly-check service applies immediate retry/backoff (1s, 3s by default) for transient LLM failures. **Feature-Based (Vertical Slice) Architecture** — `features/`, `lib/`, `middlewares/`, `common`.
- **`packages/types/`:** Shared types: `Task`, `TaskStatus`, `Project`, `Event`, `AgentLogEntry`, `ToolCall`, `ToolCallResult`, `CreateTaskInput`, `UpdateTaskInput`, `UpdateProjectInput`, `Board`, `WeeklyProjectCheckBatchSummary`, `WeeklyProjectCheckRunItem`.
- **Database:** PostgreSQL via local install. Prisma schema with 7 models (Project, Task, Event, AgentLog, ChatMessage, Notification, WeeklyProjectCheckRun), migrations applied.
- **README:** Includes a clear "Project Status: Work in Progress" section for public-repo expectations.

## Build Progress

| Milestone | Status | Key files |
|---|---|---|
| Root monorepo config | DONE | `package.json`, `turbo.json`, `tsconfig.json`, `.gitignore`, `.npmrc` |
| Shared types package | DONE | `packages/types/src/index.ts`, `packages/types/package.json` |
| Prisma schema + migrations | DONE | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/` |
| API scaffold (Hono entry) | DONE | `apps/api/src/index.ts`, `config.ts`, `lib/prisma.ts`, `lib/errors.ts`, `middlewares/error-handler.ts` |
| Project & Task features | DONE | `apps/api/src/features/projects/`, `features/tasks/`, `features/events/` |
| Common schemas | DONE | `apps/api/src/common/schemas.ts` |
| Frontend scaffold (Next.js) | DONE | `apps/web/app/layout.tsx`, `app/page.tsx`, `lib/api.ts`, `lib/utils.ts` |
| Project list UI (CRUD) | DONE | `components/projects/ProjectList.tsx`, `ProjectCard.tsx`, `AddProjectForm.tsx`, `hooks/useProjects.ts` |
| KanbanBoard + DnD | DONE | `apps/web/app/board/[projectId]/page.tsx`, `components/board/KanbanBoard.tsx`, `KanbanColumn.tsx`, `TaskCard.tsx`, `AddTaskInline.tsx`, `hooks/useBoard.ts` |
| Agent tools layer | DONE | `apps/api/src/features/agent/agent.tools.ts` |
| Agent coordinator + SSE | DONE | `apps/api/src/features/agent/agent.coordinator.ts`, `agent.router.ts`, `agent.prompts.ts` |
| Agent chat persistence | DONE | `apps/api/prisma/migrations/20260416230000_add_chat_messages/` |
| AgentSidebar + ThoughtProcess | DONE | `apps/web/components/agent/AgentSidebar.tsx`, `AgentMessage.tsx`, `ThoughtProcess.tsx`, `components/board/BoardWithSidebar.tsx` |
| Deterministic task-health scheduler (deadline/workload checks) | IN PROGRESS | `apps/api/src/features/task-health/task-health.service.ts`, `task-health.scheduler.ts`, `task-health.router.ts`, `apps/api/src/config.ts`, `apps/api/.env.example` |
| Weekly AI project-state check (backend) | IN PROGRESS | `apps/api/src/features/weekly-project-check/`, `apps/api/src/features/agent/providers/base.ts`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20260423101500_add_weekly_project_check_run/` |
| Weekly-check web integration | IN PROGRESS | `apps/web/components/board/BoardPageClient.tsx`, `apps/web/hooks/useWeeklyProjectCheck.ts`, `apps/web/components/notifications/WeeklyCheckHistoryPanel.tsx`, `apps/web/components/notifications/NotificationModal.tsx` |
| Notifications soft delete (single + bulk read) | DONE | `apps/api/prisma/migrations/20260425114542_notification_soft_delete/`, `apps/api/src/features/notifications/`, `apps/web/hooks/useNotifications.ts`, `apps/web/components/notifications/NotificationBell.tsx`, `NotificationPanel.tsx`, `NotificationModal.tsx` |
| Chat UI improvements | DONE | Markdown rendering in agent messages, responsive sidebar (mobile overlay + desktop panel with slide transition), auto-resize textarea, typing indicator animation |
| Docker compose (working) | DONE | `docker-compose.yml` (PostgreSQL 16, optional — local PG used) |
| API tests (weekly-check slice) | DONE | `apps/api/src/features/weekly-project-check/*.test.ts`, `apps/api/vitest.config.ts` |

## Installed Dependencies

| Package | Where | Version | Purpose |
|---|---|---|---|
| `turbo` | root | ^2.4.0 (2.8.20) | Monorepo orchestration |
| `typescript` | root + all | ^5.7.0 (5.9.3) | Type checking |
| `next` | `apps/web` | ^14.2.0 (14.2.35) | App Router frontend |
| `react`, `react-dom` | `apps/web` | ^18.3.0 | React |
| `tailwindcss` | `apps/web` | ^3.4.0 | Styling |
| `postcss`, `autoprefixer` | `apps/web` | ^8.4.0, ^10.4.0 | CSS processing |
| `swr` | `apps/web` | ^2.2.0 | Data fetching + optimistic updates |
| `@hello-pangea/dnd` | `apps/web` | ^17.0.0 | Drag and drop |
| `ai`, `@ai-sdk/react` | `apps/web` | ^4.1.0, ^1.1.0 | `useChat` for SSE streaming |
| `react-markdown` | `apps/web` | ^9.x | Markdown rendering in agent messages |
| `remark-gfm` | `apps/web` | ^4.x | GitHub-flavored markdown support |
| `clsx`, `tailwind-merge` | `apps/web` | ^2.1.0, ^2.6.0 | `cn()` utility |
| `hono`, `@hono/node-server` | `apps/api` | ^4.6.0, ^1.13.0 | HTTP framework |
| `prisma`, `@prisma/client` | `apps/api` | ^6.2.0 (6.19.2) | ORM |
| `zod` | `apps/api` | ^3.24.0 | Validation |
| `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic` | `apps/api` | ^4.1.0, ^1.1.0 | `streamText` + provider models |
| `tsx` | `apps/api` | ^4.19.0 | Dev runner |
| `@hono/zod-validator` | `apps/api` | ^0.4.x | Zod request validation middleware |
| `node-cron` | `apps/api` | ^4.2.1 | Timezone-aware weekly cron scheduler |
| `vitest` | `apps/api` | 4.1.5 | Automated tests for backend slices |

## Active Decisions

- Using Feature-Based (Vertical Slice) Architecture for the API: `features/`, `lib/`, `middlewares/`, `common/`.
- Using npm workspaces (not pnpm) with Node 22.
- Local PostgreSQL (not Docker) for development. Docker Compose available as optional.
- DB connection URL: `postgresql://postgres:postgres@host.docker.internal:5432/kanban-architect`
- Anthropic model selection is configurable via `ANTHROPIC_MODEL` (default: `claude-3-5-sonnet-latest`).

## Known Issues

- PowerShell 5.1 `Set-Content -Encoding utf8` writes BOM — turbo can't parse JSON with BOM. Use `[System.IO.File]::WriteAllText()` with `UTF8Encoding($false)` or create files via other tools.

## File Index

> Add entries as files are created. Format: `path → one-line purpose`.

`package.json` → Root monorepo config (npm workspaces, turbo scripts)
`turbo.json` → Turborepo task pipeline (build, dev, lint)
`tsconfig.json` → Base TypeScript config (strict, ES2022, composite)
`.gitignore` → Git ignore rules
`.npmrc` → npm config (save-exact=true)
`.env.example` → Environment variable template
`.env` → Local environment variables (gitignored)
`docker-compose.yml` → PostgreSQL 16 service (optional)
`packages/types/package.json` → @kanban/types package config
`packages/types/tsconfig.json` → Types package TS config
`packages/types/src/index.ts` → Shared type definitions (Task, Project, Event, AgentLogEntry, etc.)
`apps/api/package.json` → @kanban/api package config
`apps/api/tsconfig.json` → API TS config (NodeNext module)
`apps/api/.env` → API local env (DATABASE_URL)
`apps/api/.env.example` → API env template
`apps/api/src/index.ts` → Hono entry point (CORS, health check, mounts feature routers, port 4000)
`apps/api/src/config.ts` → Zod-parsed environment config
`apps/api/src/lib/prisma.ts` → Prisma singleton client
`apps/api/src/lib/errors.ts` → HttpError class
`apps/api/src/middlewares/error-handler.ts` → Global error handler middleware (HttpError → JSON)
`apps/api/src/common/schemas.ts` → Shared Zod schemas (taskStatusEnum)
`apps/api/src/features/events/events.service.ts` → logEvent(projectId, action, taskId?) — writes to Event table
`apps/api/src/features/projects/projects.schema.ts` → Zod schemas for project routes
`apps/api/src/features/projects/projects.service.ts` → getProject, listProjects, createProject, updateProject, deleteProject
`apps/api/src/features/projects/projects.router.ts` → GET/GET:id/POST/PATCH/DELETE /projects
`apps/api/src/features/tasks/tasks.schema.ts` → Zod schemas for task routes
`apps/api/src/features/tasks/tasks.service.ts` → listTasks, createTask (positionIndex auto), updateTask, deleteTask, reorderTask
`apps/api/src/features/tasks/tasks.router.ts` → GET/POST/PATCH/DELETE /tasks + PATCH /tasks/:id/reorder
`apps/api/prisma/schema.prisma` → Database schema (Project, Task, Event, AgentLog)
`apps/web/package.json` → @kanban/web package config
`apps/web/tsconfig.json` → Frontend TS config (Next.js)
`apps/web/next.config.js` → Next.js config (transpilePackages)
`apps/web/tailwind.config.ts` → Tailwind CSS config
`apps/web/postcss.config.js` → PostCSS config
`apps/web/.env.local` → Frontend local env (API URL)
`apps/web/.env.example` → Frontend env template
`apps/web/app/layout.tsx` → Root layout (HTML, body, Tailwind globals)
`apps/web/app/globals.css` → Tailwind directives
`apps/web/app/page.tsx` → Projects landing page (server component, fetches initial data)
`apps/web/lib/utils.ts` → cn() utility (clsx + tailwind-merge)
`apps/web/lib/api.ts` → Centralized API client (get, post, patch, delete, 204-safe response parsing)
`apps/web/hooks/useProjects.ts` → SWR hook for project CRUD (list, add, rename, delete) with optimistic updates
`apps/web/components/projects/ProjectList.tsx` → Client component: renders project list with add form and cards
`apps/web/components/projects/ProjectCard.tsx` → Client component: project card with inline rename, delete confirmation modal, link to board
`apps/web/components/projects/AddProjectForm.tsx` → Client component: form to create a new project
`apps/web/app/board/[projectId]/page.tsx` → Board page (server component, fetches project + tasks SSR)
`apps/web/hooks/useBoard.ts` → SWR hook for board data (grouped by status) + task CRUD with optimistic updates
`apps/web/components/board/KanbanBoard.tsx` → Client component: DragDropContext, 4 columns, onDragEnd with fractional positionIndex
`apps/web/components/board/KanbanColumn.tsx` → Client component: Droppable column with status header + task cards
`apps/web/components/board/TaskCard.tsx` → Client component: Draggable task card with inline rename + delete
`apps/web/components/board/AddTaskInline.tsx` → Client component: inline form to create a new task (appears in Inbox column)
`apps/web/components/board/BoardWithSidebar.tsx` → Client component: flex layout wrapper, manages sidebar open/close, integrates KanbanBoard + AgentSidebar
`apps/web/components/agent/AgentSidebar.tsx` → Client component: chat sidebar with useChat, DB-persisted message history, SWR board revalidation
`apps/web/components/agent/AgentMessage.tsx` → Client component: single chat bubble (user/assistant), renders ThoughtProcess for tool calls
`apps/web/components/agent/ThoughtProcess.tsx` → Client component: expandable tool-call cards with status indicators, color-coded by tool type
`apps/api/src/features/task-health/task-health.service.ts` → Deterministic task-health checks (deadline soon, overdue, workload thresholds) with deduped notification creation
`apps/api/src/features/task-health/task-health.scheduler.ts` → Env-toggled in-app scheduler bootstrap (`start`, `stop`, `runOnce`) with overlap guard and cycle logging
`apps/api/src/features/task-health/task-health.router.ts` → Internal endpoint `POST /internal/task-health/run-once` to trigger one deterministic check cycle
`apps/api/src/features/agent/agent.prompts.ts` → System prompt template builder (plain text, no logic)
`apps/api/prisma/migrations/20260416230000_add_chat_messages/migration.sql` → Migration adding ChatMessage table for chat persistence
`apps/api/src/features/agent/providers/base.ts` → Shared LLM provider/model selector (`LLM_PROVIDER`) + configuration error type
`apps/api/src/features/weekly-project-check/weekly-project-check.prompts.ts` → Structured weekly analysis prompt and truncation guardrail
`apps/api/src/features/weekly-project-check/weekly-project-check.service.ts` → Weekly batch logic (collect data, call LLM with retry/backoff, create Markdown notification, persist run log, expose history query)
`apps/api/src/features/weekly-project-check/weekly-project-check.scheduler.ts` → Cron scheduler (`node-cron`) with timezone support, overlap guard, and optional projectId on manual run
`apps/api/src/features/weekly-project-check/weekly-project-check.schema.ts` → Validation schema for internal weekly-check run/history endpoints
`apps/api/src/features/weekly-project-check/weekly-project-check.router.ts` → Internal endpoints `POST /internal/weekly-project-check/run-once` and `GET /internal/weekly-project-check/history`
`apps/api/prisma/migrations/20260423101500_add_weekly_project_check_run/migration.sql` → Migration adding enums and WeeklyProjectCheckRun table
`apps/api/vitest.config.ts` → Vitest test runner configuration for backend tests
`apps/api/src/features/weekly-project-check/weekly-project-check.service.test.ts` → Service tests for success/skip/retry/selective-run/history
`apps/api/src/features/weekly-project-check/weekly-project-check.router.test.ts` → Router tests for run-once/history validation
`apps/api/src/features/weekly-project-check/weekly-project-check.scheduler.test.ts` → Scheduler tests for cron registration/manual run
`apps/web/hooks/useWeeklyProjectCheck.ts` → Frontend hook to trigger manual weekly check and fetch history
`apps/web/components/notifications/WeeklyCheckHistoryPanel.tsx` → Frontend history dropdown panel for weekly-check runs
`apps/api/prisma/migrations/20260425114542_notification_soft_delete/migration.sql` → Migration adding Notification.deletedAt and active notifications index
`apps/api/src/features/notifications/notifications.schema.ts` → Notifications Zod schemas (create/list/reply + bulk read delete query)
`apps/api/src/features/notifications/notifications.service.ts` → Notifications business logic with soft-delete filtering, delete actions, and event logging
`apps/api/src/features/notifications/notifications.router.ts` → Notifications HTTP routes including `DELETE /notifications/:id` and `DELETE /notifications/read`
`apps/api/src/features/notifications/notifications.service.test.ts` → Service tests for soft-delete behavior and 404 handling on deleted notifications
`apps/web/hooks/useNotifications.ts` → SWR notifications hook with optimistic single/bulk delete actions
`apps/web/components/notifications/NotificationPanel.tsx` → Notifications dropdown UI with row delete and bulk delete-read action
`apps/web/components/notifications/NotificationModal.tsx` → Notification detail modal with delete action
`apps/web/components/notifications/NotificationBell.tsx` → Notification bell wiring for delete callbacks and selected-state cleanup
