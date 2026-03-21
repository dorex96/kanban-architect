# Kanban Architect

AI-powered Kanban board. Type a goal and an AI agent creates tasks on the board via SSE streaming.

TypeScript monorepo: **Next.js 14** frontend, **Hono** API, shared types.

## Architecture

```
apps/web/          → Next.js 14 (App Router), Tailwind, SWR, @hello-pangea/dnd
apps/api/          → Hono (REST + SSE), Prisma, Zod
packages/types/    → Shared TS interfaces (@kanban/types)
```

### Database

PostgreSQL with four tables:

| Table | Purpose |
|---|---|
| **Projects** | Kanban boards |
| **Tasks** | Cards with status (`INBOX`, `TODO`, `IN_PROGRESS`, `DONE`) and fractional `positionIndex` |
| **Events** | Audit log for all mutations |
| **AgentLogs** | AI agent queries, reasoning, and tool calls |

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
```

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
├── package.json              # Root monorepo config (npm workspaces)
├── turbo.json                # Turborepo pipeline config
├── tsconfig.json             # Base TypeScript config
├── docker-compose.yml        # PostgreSQL service (optional)
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts      # Hono entry point (CORS, health check)
│   │   │   ├── config.ts     # Zod-parsed env vars
│   │   │   └── lib/
│   │   │       ├── prisma.ts # Prisma singleton client
│   │   │       └── errors.ts # HttpError class
│   │   └── prisma/
│   │       └── schema.prisma # Database schema
│   └── web/
│       ├── app/
│       │   ├── layout.tsx    # Root layout with Tailwind
│       │   ├── page.tsx      # Landing page
│       │   └── globals.css   # Tailwind directives
│       └── lib/
│           ├── api.ts        # Centralized API client
│           └── utils.ts      # cn() utility (clsx + tailwind-merge)
└── packages/
    └── types/
        └── src/
            └── index.ts      # Shared types (Task, Project, Event, etc.)
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
