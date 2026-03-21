# Project Context — kanban-architect

> Living document. Update after every significant change (new file, new dependency, schema change, milestone).

## Current State

- **Phase:** Greenfield — no source code exists yet.
- **Scaffolded:** Root `package.json`, `turbo.json`, `docker-compose.yml`, `.env.example` (all empty).
- **`apps/web/`:** Empty. Next.js 14 not yet initialized.
- **`apps/api/`:** Empty. Hono not yet initialized.
- **`packages/types/`:** Empty. No shared types yet.
- **Database:** No Prisma schema, no migrations.

## Build Progress

| Milestone | Status | Key files |
|---|---|---|
| Root monorepo config | NOT STARTED | `package.json`, `turbo.json` |
| Shared types package | NOT STARTED | `packages/types/index.ts` |
| Prisma schema + migrations | NOT STARTED | `apps/api/prisma/schema.prisma` |
| API scaffold (Hono entry) | NOT STARTED | `apps/api/src/index.ts`, `config.ts`, `lib/` |
| Project & Task services | NOT STARTED | `apps/api/src/services/` |
| Project & Task routers | NOT STARTED | `apps/api/src/routers/` |
| Frontend scaffold (Next.js) | NOT STARTED | `apps/web/app/`, `lib/api.ts` |
| KanbanBoard + DnD | NOT STARTED | `apps/web/components/board/` |
| Agent tools layer | NOT STARTED | `apps/api/src/agent/tools.ts` |
| Agent coordinator + SSE | NOT STARTED | `apps/api/src/agent/coordinator.ts`, `routers/agent.ts` |
| AgentSidebar + ThoughtProcess | NOT STARTED | `apps/web/components/agent/` |
| Docker compose (working) | NOT STARTED | `docker-compose.yml` |
| Tests | NOT STARTED | `apps/api/tests/` |

## Installed Dependencies

None yet. Expected:

| Package | Where | Purpose |
|---|---|---|
| `next` 14.x | `apps/web` | App Router frontend |
| `tailwindcss` | `apps/web` | Styling |
| `swr` | `apps/web` | Data fetching + optimistic updates |
| `@hello-pangea/dnd` | `apps/web` | Drag and drop |
| `ai`, `@ai-sdk/react` | `apps/web` | `useChat` for SSE streaming |
| `hono` | `apps/api` | HTTP framework |
| `prisma`, `@prisma/client` | `apps/api` | ORM |
| `zod` | `apps/api` | Validation |
| `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic` | `apps/api` | `streamText` + provider models |
| `tsx` | `apps/api` | Dev runner |
| `turbo` | root | Monorepo orchestration |

## Active Decisions

- None yet.

## Known Issues

- None yet.

## File Index

> Add entries as files are created. Format: `path → one-line purpose`.

(empty — no source files exist yet)
