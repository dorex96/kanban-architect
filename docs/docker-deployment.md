# Docker Deployment Guide

Run a production build of **kanban-architect** on Docker Desktop using three containers: a PostgreSQL database, the Hono API, and the Next.js frontend.

```
┌─────────────────────────────────────────────────────────┐
│  Docker Desktop                                         │
│                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ postgres │◄───│     api      │◄───│      web      │  │
│  │ :5432    │    │    :4000     │    │    :3000      │  │
│  └──────────┘    └──────────────┘    └───────────────┘  │
│        ▲                ▲                    ▲          │
│    pgdata           env_file           build ARG       │
│    volume         apps/api/.env    NEXT_PUBLIC_API_URL  │
└─────────────────────────────────────────────────────────┘
         ▲                                    ▲
   internal network                     browser (host)
```

---

## Prerequisites

- **Docker Desktop** ≥ 4.x (includes Docker Engine and Compose v2)
  - [Download for Windows / macOS / Linux](https://www.docker.com/products/docker-desktop/)
- **Git** to clone the repository
- An API key for your chosen LLM provider (OpenAI, Anthropic, or a running Ollama instance)

---

## Step 1 — Clone the repository

```bash
git clone <repo-url> kanban-architect
cd kanban-architect
```

---

## Step 2 — Configure environment variables

The API requires a `.env` file with database URL, LLM provider, and API keys.

```bash
cp apps/api/.env.example apps/api/.env
```

Open `apps/api/.env` and fill in the required values:

```env
# Database — leave as-is; docker-compose.prod.yml overrides this with the
# postgres service hostname automatically. You can keep this value for
# local development outside Docker.
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kanban-architect

# LLM provider: openai | anthropic | ollama
LLM_PROVIDER=openai

# Set the key for your chosen provider
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

> **Note — DATABASE_URL inside Docker:** When the stack runs, `docker-compose.prod.yml` automatically overrides `DATABASE_URL` to `postgresql://postgres:postgres@postgres:5432/kanban-architect` so the API container communicates with the `postgres` service by its internal hostname. You do not need to change this manually.

### Optional scheduler settings

To enable the automated task-health checks and weekly project reports, add to `apps/api/.env`:

```env
ENABLE_TASK_HEALTH_SCHEDULER=true
TASK_HEALTH_SCHEDULER_INTERVAL_MIN=60

ENABLE_WEEKLY_PROJECT_CHECK_SCHEDULER=true
WEEKLY_PROJECT_CHECK_CRON=0 9 * * 1
WEEKLY_PROJECT_CHECK_TIMEZONE=Europe/Rome
```

---

## Step 3 — Build the images

> **Important — `NEXT_PUBLIC_API_URL` is baked in at build time.**
> The Next.js client bundle must know the URL of the API *as seen by the browser*.
> For Docker Desktop running locally, the default (`http://localhost:4000`) is correct.
> If you are deploying to a remote server, set the variable before building (see [Remote deployment](#remote-server-deployment)).

```bash
docker compose -f docker-compose.prod.yml build
```

This builds two images using a multi-stage `Dockerfile`:

| Image target | What it contains | Approx. size |
|---|---|---|
| `api-runner` | Compiled Hono API + Prisma client | ~300 MB |
| `web-runner` | Next.js standalone server + static assets | ~250 MB |

Build times (first run, no cache):
- `api-runner`: ~2–3 min (mostly `npm ci`)
- `web-runner`: ~3–5 min (Next.js compilation)

Subsequent builds with unchanged dependencies are fast due to Docker layer caching.

---

## Step 4 — Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d
```

Compose starts the services in the correct order:

1. `postgres` starts first, waiting until its healthcheck passes.
2. `api` starts after postgres is healthy. On first boot it automatically runs `prisma migrate deploy` to apply all database migrations, then starts the server.
3. `web` starts after the API is available.

Check that all three containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:

```
NAME                        STATUS
kanban-architect-postgres-1   running (healthy)
kanban-architect-api-1        running
kanban-architect-web-1        running
```

---

## Step 5 — Verify

### API health check

```bash
curl http://localhost:4000/health
# → {"status":"ok"}
```

### Open the app

Navigate to **http://localhost:3000** in your browser.
Create a project, add tasks, or open the AI agent sidebar.

### View logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Single service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

---

## Stopping the stack

```bash
# Stop containers, keep database volume intact
docker compose -f docker-compose.prod.yml down

# Stop containers AND delete the database volume (full reset)
docker compose -f docker-compose.prod.yml down -v
```

---

## Rebuilding after code changes

If you change source code, rebuild the affected image(s):

```bash
# Rebuild everything
docker compose -f docker-compose.prod.yml build

# Rebuild only the API
docker compose -f docker-compose.prod.yml build api

# Rebuild only the web frontend
docker compose -f docker-compose.prod.yml build web

# Rebuild and restart in one command
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Remote server deployment

When deploying to a server (VPS, cloud VM, etc.) the browser will reach the API through the server's public IP or domain, not `localhost`.

Set `NEXT_PUBLIC_API_URL` before building:

```bash
# On Linux/macOS
NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  docker compose -f docker-compose.prod.yml build web

# On Windows PowerShell
$env:NEXT_PUBLIC_API_URL = "https://api.yourdomain.com"
docker compose -f docker-compose.prod.yml build web
```

Then start the stack normally:

```bash
docker compose -f docker-compose.prod.yml up -d
```

> **Every time you change `NEXT_PUBLIC_API_URL` you must rebuild the `web` image**, because the value is embedded in the JavaScript bundle at build time (it is a `NEXT_PUBLIC_*` variable).

---

## Environment variable reference

### `apps/api/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. Overridden by Compose to use the `postgres` service name. |
| `LLM_PROVIDER` | Yes | `openai` | AI backend: `openai`, `anthropic`, or `ollama` |
| `OPENAI_API_KEY` | If `openai` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | If `anthropic` | — | Anthropic API key |
| `ANTHROPIC_MODEL` | No | `claude-3-5-sonnet-latest` | Anthropic model name |
| `ENABLE_TASK_HEALTH_SCHEDULER` | No | `false` | Enable automated task-health check scheduler |
| `TASK_HEALTH_SCHEDULER_INTERVAL_MIN` | No | `60` | Interval between health checks (minutes) |
| `TASK_DEADLINE_LOOKAHEAD_HOURS` | No | `24` | Hours ahead to check for approaching deadlines |
| `TASK_WORKLOAD_OPEN_THRESHOLD` | No | `20` | Notify if open tasks exceed this number |
| `TASK_WORKLOAD_IN_PROGRESS_THRESHOLD` | No | `8` | Notify if in-progress tasks exceed this number |
| `TASK_HEALTH_DEDUPE_WINDOW_HOURS` | No | `24` | Suppress duplicate notifications within this window |
| `ENABLE_WEEKLY_PROJECT_CHECK_SCHEDULER` | No | `false` | Enable weekly AI project-state report |
| `WEEKLY_PROJECT_CHECK_CRON` | No | `0 9 * * 1` | Cron expression for weekly report (default: Mon 09:00) |
| `WEEKLY_PROJECT_CHECK_TIMEZONE` | No | `Europe/Rome` | Timezone for the cron schedule |

### Build argument (`docker-compose.prod.yml`)

| Argument | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL the *browser* uses to reach the API. Baked in at build time. |

---

## Troubleshooting

### API fails to start: "Can't reach database server"

The `api` container's startup script (`prisma migrate deploy`) can't connect to PostgreSQL.

1. Check that the `postgres` container is healthy: `docker compose -f docker-compose.prod.yml ps`
2. Inspect postgres logs: `docker compose -f docker-compose.prod.yml logs postgres`
3. Restart just the API after postgres is healthy: `docker compose -f docker-compose.prod.yml restart api`

### Port already in use

If ports 3000 or 4000 are occupied on your machine, change the host-side mapping in `docker-compose.prod.yml`:

```yaml
ports:
  - "4001:4000"   # map host:4001 → container:4000
```

### AI agent not responding / "LLM_PROVIDER not set"

The API container logs will show the Zod config validation error. Ensure `apps/api/.env` exists and contains `LLM_PROVIDER` and the matching API key, then rebuild and restart:

```bash
docker compose -f docker-compose.prod.yml up -d --build api
```

### Web shows blank page after changing API URL

`NEXT_PUBLIC_API_URL` is embedded at build time. After changing it, rebuild the web image:

```bash
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d web
```

### Resetting everything (clean slate)

```bash
docker compose -f docker-compose.prod.yml down -v --rmi local
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```
