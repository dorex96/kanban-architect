# Project Context — kanban-architect

> Living document. Update after every significant change (new file, new dependency, schema change, milestone).

## Current State

- **Phase:** API CRUD complete — Project & Task REST endpoints implemented, type-check passing.
- **Package manager:** npm 11.10.0 with workspaces
- **Node version:** 22.19.0
- **`apps/web/`:** Next.js 14.2 scaffold with Tailwind, landing page at `/`, `lib/api.ts` client.
- **`apps/api/`:** Hono with CORS, global error handler, `GET /health`, full Project & Task CRUD endpoints, Prisma client, Zod config.
- **`packages/types/`:** Shared types: `Task`, `TaskStatus`, `Project`, `Event`, `AgentLogEntry`, `ToolCall`, `ToolCallResult`, `CreateTaskInput`, `UpdateTaskInput`, `UpdateProjectInput`, `Board`.
- **Database:** PostgreSQL via local install. Prisma schema with 4 models, initial migration applied (`20260321183854_init`).

## Build Progress

| Milestone | Status | Key files |
|---|---|---|
| Root monorepo config | DONE | `package.json`, `turbo.json`, `tsconfig.json`, `.gitignore`, `.npmrc` |
| Shared types package | DONE | `packages/types/src/index.ts`, `packages/types/package.json` |
| Prisma schema + migrations | DONE | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/` |
| API scaffold (Hono entry) | DONE | `apps/api/src/index.ts`, `config.ts`, `lib/prisma.ts`, `lib/errors.ts` |
| Project & Task services | DONE | `apps/api/src/services/event.service.ts`, `project.service.ts`, `task.service.ts` |
| Project & Task routers | DONE | `apps/api/src/routers/projects.ts`, `tasks.ts` |
| Frontend scaffold (Next.js) | DONE | `apps/web/app/layout.tsx`, `app/page.tsx`, `lib/api.ts`, `lib/utils.ts` |
| KanbanBoard + DnD | NOT STARTED | `apps/web/components/board/` |
| Agent tools layer | NOT STARTED | `apps/api/src/agent/tools.ts` |
| Agent coordinator + SSE | NOT STARTED | `apps/api/src/agent/coordinator.ts`, `routers/agent.ts` |
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
`apps/api/src/index.ts` → Hono entry point (CORS, health check, port 4000)
`apps/api/src/config.ts` → Zod-parsed environment config
`apps/api/src/lib/prisma.ts` → Prisma singleton client
`apps/api/src/lib/errors.ts` → HttpError class
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
`apps/web/app/page.tsx` → Landing page
`apps/web/lib/utils.ts` → cn() utility (clsx + tailwind-merge)
`apps/web/lib/api.ts` → Centralized API client (get, post, patch, delete)
`apps/api/src/services/event.service.ts` → logEvent(projectId, action, taskId?) — writes to Event table
`apps/api/src/services/project.service.ts` → listProjects, createProject, updateProject, deleteProject
`apps/api/src/services/task.service.ts` → listTasks, createTask (positionIndex auto), updateTask, deleteTask, reorderTask
`apps/api/src/routers/projects.ts` → GET/POST/PATCH/DELETE /projects (Zod-validated)
`apps/api/src/routers/tasks.ts` → GET/POST/PATCH/DELETE /tasks + PATCH /tasks/:id/reorder (Zod-validated)
