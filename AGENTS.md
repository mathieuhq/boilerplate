# AGENTS.md

## Project Overview

TanStack Start full-stack app with TypeScript, PostgreSQL (Prisma), Better Auth, and Plunk. Uses TanStack Router with Vite/Nitro and **Clean Architecture**.

## Commands

```bash
pnpm services     # Start PostgreSQL + Redis in Docker
pnpm dev          # Dev server on the host
pnpm build        # Production build
pnpm db           # Run migrations, format schema, generate client
pnpm lint         # ESLint with auto-fix
pnpm format       # Prettier
pnpm test:run     # Run tests (MANDATORY before commits)
```

## Architecture

```
src/
├── app/                # TanStack Start file routes and server routes
├── server-functions/   # TanStack server functions
├── lib/env/            # Environment validation
├── features/           # Domain modules (user, auth, email, admin)
│   └── {domain}/
│       ├── domain/         # Entities, Value Objects, Repository interfaces
│       ├── application/    # Use Cases, DTOs, Ports
│       ├── infrastructure/ # Repository impls, Adapters, Mappers
│       └── interface/      # Controllers, Schemas
└── shared/             # Base classes, interfaces, DI Container
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
5. **Protected Routes**: Use `beforeLoad` with `requireSession` or `requireAdmin`
6. **Protected Endpoints**: Use `authRoute`, `adminRoute`, or session helpers
7. **Before Commit**: Run `pnpm test:run`
8. **Deploy**: work on `dev`; merging a pull request from `dev` into `main` runs `cd.yml`, which runs CI then triggers the Coolify deployment of `compose.production.yaml`; PostgreSQL, Redis and their R2 backups are Coolify resources, and `compose.dev.yaml` only runs them locally

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
