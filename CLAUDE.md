# CLAUDE.md

## Project Overview

Next.js 16 full-stack app with TypeScript, PostgreSQL (Prisma), Better Auth, Stripe, and Resend. Uses App Router with Server Components and **Clean Architecture**.

## Commands

```bash
pnpm dev          # Dev server
pnpm build        # Production build
pnpm db:ai        # Run migrations, format schema, generate client
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

See `.claude/skills/` directory for comprehensive development skills and patterns.

## Quick Reference

**DI Container**: `import { container } from "@/shared/infrastructure/di/container"`

**Response Helpers**: `import { ApiResponse, ActionResponse } from "@/shared/infrastructure/http"`

**Errors**: `import { ZodRouteError, ActionError } from "@/lib/errors"`

**Prisma Client**: `import { ... } from "@/lib/generated/prisma"`

**Environment**: `import { env } from "@/lib/env"`

## Development Workflow

1. **Database Changes**: Update `schema.prisma` → Run `pnpm db:ai`
2. **New Feature**: Entity → Repository interface → Use Case → Tests → Controller → DI Container → Action/Route
3. **New Page**: Add SEO config in `lib/seo.ts`, use `getPageMetadata()` in page
4. **Protected Endpoints**: Use `authAction` or `authRoute`
5. **Before Commit**: Run `pnpm test:run`

## Skills Reference

Claude Code skills provide comprehensive guidance for development patterns:

- **clean-architecture** - Domain structure, DI container, entities, repositories, use cases
- **api-patterns** - API routes (GET), server actions (mutations), response format
- **error-handling** - Error hierarchy, Result pattern, throwing errors by layer
- **testing** - Test requirements, coverage (80%), mocking, examples
- **conventions** - Naming, imports, code style, TypeScript patterns
- **storage** - Cloudflare R2 storage, uploads, downloads, file validation
- **changelog** - Changelog format, frontmatter, version ordering
- **page-creation** - 4-layer page architecture, SEO, views, components
- **i18n** - Internationalization, translations, locale detection

Skills auto-activate based on context. Access skills directory: `.claude/skills/`
