# Kanban Architect

AI-powered Kanban board. Type a goal and an AI agent creates tasks on the board via SSE streaming.

TypeScript monorepo: **Next.js 14** frontend, **Hono** API, shared types.

## Project Status: Work in Progress

This repository is public as a build-in-public project.
Core Kanban and AI agent features are implemented and usable, while automated tests and production hardening are still in progress.

### What works now

- Project creation, rename, and delete
- Board view with 4 columns (`INBOX`, `TODO`, `IN_PROGRESS`, `DONE`)
- Task creation, rename, delete
- Drag-and-drop reordering with fractional `positionIndex`
- API with feature-based slices (`projects`, `tasks`, `events`)
- Agent feature slice in API (`tools`, coordinator, SSE endpoint)
- Agent chat sidebar in frontend (`AgentSidebar`, `ThoughtProcess`)
- Multi-turn AI chat with persisted message history (`ChatMessage`)
- Agent logs with tool calls (`AgentLog`)
- LLM provider switching via `LLM_PROVIDER` (`openai | anthropic | ollama`)
- Shared types package for frontend and backend

## Architecture

```
apps/web/          → Next.js 14 (App Router), Tailwind, SWR, @hello-pangea/dnd
apps/api/          → Hono (REST + SSE), Prisma, Zod
packages/types/    → Shared TS interfaces (@kanban/types)
```

### Database

PostgreSQL with five tables:

| Table | Purpose |
|---|---|
| **Projects** | Kanban boards |
| **Tasks** | Cards with status (`INBOX`, `TODO`, `IN_PROGRESS`, `DONE`) and fractional `positionIndex` |
| **Events** | Audit log for all mutations |
| **AgentLogs** | AI agent queries, reasoning, and tool calls |
| **ChatMessages** | Persisted user/assistant chat history per project |

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
# OLLAMA uses local endpoint http://localhost:11434/v1
```

### Agent API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/agent/run` | Stream agent response via SSE (useChat compatible) |
| `GET` | `/agent/messages?projectId=...` | Load persisted chat history |
| `DELETE` | `/agent/messages?projectId=...` | Clear persisted chat history |
| `GET` | `/agent/logs?projectId=...` | Load recent agent logs and tool calls |

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
│   │       │   ├── projects/
│   │       │   └── tasks/
│   │       ├── lib/
│   │       └── middlewares/
│   └── web/
│       ├── app/
│       │   └── board/
│       │       └── [projectId]/
│       ├── components/
│       │   ├── agent/
│       │   ├── board/
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
