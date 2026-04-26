# Kanban Architect

AI-powered Kanban board. Type a goal and an AI agent creates tasks on the board via SSE streaming.

TypeScript monorepo: **Next.js 14** frontend, **Hono** API, shared types.

## Features

- **Kanban board** — four columns (`INBOX → TODO → IN_PROGRESS → DONE`), drag-and-drop reordering, inline task creation and rename
- **Projects** — create, rename, and delete multiple boards; each board is a standalone project
- **Task metadata** — optional priority, start date, and end date per task; the AI agent can read and set these fields
- **AI agent** — type a goal in the sidebar and an AI agent plans and creates tasks on the board in real time via SSE streaming
- **Multi-turn chat** — full conversation history persisted in the database, restored on page reload
- **LLM provider switching** — set `LLM_PROVIDER=openai | anthropic | ollama` to change the entire AI stack without touching code
- **Notifications** — in-app bell with unread badge; task-health checks fire automatic notifications for approaching deadlines and high workload
- **Weekly AI project-state report** — a scheduled LLM analysis reviews each project weekly and delivers a Markdown summary as a notification
- **Agent thought process** — expandable tool-call cards show reasoning and actions taken by the AI in real time

## Project Status: Work in Progress

This repository is public as a build-in-public project.
Core Kanban and AI agent features are implemented and usable, while production hardening is still in progress.

### What works now

**Board & tasks**
- Project creation, rename, and delete
- Board view with 4 columns (`INBOX`, `TODO`, `IN_PROGRESS`, `DONE`)
- Task creation, inline rename, and delete
- Drag-and-drop reordering with fractional `positionIndex`
- Task metadata fields: priority, start date, and end date

**AI agent**
- Agent chat sidebar (`AgentSidebar`, `AgentMessage`, `ThoughtProcess`)
- Multi-turn AI chat with persisted message history (`ChatMessage` table)
- Agent logs with tool calls stored in `AgentLog` table
- LLM provider switching via `LLM_PROVIDER` env var (`openai | anthropic | ollama`)
- Streamed agent errors surfaced directly in the chat UI
- Responsive sidebar: mobile overlay and desktop slide-in panel
- Markdown rendering and typing indicator in chat messages

**Notifications & health checks**
- In-app notification bell with unread badge and panel
- Notification detail modal with agent reply shortcut
- Soft-delete for individual and bulk-read notifications
- Deterministic task-health scheduler: deadline and workload threshold checks with deduped notifications
- Weekly AI project-state report: scheduled LLM analysis with Markdown summary delivered as a notification

**Backend**
- REST API with vertical-slice architecture (`projects`, `tasks`, `events`, `agent`, `notifications`, `task-health`, `weekly-project-check`)
- SSE streaming endpoint compatible with Vercel AI SDK `useChat`
- Chat history endpoints (`GET / DELETE /agent/messages`)
- Agent log endpoint (`GET /agent/logs`)
- Internal scheduler endpoints for manual trigger and history queries
- Shared types package (`@kanban/types`) used by both frontend and backend
- Automated backend tests (Vitest) for the weekly-check feature slice

## Architecture

```
apps/web/          → Next.js 14 (App Router), Tailwind, SWR, @hello-pangea/dnd
apps/api/          → Hono (REST + SSE), Prisma, Zod
packages/types/    → Shared TS interfaces (@kanban/types)
```

### Database

PostgreSQL with seven tables:

| Table | Purpose |
|---|---|
| **Projects** | Kanban boards |
| **Tasks** | Cards with status (`INBOX`, `TODO`, `IN_PROGRESS`, `DONE`), fractional `positionIndex`, and optional priority / dates |
| **Events** | Audit log for all mutations |
| **AgentLogs** | AI agent queries, reasoning, and tool calls |
| **ChatMessages** | Persisted user/assistant chat history per project |
| **Notifications** | In-app alerts from task-health checks and weekly reports (soft-delete) |
| **WeeklyProjectCheckRuns** | Log of weekly AI analysis runs with status and result metadata |

## Prerequisites

- **Node.js** >= 22
- **npm** >= 11
- **PostgreSQL** 16+ (local install or Docker)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> kanban-architect
cd kanban-architect
npm install
```

### 2. Set up the database

**Option A — Local PostgreSQL:**

Create the database:

```sql
CREATE DATABASE "kanban-architect";
```

**Option B — Docker Compose:**

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port 5432 with user `postgres` / password `postgres`.

### 3. Configure environment variables

Copy the example files and adjust as needed:

```bash
# API
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

