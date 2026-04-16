# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (root)
npm install

# Run all apps in dev mode (API on :4000, web on :3000)
npx turbo run dev

# Build all workspaces
npx turbo run build

# Lint all workspaces
npx turbo run lint

# Database
npm run db:migrate      # Apply Prisma migrations
npm run db:studio       # Open Prisma Studio GUI
```

> **Note:** Avoid using `turbo` directly in PowerShell — BOM encoding issues. Use `npx turbo` or the npm scripts defined in the root `package.json`.

## Environment Setup

- `apps/api/.env` — requires `DATABASE_URL`, `LLM_PROVIDER` (`openai` | `anthropic` | `ollama`), and matching API keys
- `apps/web/.env.local` — requires `NEXT_PUBLIC_API_URL` (typically `http://localhost:4000`)
- See `.env.example` files in each app for the full list

A PostgreSQL 16 instance is required. Use `docker-compose.yml` at the root for a local DB.

## Architecture

This is a **Turborepo monorepo** with npm workspaces:

```
apps/api     — Hono REST backend (port 4000)
apps/web     — Next.js 14 App Router frontend (port 3000)
packages/types — Shared TypeScript interfaces only (no runtime code)
```

### Backend (`apps/api`)

Uses a **vertical slice (feature-based)** architecture. Each domain lives in `src/features/<name>/` with its own router, service, and Zod schemas. No business logic goes in routers; services call Prisma exclusively.

- `src/index.ts` — Hono app entry, mounts routers, configures CORS
- `src/config.ts` — Zod-parsed env vars (single source of truth for config)
- `src/features/projects/` — Project CRUD
- `src/features/tasks/` — Task CRUD + drag-and-drop reorder
- `src/features/events/` — Audit log; **every mutation must call `logEvent()`**
- `src/lib/errors.ts` — `HttpError` class; throw this in services, caught by global middleware
- `prisma/schema.prisma` — 4 models: `Project`, `Task`, `Event`, `AgentLog`

**Task ordering:** `positionIndex` is always a `Float` (fractional insertion, e.g. inserting between 1.0 and 2.0 → 1.5). Never use integers for this field.

### Frontend (`apps/web`)

- `app/` — Next.js App Router. Server components fetch initial data (SSR); client components use SWR for hydration and mutations.
- `hooks/useBoard.ts` — SWR hook for board state; groups tasks by status; handles optimistic updates for all CRUD and drag-and-drop
- `hooks/useProjects.ts` — SWR hook for project list with optimistic mutations
- `lib/api.ts` — Centralized fetch client (`api.get`, `api.post`, `api.patch`, `api.delete`). **All API calls must go through this module — no raw `fetch` calls.**
- `components/board/` — `KanbanBoard` (DragDropContext), `KanbanColumn` (Droppable), `TaskCard` (Draggable), `AddTaskInline`
- Drag-and-drop via `@hello-pangea/dnd`; status columns are `INBOX | TODO | IN_PROGRESS | DONE`

### Shared Types (`packages/types`)

Import shared interfaces as `@kanban/types`. This package contains **only TypeScript types** — no runtime code. Do not add logic here.

## Key Architectural Rules

These rules are enforced by `.github/copilot-instructions.md` and must be followed:

1. **Board must never depend on the agent layer.** The Kanban board works fully without AI features.
2. **Feature slices are self-contained.** Don't import from another feature's internals; use services only.
3. **Every mutation logs an event** via `features/events/events.service.ts`.
4. **`LLM_PROVIDER` env var** switches the entire LLM stack at runtime — code must not hardcode a provider.
5. **Agent tools return structured objects** (`{ success, error }`) — never throw exceptions from tool handlers.
6. **`positionIndex` is always Float** — fractional positioning for task ordering.

## What's Not Yet Implemented

- `features/agent/` — agent tools, coordinator, SSE router
- Frontend agent UI (AgentSidebar, ThoughtProcess components)
- SSE streaming endpoint
- Automated tests

See `.github/context.md` for the living project context and current build phase.
