# CLAUDE.md

## Project Overview

Next.js 16 full-stack app with TypeScript, PostgreSQL (Drizzle ORM), Better Auth, Stripe, and Resend. Uses App Router with Server Components and **Clean Architecture**.

## Commands

```bash
pnpm dev          # Dev server
pnpm build        # Production build
pnpm db:generate  # Generate Drizzle migrations
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm lint         # ESLint with auto-fix
pnpm format       # Prettier
pnpm test:run     # Run tests (MANDATORY before commits)
pnpm stripe       # Stripe webhooks listener
```

## Architecture

```
src/
├── features/           # Domain modules (user, auth, email, admin, payment)
│   └── {domain}/
│       ├── domain/         # Entities, Value Objects, Repository interfaces
│       ├── application/    # Use Cases, DTOs, Ports
│       ├── infrastructure/ # Repository impls, Adapters, Mappers
│       └── interface/      # Controllers, Schemas
└── shared/             # Base classes, interfaces, DI Container
```

## Quick Reference

**DI Container**: `import { container } from "@/shared/infrastructure/di/container"`

**Response Helpers**: `import { ApiResponse, ActionResponse } from "@/shared/infrastructure/http"`

**Errors**: `import { ZodRouteError, ActionError } from "@/lib/errors"`

**Database**: `import { db } from "@/lib/db"` / `import { ... } from "@/db/schema"`

**Environment**: `import { env } from "@/lib/env"`

## Development Workflow

1. **Database Changes**: Update `src/db/schema/*.schema.ts` → Run `pnpm db:push` or `pnpm db:generate && pnpm db:migrate`
2. **New Feature**: Entity → Repository interface → Use Case → Tests → Controller → DI Container → Action/Route
3. **New Page**: Add SEO config in `lib/seo.ts`, use `getPageMetadata()` in page
4. **Protected Endpoints**: Use `authAction` or `authRoute`
5. **Before Commit**: Run `pnpm test:run`

## Skills

Claude automatically uses these project skills when relevant:

| Skill                | Triggers on                                     |
| -------------------- | ----------------------------------------------- |
| `clean-architecture` | Entities, use cases, repositories, DI container |
| `api-patterns`       | API routes, server actions, HTTP responses      |
| `error-handling`     | Throwing errors, Result pattern                 |
| `testing`            | Writing tests, coverage requirements            |
| `conventions`        | Naming, imports, code style                     |
| `page-creation`      | Creating pages, views, components               |
| `storage`            | File uploads, R2, presigned URLs                |
| `i18n`               | Translations, locales, next-intl                |
| `changelog`          | Release notes, version documentation            |
