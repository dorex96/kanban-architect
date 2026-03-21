# Project Context — kanban-architect

> Living document. Update after every significant change (new file, new dependency, schema change, milestone).

## Current State

- **Phase:** Kanban board UI complete — project list at `/`, board view at `/board/[projectId]` with 4-column Kanban (INBOX/TODO/IN_PROGRESS/DONE), task CRUD (add/rename/delete), drag-and-drop to move tasks between columns, type-check passing.
- **Package manager:** npm 11.10.0 with workspaces
- **Node version:** 22.19.0
- **`apps/web/`:** Next.js 14.2 with Tailwind, project list at `/` (add/rename/delete), board view at `/board/[projectId]` with DnD columns, `useProjects` + `useBoard` SWR hooks, `lib/api.ts` client.
- **`apps/api/`:** Hono with CORS, global error handler, `GET /health`, full Project CRUD (including `GET /projects/:id`) & Task CRUD endpoints, Prisma client, Zod config. **Feature-Based (Vertical Slice) Architecture** — `features/`, `lib/`, `middlewares/`, `common/`.
- **`packages/types/`:** Shared types: `Task`, `TaskStatus`, `Project`, `Event`, `AgentLogEntry`, `ToolCall`, `ToolCallResult`, `CreateTaskInput`, `UpdateTaskInput`, `UpdateProjectInput`, `Board`.
- **Database:** PostgreSQL via local install. Prisma schema with 4 models, initial migration applied (`20260321183854_init`).
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
| Agent tools layer | NOT STARTED | `apps/api/src/features/agent/agent.tools.ts` |
| Agent coordinator + SSE | NOT STARTED | `apps/api/src/features/agent/agent.coordinator.ts`, `agent.router.ts` |
| AgentSidebar + ThoughtProcess | NOT STARTED | `apps/web/components/agent/` |
| Docker compose (working) | DONE | `docker-compose.yml` (PostgreSQL 16, optional — local PG used) |
| Tests | NOT STARTED | `apps/api/tests/` |

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
| `clsx`, `tailwind-merge` | `apps/web` | ^2.1.0, ^2.6.0 | `cn()` utility |
| `hono`, `@hono/node-server` | `apps/api` | ^4.6.0, ^1.13.0 | HTTP framework |
| `prisma`, `@prisma/client` | `apps/api` | ^6.2.0 (6.19.2) | ORM |
| `zod` | `apps/api` | ^3.24.0 | Validation |
| `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic` | `apps/api` | ^4.1.0, ^1.1.0 | `streamText` + provider models |
| `tsx` | `apps/api` | ^4.19.0 | Dev runner |
| `@hono/zod-validator` | `apps/api` | ^0.4.x | Zod request validation middleware |

## Active Decisions

- Using Feature-Based (Vertical Slice) Architecture for the API: `features/`, `lib/`, `middlewares/`, `common/`.
- Using npm workspaces (not pnpm) with Node 22.
- Local PostgreSQL (not Docker) for development. Docker Compose available as optional.
- DB connection URL: `postgresql://postgres:postgres@host.docker.internal:5432/kanban-architect`

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
