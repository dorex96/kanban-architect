# Copilot Instructions — kanban-architect

AI-powered Kanban board. TypeScript monorepo: Next.js 14 frontend, Hono API, shared types. User types a goal → AI agent creates tasks on the board via SSE streaming.

> **Read `.github/context.md` before analyze codebase and generating code.** It tracks current project state, build progress, installed dependencies, and the file index. Update it after creating files, adding dependencies, or completing milestones.

## Architecture Rules

1. **Board never depends on agent.** Deleting `agent/` must not break the Kanban board.
2. **Feature-Based (Vertical Slice) Architecture.** Each domain lives in `features/<name>/` with its own router, service, and schema. No business logic in routers or agent tools. Services call Prisma exclusively.
3. **`LLM_PROVIDER` env var switches the entire LLM stack** (`openai | anthropic | ollama`). One change for fully local.
4. **`positionIndex` is always a Float.** Fractional insertion only (e.g. between 1.0 and 2.0 → 1.5). Lives in `features/tasks/tasks.service.ts`, never leaks to routers/agent.
5. **All frontend API calls go through `lib/api.ts`.** No raw `fetch` in components or hooks.
6. **Shared types live in `packages/types/` only.** Import as `@kanban/types`. Never duplicate across apps.
7. **Every mutation writes to `Events` table** via `features/events/events.service.ts`, called from the service layer.

## Monorepo Layout

```
apps/web/          → Next.js 14 (App Router), Tailwind, SWR, @hello-pangea/dnd
apps/api/          → Hono (REST + SSE), Prisma, Zod
packages/types/    → Shared TS interfaces only, no runtime code
```

## Frontend (`apps/web/`)

- **Styling:** Tailwind only; use `cn()` from `lib/utils.ts` for conditional classes.
- **DnD:** `@hello-pangea/dnd` — `DragDropContext` > `Droppable` columns > `Draggable` cards.
- **Data:** SWR via `useBoard` hook. Optimistic updates mandatory for drag-and-drop — move locally before server responds, then reconcile.
- **Initial load:** Server component `app/board/[projectId]/page.tsx` fetches board state, passes to client components as props. No `useEffect` for initial data.
- **Agent chat:** `useChat` from Vercel AI SDK in `AgentSidebar.tsx`. Backed by `POST /agent/run` (SSE stream, never convert to JSON).
- **`ThoughtProcess.tsx`** renders agent `tool_calls` from `AgentLogs` — required component.

### Component paths

```
components/board/   → KanbanBoard, KanbanColumn, TaskCard, AddTaskInline
components/agent/   → AgentSidebar, AgentMessage, ThoughtProcess
```

## Backend (`apps/api/`)

### Directory layout (Vertical Slice)

```
src/
├── index.ts              # Entry: mounts feature routers, global middleware
├── config.ts             # Zod-parsed env vars (throws on missing)
├── features/             # Domain-specific vertical slices
│   ├── projects/
│   │   ├── projects.router.ts    # HTTP parsing only
│   │   ├── projects.service.ts   # Business logic + Prisma
│   │   └── projects.schema.ts    # Zod request schemas
│   ├── tasks/
│   │   ├── tasks.router.ts       # Includes PATCH /tasks/:id/reorder
│   │   ├── tasks.service.ts      # Fractional positionIndex logic
│   │   └── tasks.schema.ts       # Zod request schemas
│   ├── events/
│   │   └── events.service.ts     # All mutations log events here
│   └── agent/                    # (future)
│       ├── agent.router.ts       # POST /agent/run → streamText()
│       ├── agent.tools.ts        # getBoardState, createTask, updateTaskStatus
│       ├── agent.coordinator.ts
│       ├── agent.prompts.ts      # Strings only — no business logic
│       └── providers/
│           └── base.ts           # getLLM() → LanguageModelV1
├── lib/                  # Shared utilities and clients
│   ├── prisma.ts         # Singleton client
│   └── errors.ts         # HttpError class
├── middlewares/           # Global middlewares
│   └── error-handler.ts  # HttpError → JSON response
└── common/               # Shared Zod schemas or types
    └── schemas.ts        # e.g. taskStatusEnum
```

### Patterns

- **Errors:** `throw new HttpError(404, 'Task not found')` — caught by global handler, formatted as `{ error, status }`.
- **Tool returns:** Always structured objects, never thrown exceptions:
  ```typescript
  return { success: true, task }
  return { success: false, error: 'Task not found' }
  ```
- **`prompts.ts`:** Plain text templates only. No logic.
- **New LLM provider:** Add file in `providers/`, add case in `getLLM()`.

### Agent tools

```typescript
getBoardState(projectId)                   // → tasks grouped by status
createTask(projectId, title, description)  // → { success, taskId, error? }
updateTaskStatus(taskId, newStatus)        // → { success, previousStatus, newStatus, error? }
```

Tools call `features/tasks/tasks.service.ts`, never Prisma directly. All mutations trigger `features/events/events.service.ts`.

### System prompt rules (enforced in `prompts.ts`)

- 3–7 tasks per goal
- Task titles start with action verb (Implement, Write, Configure, Add, Fix)
- No duplicate tasks — existing titles passed in context
- No invented integrations

## Database

Schema in `apps/api/prisma/schema.prisma`. Use `prisma migrate dev` — no raw SQL.

| Table | Key columns | Notes |
|---|---|---|
| Projects | `id, name, createdAt` | |
| Tasks | `id, projectId, title, description, status, positionIndex` | `status`: `INBOX \| TODO \| IN_PROGRESS \| DONE`. `positionIndex`: Float. |
| Events | `id, projectId, taskId, action, timestamp` | `projectId` always required. |
| AgentLogs | `id, projectId, query, reasoning, toolCalls (Json), status` | `status`: `success \| error` |

## Shared Types (`packages/types/`)

```typescript
type TaskStatus = 'INBOX' | 'TODO' | 'IN_PROGRESS' | 'DONE'

interface Task {
  id: string; projectId: string; title: string; description: string
  status: TaskStatus; positionIndex: number; createdAt: string
}

interface CreateTaskInput { projectId: string; title: string; description: string }

interface ToolCallResult { success: boolean; error?: string; [key: string]: unknown }

interface AgentLogEntry {
  id: string; projectId: string; query: string; reasoning: string
  toolCalls: ToolCall[]; status: 'success' | 'error'
}
```

## Testing (`apps/api/tests/`)

- **`tools.test.ts`** — Mock Prisma (`jest.mock`), no HTTP, no LLM. Tools must be testable without an LLM.
- **`tasks.service.test.ts`** — Fractional positionIndex logic and event writing.
- **`*.router.test.ts`** — Integration via Hono's `app.request()`. Test DB seeded in `beforeEach`.