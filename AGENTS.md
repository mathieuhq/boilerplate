# AGENTS.md

## Project Overview

TanStack Start full-stack app with TypeScript, PostgreSQL (Prisma), Better Auth, and Plunk. Uses TanStack Router with Vite/Nitro and **Clean Architecture**.

## Commands

```bash
pnpm services     # Start PostgreSQL + Redis + S3 bucket in Docker
pnpm dev          # Dev server on the host
pnpm build        # Production build
pnpm db           # Run migrations, format schema, generate client
pnpm lint         # Oxlint with auto-fix (type-aware)
pnpm format       # Oxfmt
pnpm test:run     # Run tests (MANDATORY before commits)
```

## Architecture

```
├── src/
│   ├── app/                # TanStack Start file routes and server routes
│   ├── server-functions/   # TanStack server functions
│   ├── mcp/                # MCP server and tools (endpoint: /api/mcp)
│   ├── jobs/               # Job types, schedules and the BullMQ worker (Nitro plugin)
│   ├── i18n/               # Local i18n facade
│   ├── features/           # Domain modules (auth, user, organization, admin, email, storage, notification, search)
│   │   └── {domain}/
│   │       ├── domain/         # Entities, Value Objects, Repository interfaces
│   │       ├── application/    # Use Cases, DTOs, Ports
│   │       ├── infrastructure/ # Repository impls, Adapters, Mappers
│   │       └── interface/      # Controllers, Schemas
│   └── shared/             # Base classes, interfaces, DI Container
├── views/                  # Page-level views rendered by routes
├── components/             # UI primitives (ui/) and feature components (features/)
├── lib/                    # Auth, Prisma, Redis, env validation, logger, SEO, helpers
├── hooks/                  # React hooks
├── contexts/               # React contexts
├── messages/               # Translations (en, fr)
└── prisma/                 # Schema and migrations
```

## Quick Reference

**DI Container**: `import { container } from "@/shared/infrastructure/di/container"`

**Response Helpers**: `import { ApiResponse, ActionResponse } from "@/shared/infrastructure/http/api-response"`

**Errors**: `import { ZodRouteError, ActionError } from "@/lib/errors"`

**Prisma Client**: `import { ... } from "@/lib/generated/prisma"`

**Environment**: `import { env } from "@/lib/env"`

## Development Workflow

1. **Database Changes**: Update `schema.prisma` → Run `pnpm db`
2. **New Feature**: Entity → Repository interface → Use Case → Tests → Controller → DI Container → Server Function/Route
3. **New Page**: Add a route in `src/app`, use `Route.head`, and load data with `loader`
4. **Mutations**: Use `createServerFn` in `src/server-functions`
5. **Protected Routes**: Use `beforeLoad` with `requireSession`, which returns the user's `access`, and `assertAccess(context.access, feature, level)`; admin pages are listed with their feature in `ADMIN_PAGES` (`lib/admin-access.ts`), which the `/admin` layout enforces with read access
6. **Protected Endpoints**: Use `authRoute`, `accessRoute(feature, level)`, `getRequiredActionAccess(feature, level)`, or session helpers; in components use `useAccess().can(feature, level)`
7. **MCP Tools**: Add a `defineMcpTool` to `src/mcp/tools/*.tools.ts` that calls a controller, list it in `mcpTools` (`src/mcp/server.ts`), set `access: { feature, level }` for `admin_*` tools and `mapError` with the feature's action error mapper
8. **Access Control**: Register features in `ACCESS_FEATURES` (`src/shared/domain/access-control.ts`) with their supported levels (`read`, `write`, write includes read) and EN/FR labels under `admin.access.features`; the `admin` role always has full access and is locked, the `user` role and custom roles are edited from `/admin/roles`, and nobody can grant, assign or revoke access they lack
9. **Background Jobs**: Declare the job in the feature's `application/jobs/*.jobs.ts` and add it to `AppJobs` (`src/jobs/jobs.ts`), add a handler that calls a controller in `getJobHandlers()` of the DI container, then enqueue it from a use case through `IJobQueuePort` or add a cron entry to `jobSchedules`; without Redis, jobs run inline
10. **In-app Notifications**: Declare the type's payload in `NotificationPayloads` (`src/features/notification/domain/notification.types.ts`) with EN/FR `title`/`body` under `notifications.types`, then call `getNotificationController().send({ audience, type, data, link, excludeUserIds })` from a port wired in the DI container or from a job handler; audiences are `users`, `organization` (optional member roles) or `access` (feature, level), delivery is queued, stored, then streamed over SSE (`/api/notifications/stream`) through Redis pub/sub
11. **Global Search**: Write a provider implementing `ISearchProvider` (`src/features/search/domain/search-provider.interface.ts`) in `src/features/search/infrastructure/providers/` with a unique `type`, a `requirement` (`authenticated`, `access` with a feature and level from `ACCESS_FEATURES`, or `organization` with optional member roles) and a `search({ term, limit }, context)` that returns normalized results (`id`, `type`, `title`, `subtitle`, `icon`, `href`) and matches through `public.search_normalize(column) LIKE public.search_normalize(pattern)` (case and accent insensitive, add a trigram index in a migration for large tables); register it in `getSearchProviders()` of the DI container, add its group label to `command.groups` (EN/FR) and its icon to `SearchResultIcon` and the command menu; providers run in parallel with a per-type limit and a timeout, and a failing provider never breaks the others
12. **Before Commit**: Run `pnpm test:run`
13. **Deploy**: work on `dev`; merging a pull request from `dev` into `main` runs `cd.yml`, which runs CI then triggers the Coolify deployment of `compose.production.yaml`; PostgreSQL, Redis and their R2 backups are Coolify resources, and `compose.dev.yaml` only runs them locally

## Skills

Codex can invoke these repo-scoped skills explicitly with `$skill-name` or
implicitly when the task matches the skill description:

| Skill                | Triggers on                                     |
| -------------------- | ----------------------------------------------- |
| `clean-architecture` | Entities, use cases, repositories, DI container |
| `api-patterns`       | Server routes, server functions, HTTP responses |
| `error-handling`     | Throwing errors, Result pattern                 |
| `testing`            | Writing tests, coverage requirements            |
| `conventions`        | Naming, imports, code style                     |
| `compose-ui`         | UI pages, views, layouts, templates, components |
| `page-creation`      | Creating pages, views, components               |
| `storage`            | File uploads, R2, presigned URLs                |
| `i18n`               | Translations, locales, local i18n facade        |
| `changelog`          | Release notes, version documentation            |
