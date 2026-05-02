# ─────────────────────────────────────────────────────────────────────────────
# Stage: base — Alpine with runtime system libraries
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
# libc6-compat: required by some npm native addons on Alpine
# openssl: required by Prisma's query engine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ─────────────────────────────────────────────────────────────────────────────
# Stage: deps — install all npm dependencies
# Only manifests are copied so this layer is cached until deps change.
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json     ./apps/api/
COPY apps/web/package.json     ./apps/web/
COPY packages/types/package.json ./packages/types/
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage: source — full monorepo source on top of installed deps
# .dockerignore excludes node_modules, .env*, build outputs, .git, etc.
# ─────────────────────────────────────────────────────────────────────────────
FROM deps AS source
COPY . .
# Prevent stale incremental metadata from suppressing emits in clean Docker builds.
RUN find . -name "*.tsbuildinfo" -delete

# ─────────────────────────────────────────────────────────────────────────────
# Stage: api-builder — compile the Hono API
# turbo's dependsOn: ["^build"] automatically builds @kanban/types first.
# The API build script runs: prisma generate && tsc
# ─────────────────────────────────────────────────────────────────────────────
FROM source AS api-builder
RUN npx turbo run build --filter=@kanban/api

# ─────────────────────────────────────────────────────────────────────────────
# Stage: api-runner — lean production image for the API
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS api-runner
ENV NODE_ENV=production

# Root node_modules hoisted by npm workspaces:
#   - prisma CLI (.bin/prisma) for migrate deploy at startup
#   - @prisma/client with generated code
#   - all runtime dependencies
COPY --from=api-builder /app/node_modules          ./node_modules

# Compiled API (TypeScript → ESM JS)
COPY --from=api-builder /app/apps/api/dist         ./apps/api/dist

# Prisma schema + migrations — required by `prisma migrate deploy` at startup
COPY --from=api-builder /app/apps/api/prisma       ./apps/api/prisma

# Package manifests — required for npm workspace module resolution
COPY --from=api-builder /app/package.json          ./package.json
COPY --from=api-builder /app/apps/api/package.json ./apps/api/package.json

# @kanban/types compiled output (workspace symlink in node_modules points here)
COPY --from=api-builder /app/packages/types/dist          ./packages/types/dist
COPY --from=api-builder /app/packages/types/package.json  ./packages/types/package.json

EXPOSE 4000

# Run migrations against the live DB before starting the server.
# DATABASE_URL is injected at runtime via docker-compose env_file / environment.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/index.js"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage: web-builder — compile the Next.js frontend (standalone mode)
# NEXT_PUBLIC_API_URL is baked into the client bundle at build time.
# Default points to localhost:4000 for single-machine Docker Desktop usage.
# Override with --build-arg NEXT_PUBLIC_API_URL=https://api.example.com for
# remote or cloud deployments.
# ─────────────────────────────────────────────────────────────────────────────
FROM source AS web-builder
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Ensure public/ exists so the COPY in web-runner always succeeds
RUN mkdir -p apps/web/public

RUN npx turbo run build --filter=@kanban/web

# ─────────────────────────────────────────────────────────────────────────────
# Stage: web-runner — lean Next.js standalone image
# The standalone output bundles its own minimal node_modules (~200 MB vs ~1 GB).
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS web-runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone server (includes only the server-side code and its minimal deps)
COPY --from=web-builder /app/apps/web/.next/standalone ./

# Static client assets — standalone does NOT include these, must be copied separately
COPY --from=web-builder /app/apps/web/.next/static ./apps/web/.next/static

# Public directory (optional static files)
COPY --from=web-builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

# In Next.js monorepo standalone mode the entry point is at the monorepo-relative path
CMD ["node", "apps/web/server.js"]