**`apps/api/.env`:**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kanban-architect
```

**`apps/web/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

For AI features, also set in `apps/api/.env`:

```env
LLM_PROVIDER=openai          # openai | anthropic | ollama
OPENAI_API_KEY=sk-...        # if using OpenAI
ANTHROPIC_API_KEY=sk-ant-... # if using Anthropic
ANTHROPIC_MODEL=claude-3-5-sonnet-latest  # optional, Anthropic only
# OLLAMA uses local endpoint http://localhost:11434/v1
```

For the automated schedulers (optional, off by default):

```env
# Task-health checks
ENABLE_TASK_HEALTH_SCHEDULER=false
TASK_HEALTH_SCHEDULER_INTERVAL_MIN=60
TASK_DEADLINE_LOOKAHEAD_HOURS=24
TASK_WORKLOAD_OPEN_THRESHOLD=20
TASK_WORKLOAD_IN_PROGRESS_THRESHOLD=8
TASK_HEALTH_DEDUPE_WINDOW_HOURS=24

# Weekly AI project-state report
ENABLE_WEEKLY_PROJECT_CHECK_SCHEDULER=false
WEEKLY_PROJECT_CHECK_CRON=0 9 * * 1   # every Monday at 09:00
WEEKLY_PROJECT_CHECK_TIMEZONE=Europe/Rome
```

### API endpoints

**Agent**

| Method | Path | Description |
|---|---|---|
| `POST` | `/agent/run` | Stream agent response via SSE (useChat compatible) |
| `GET` | `/agent/messages?projectId=...` | Load persisted chat history |
| `DELETE` | `/agent/messages?projectId=...` | Clear persisted chat history |
| `GET` | `/agent/logs?projectId=...` | Load recent agent logs and tool calls |

**Notifications**

| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications?projectId=...` | List active notifications |
| `PATCH` | `/notifications/:id/read` | Mark a notification as read |
| `DELETE` | `/notifications/:id` | Soft-delete a notification |
| `DELETE` | `/notifications/read?projectId=...` | Soft-delete all read notifications |
| `POST` | `/notifications/:id/reply` | Store a reply on a notification |

**Internal schedulers**

| Method | Path | Description |
|---|---|---|
| `POST` | `/internal/task-health/run-once` | Trigger one deterministic health-check cycle |
| `POST` | `/internal/weekly-project-check/run-once` | Trigger a weekly AI analysis run |
| `GET` | `/internal/weekly-project-check/history` | Fetch weekly-check run history |

### 4. Run database migrations

```bash
npm run db:migrate
```

This applies the Prisma schema to your PostgreSQL database.

### 5. Start development servers

```bash
npx turbo run dev
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| API (Hono) | http://localhost:4000 |

Verify the API is running:

```bash
curl http://localhost:4000/health
# → {"status":"ok"}
```

## Scripts

| Command | Description |
|---|---|
| `npx turbo run dev` | Start all dev servers |
| `npx turbo run build` | Build all workspaces |
| `npx turbo run lint` | Lint all workspaces |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Project Structure

```
├── .github/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── common/
│   │       ├── features/
│   │       │   ├── agent/
│   │       │   ├── events/
│   │       │   ├── notifications/
│   │       │   ├── projects/
│   │       │   ├── task-health/
│   │       │   ├── tasks/
│   │       │   └── weekly-project-check/
│   │       ├── lib/
│   │       └── middlewares/
│   └── web/
│       ├── app/
│       │   └── board/
│       │       └── [projectId]/
│       ├── components/
│       │   ├── agent/
│       │   ├── board/
│       │   ├── notifications/
│       │   └── projects/
│       ├── hooks/
│       └── lib/
└── packages/
    └── types/
        └── src/
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS, SWR, @hello-pangea/dnd |
| Backend | Hono, Prisma, Zod |
| AI | Vercel AI SDK (`ai`), OpenAI / Anthropic / Ollama |
| Database | PostgreSQL 16 |
| Monorepo | Turborepo, npm workspaces |
| Language | TypeScript 5.9 |

## License

Apache License 2.0
