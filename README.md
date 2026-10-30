# Pushlab Boilerplate

A modern, production-ready full-stack SaaS boilerplate by [Pushlab](https://pushlab.co), built with TanStack Start, React 19, TypeScript, and Clean Architecture principles.

## Features

- **Authentication** - Email/password, OAuth (GitHub, Google), email verification, password reset
- **Email** - Plunk integration with React Email templates
- **File Storage** - Cloudflare R2 with presigned URLs and image compression
- **Admin Dashboard** - User management, registration statistics
- **Internationalization** - Multi-language support (EN, FR)
- **Clean Architecture** - Domain-driven design with clear separation of concerns
- **Type Safety** - End-to-end TypeScript with Zod validation
- **Testing** - Vitest with 80% coverage thresholds

## Tech Stack

| Category   | Technologies                                                |
| ---------- | ----------------------------------------------------------- |
| Framework  | TanStack Start, TanStack Router, Vite, React 19, TypeScript |
| Database   | PostgreSQL, Prisma 7, Redis                                 |
| Auth       | Better Auth                                                 |
| Email      | Plunk, React Email                                          |
| Storage    | Cloudflare R2 (AWS S3 SDK)                                  |
| Styling    | Tailwind CSS 4, Radix UI                                    |
| Testing    | Vitest                                                      |
| Validation | Zod 4                                                       |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (or Podman / Docker to run it from `compose.yaml`)

### Installation

```bash
git clone https://github.com/mathieudacheux/boilerplate.git
cd boilerplate
pnpm install
```

### Environment Variables

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Required minimum:

```env
NODE_ENV="development"
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
```

Optional integrations:

```env
# Auth URL override and initial admin promotion
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_ADMIN_EMAIL="admin@example.com,second-admin@example.com"
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:3000"

# OAuth providers (each provider needs both values)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email provider (EMAIL_API_KEY + EMAIL_FROM are required together)
EMAIL_API_KEY=""
EMAIL_FROM=""
EMAIL_API_BASE_URL=""
EMAIL_CONTACT_LIST_ID=""

# Redis: rate limiting and Better Auth sessions (required in production)
REDIS_URL="redis://:password@localhost:6379"

# Cloudflare R2 storage
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
```

Empty optional values are treated as absent. In development and tests, missing
optional integrations do not block startup; using an unconfigured integration
returns an explicit error such as `EMAIL_NOT_CONFIGURED`,
`STORAGE_NOT_CONFIGURED`, or `REDIS_NOT_CONFIGURED`.
Client-exposed variables must use the `VITE_` prefix. Secrets must stay
server-only and must not use that prefix.

Production rate limiting and Better Auth IP tracking trust `cf-connecting-ip`,
`x-real-ip`, and `x-forwarded-for`. Deploy behind a trusted proxy/CDN that
sets those headers, or adjust `lib/ip.ts` and `lib/auth.ts` before exposing the
server directly.

### Database and Redis

To run only PostgreSQL and Redis from `compose.yaml` (their credentials match
`DATABASE_URL` and `REDIS_URL` in `.env.example`):

```bash
podman compose up -d db redis
```

### Database Setup

```bash
pnpm db
```

This runs migrations, formats the schema, and generates the Prisma client.

### Development

```bash
pnpm dev
```

## Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `pnpm dev`           | Start development server           |
| `pnpm build`         | Production build                   |
| `pnpm start`         | Start production server            |
| `pnpm db`            | Run migrations + format + generate |
| `pnpm lint`          | ESLint with auto-fix               |
| `pnpm format`        | Prettier formatting                |
| `pnpm test:run`      | Run tests                          |
| `pnpm test:coverage` | Generate coverage report           |
| `pnpm studio`        | Prisma Studio                      |

## Docker

`compose.yaml` is the same self-hosted stack locally and in production:
PostgreSQL, Redis, a one-off migration job, then the app. No external service
is needed, and everything is configured from `.env`.

```bash
podman compose up -d --build
```

The `Dockerfile` produces two images:

| Target    | Image                 | Contents                                           |
| --------- | --------------------- | -------------------------------------------------- |
| `runtime` | `boilerplate`         | Alpine + Node binary + Nitro output, ~180 MB       |
| `migrate` | `boilerplate-migrate` | Prisma CLI, runs `prisma migrate deploy` and exits |

- The app runs with `NODE_ENV=production`, as a non-root user, on a read-only
  filesystem with every Linux capability dropped.
- Every variable from `.env.example` is passed to the app container. Required:
  `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_PASSWORD`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Compose refuses to start without
  them, and builds `DATABASE_URL` and `REDIS_URL` from them.
- Redis stores Better Auth sessions and rate limit counters, with append-only
  persistence so sessions survive restarts.
- PostgreSQL and Redis are published on `127.0.0.1` only, for `pnpm dev`,
  `pnpm db` and Prisma Studio.
- The app is published on `127.0.0.1` too (`APP_BIND_ADDRESS`): put a reverse
  proxy or Cloudflare Tunnel in front of it. Anyone reaching the port directly
  could forge the client IP headers rate limiting trusts, so use `0.0.0.0` only
  if the port is firewalled to the proxy.
- `--build` reuses cached base images. To pick up security patches, run
  `podman compose pull --ignore-buildable` and
  `podman compose build --pull` before `up`.
- Images are built for the host architecture. For an amd64 server from an Apple
  Silicon Mac, add `--platform linux/amd64` or build in CI.
- CI builds both images, starts the stack, then checks `/api/health` and that
  the app stops cleanly.

Replace `podman` with `docker` if you use Docker.

### Backups

`db-data` holds every record, and the stack does not back it up. To dump and
restore it:

```bash
podman compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backup.dump
```

```bash
podman compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backup.dump
```

Run the dump on a schedule (cron, systemd timer) and copy it off the server.
Redis only holds sessions and rate limit counters: losing `redis-data` signs
every user out, without losing data.

## Architecture

This project follows Clean Architecture principles while keeping framework code
at the edges:

```
src/
├── app/                   # TanStack Start file routes and server routes
├── server-functions/      # TanStack server functions for mutations/data
├── lib/env/               # Server/client env validation
├── routeTree.gen.ts       # Generated TanStack Router route tree
├── features/              # Domain modules
│   └── {feature}/
│       ├── domain/        # Entities, Value Objects, Repository interfaces
│       ├── application/   # Use Cases, DTOs, Ports
│       ├── infrastructure/# Repository implementations, Adapters
│       └── interface/     # Controllers, Schemas
│
└── shared/                # Shared infrastructure
    ├── domain/            # Base classes (Entity, ValueObject)
    ├── application/       # Shared interfaces
    └── infrastructure/    # DI Container, HTTP helpers
```

Routes live in `src/app` and use TanStack Router file conventions:
`__root.tsx` for the root layout, `index.tsx` for `/`, `_dashboard` for the
protected pathless layout, `$param` for dynamic params, and `$` for splats.
`src/routeTree.gen.ts` is generated, committed, and not edited by hand.

### Features

| Module    | Description                     |
| --------- | ------------------------------- |
| `auth`    | Authentication, sessions, OAuth |
| `user`    | User management, profiles       |
| `email`   | Plunk integration, templates    |
| `storage` | R2 file uploads, presigned URLs |
| `admin`   | Admin dashboard, user stats     |

## Development Workflow

1. **Database Changes**: Update `schema.prisma` → Run `pnpm db`
2. **New Feature**: Entity → Repository → Use Case → Tests → Controller → DI → Route
3. **New Page**: Add a route in `src/app`, SEO via `Route.head`, and data via `loader`
4. **Mutations**: Add a `createServerFn` wrapper in `src/server-functions`
5. **Server Routes**: Add `server.handlers` in `src/app/api/**`
6. **Protected Routes**: Use `beforeLoad` with `requireSession` or `requireAdmin`
7. **Before Commit**: Run `pnpm test:run`

## Testing

Tests are written with Vitest and follow the same architecture layers:

```bash
pnpm test:run          # Run all tests
pnpm test:coverage     # With coverage report
```

Coverage thresholds: 80% for lines, branches, functions, and statements.

## Author

Built by **Mathieu Dacheux**

- X: [@mathieudacheux](https://x.com/mathieudacheux)
- LinkedIn: [mathieudacheux](https://linkedin.com/in/mathieudacheux)
