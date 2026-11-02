# Pushlab Boilerplate

A modern, production-ready full-stack SaaS boilerplate by [Pushlab](https://pushlab.co), built with TanStack Start, React 19, TypeScript, and Clean Architecture principles.

## Features

- **Authentication** - Email/password, OAuth (GitHub, Google), email verification, password reset
- **Email** - Plunk integration with React Email templates
- **File Storage** - Cloudflare R2 with presigned URLs and image compression
- **Admin Dashboard** - User management, registration statistics
- **MCP Server** - Remote MCP endpoint with OAuth 2.1 so AI clients can call the app's APIs
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
- Docker or Podman with Compose

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

# Header the reverse proxy sets to the client IP (cf-connecting-ip, x-real-ip, x-forwarded-for)
TRUSTED_IP_HEADER=""

# Cloudflare R2 storage (R2_ENDPOINT replaces R2_ACCOUNT_ID for any other S3 server)
R2_ACCOUNT_ID=""
R2_ENDPOINT=""
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

Rate limiting and Better Auth IP tracking read the client IP from a single
header, `TRUSTED_IP_HEADER`, which must be one your reverse proxy overwrites:
`cf-connecting-ip` behind Cloudflare, `x-real-ip` if the proxy sets it, or
`x-forwarded-for` (the last entry, appended by the proxy, is used). When it is
empty, every IP header is ignored and the socket address is used, which is right
only when clients connect to the app directly. Behind a proxy, leaving it empty
puts every visitor in the same rate limit bucket.

Email/password accounts must verify their email address before signing in, and
`BETTER_AUTH_ADMIN_EMAIL` promotes an account only once its address is verified.
Configure the email provider in production, or password sign-ups cannot finish.

### Development

```bash
pnpm services
pnpm dev
```

`pnpm services` starts PostgreSQL, Redis and a SeaweedFS S3 bucket from
`compose.dev.yaml`, published on `127.0.0.1` (`POSTGRES_PORT`, `REDIS_PORT`,
`STORAGE_PORT`). `pnpm dev` then runs the Vite dev server directly on the host,
reading `DATABASE_URL` and `REDIS_URL` from `.env`, so they must match the
`POSTGRES_*` and `REDIS_PASSWORD` values.

SeaweedFS replaces R2 locally: it creates `R2_BUCKET_NAME` on startup, accepts
the `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` pair, and allows browser
uploads from `BETTER_AUTH_URL`. Point the app at it with
`R2_ENDPOINT=http://localhost:8333`, or leave `R2_ENDPOINT` empty and set
`R2_ACCOUNT_ID` to use a real R2 bucket. Apply pending
migrations with `pnpm db`. Stop the services with `docker compose --file compose.dev.yaml stop`.

### Database Setup

```bash
pnpm db
```

This creates migrations, formats the schema, and generates the Prisma client
against the PostgreSQL container published on `POSTGRES_PORT`.

## Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `pnpm services`      | Start PostgreSQL, Redis, S3 bucket |
| `pnpm dev`           | Start the Vite dev server          |
| `pnpm build`         | Production build                   |
| `pnpm start`         | Start production server            |
| `pnpm db`            | Run migrations + format + generate |
| `pnpm lint`          | ESLint with auto-fix               |
| `pnpm format`        | Prettier formatting                |
| `pnpm test:run`      | Run tests                          |
| `pnpm test:coverage` | Generate coverage report           |
| `pnpm studio`        | Prisma Studio                      |

## Docker

There are two Compose files:

| File                      | Used by         | Contents                                          |
| ------------------------- | --------------- | ------------------------------------------------- |
| `compose.dev.yaml`        | `pnpm services` | PostgreSQL, Redis and SeaweedFS for local dev     |
| `compose.production.yaml` | Coolify         | A one-off migration job, then the app, built here |

In production, PostgreSQL and Redis are Coolify database resources, not part
of the stack: the app reaches them through `DATABASE_URL` and `REDIS_URL`.

The `Dockerfile` produces two images:

| Target    | Contents                                           |
| --------- | -------------------------------------------------- |
| `runtime` | Alpine + Node binary + Nitro output, ~175 MB       |
| `migrate` | Prisma CLI, runs `prisma migrate deploy` and exits |

- The app runs with `NODE_ENV=production`, as a non-root user, on a read-only
  filesystem with every Linux capability dropped.
- The app depends on the migration job finishing, so a migration that fails
  stops the deploy before the new app starts.
- `migrate` is marked `exclude_from_hc`, a Coolify key, so its exit does not
  mark the resource unhealthy. Plain `docker compose` rejects that key: the
  production file is meant for Coolify only.
- CI builds both images, starts `compose.dev.yaml`, runs the migrations and the app
  against it, then checks `/api/health` and that the app stops cleanly. It also
  validates `compose.production.yaml`.

## CI/CD

| Workflow                   | Runs on                                    | Does                                                                     |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `.github/workflows/ci.yml` | Push to `dev`, pull requests, called by CD | Format, lint, types, tests, then builds both images and smoke tests them |
| `.github/workflows/cd.yml` | Push to `main`                             | Runs CI, then triggers the Coolify deployment                            |

### Branches

Work happens on `dev`, or on feature branches merged into it. `main` is
production: it only receives pull requests from `dev`, and merging one
deploys it.

```
feature/x ──PR──▶ dev ──PR──▶ main ──▶ Coolify
```

- `main` is protected: a pull request can only be merged once CI passes, and
  nobody pushes to it directly.
- Merge `dev` into `main` with **Create a merge commit**, never squash: a squash
  gives `main` commits `dev` does not have, and every later pull request
  conflicts.

### Deploying

Every merge into `main` is deployed, except one that only changes
`README.md`, `AGENTS.md`, `.agents/` or `.claude/`. CD:

1. Runs CI on it. A failure stops there: no deploy.
2. Calls the Coolify deploy webhook. Coolify pulls `main`, builds both images,
   runs the migrations, then replaces the app.

Deploys run one at a time. Pushes made while one runs are deployed together
by the next run.

`/api/health` runs `SELECT 1` on PostgreSQL and `PING` on Redis, and answers
503 if either fails. It is the app's Docker healthcheck, so Coolify shows a
deploy that cannot reach its database as unhealthy.

Roll back from the Coolify dashboard, or revert the commit on `main`.
Migrations are not rolled back, so keep them compatible with the previous
deploy: add columns and tables in one deploy, drop the old ones in a later
one.

### Coolify setup

Once, in the Coolify project that hosts the app:

1. Create a **PostgreSQL 18** database and a **Redis** database. Keep their
   ports unpublished: the app reaches them over the Docker network.
2. Create a resource from this repository with the **Docker Compose** build
   pack, branch `main`, and set **Docker Compose Location** to
   `/compose.production.yaml`.
3. In the resource settings, turn on **Connect To Predefined Network**, so the
   stack joins the network the databases are on, and turn off **Auto Deploy**:
   CD triggers deploys once CI has passed.
4. Set the `app` service domain to `https://app.example.com:3000`. Coolify
   routes it to the container port and issues the certificate.
5. Fill in the environment variables Coolify lists from the Compose file.
   Required: `DATABASE_URL` and `REDIS_URL` (the **internal** URLs shown on the
   database resources), `BETTER_AUTH_URL` (`https://app.example.com`) and
   `BETTER_AUTH_SECRET` (`openssl rand -base64 32`). Every other variable from
   `.env.example` is optional.
6. Under **Webhooks**, copy the deploy webhook URL, and create an API token
   with the `deploy` permission under **Keys & Tokens → API tokens**.

`TRUSTED_IP_HEADER` defaults to `x-forwarded-for`, which Coolify's proxy
overwrites. Behind Cloudflare's proxy, set it to `cf-connecting-ip` instead.

`BETTER_AUTH_SECRET` signs sessions and encrypts two-factor secrets: a new one
signs everyone out and breaks two-factor sign-in, so never change it once
deployed.

### Secrets

Repository secrets, under **Settings → Secrets and variables → Actions →
Secrets**, or with `gh`:

```bash
gh secret set CI_POSTGRES_PASSWORD --body "$(openssl rand -hex 32)"
gh secret set CI_REDIS_PASSWORD --body "$(openssl rand -hex 32)"
gh secret set CI_BETTER_AUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set COOLIFY_WEBHOOK --body "https://coolify.example.com/api/v1/deploy?uuid=<uuid>&force=false"
gh secret set COOLIFY_TOKEN
```

| Name                                        | Used by | Notes                                              |
| ------------------------------------------- | ------- | -------------------------------------------------- |
| `CI_POSTGRES_PASSWORD`, `CI_REDIS_PASSWORD` | CI      | Smoke test stack only, never the production values |
| `CI_BETTER_AUTH_SECRET`                     | CI      | Smoke test stack only, never the production value  |
| `COOLIFY_WEBHOOK`                           | CD      | Deploy webhook URL of the Coolify resource         |
| `COOLIFY_TOKEN`                             | CD      | Coolify API token with the `deploy` permission     |

Production settings live in Coolify, not in GitHub. GitHub does not pass
secrets to pull requests from forks or Dependabot, so CI fails on those.

### Backups

Coolify backs up the PostgreSQL resource. Once, in the Cloudflare dashboard:

1. Create a bucket for backups only, separate from the app's `R2_BUCKET_NAME`.
2. Create an R2 API token with **Object Read & Write** on that bucket only.
3. Under the bucket's settings, add an object lifecycle rule that deletes
   objects after 30 days.

Then in Coolify, add the bucket under **Storages** (endpoint
`https://<account-id>.r2.cloudflarestorage.com`, region `auto`), and on the
PostgreSQL resource, under **Backups**, schedule a daily backup with
**Save to S3** on that storage. Restores run from the same page.

Redis only holds sessions and rate limit counters: losing it signs every user
out, without losing data.

To dump or restore the local database:

```bash
docker compose --file compose.dev.yaml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backup.dump
```

```bash
docker compose --file compose.dev.yaml exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backup.dump
```

## MCP Server

The app serves a remote [MCP](https://modelcontextprotocol.io) server at
`https://<your-domain>/api/mcp` (Streamable HTTP). MCP clients such as Claude,
ChatGPT, Cursor or VS Code connect with the URL alone:

1. The client gets a `401` pointing to
   `/.well-known/oauth-protected-resource/api/mcp`, then discovers the
   authorization server at `/.well-known/oauth-authorization-server/api/auth`.
2. It registers itself through a Client ID Metadata Document or Dynamic Client
   Registration (`/api/auth/oauth2/register`, rate limited).
3. The user signs in on `/auth/signin` and approves the client on
   `/auth/consent`.
4. The client calls the tools with the access token. Every tool runs as that
   user, with the same permissions as in the app.

Tools cover the profile, notification preferences, organizations, members and
invitations. Admins also get the `admin_*` tools (overview, users, roles, bans,
organizations, audit logs).

`BETTER_AUTH_URL` (or the server URL) must be the public HTTPS origin in
production, because it is the token issuer and the MCP resource identifier.

To try it locally, run `pnpm dev`, then:

```bash
npx @modelcontextprotocol/inspector
```

and connect to `http://localhost:3000/api/mcp`.

To add a tool, create it with `defineMcpTool` in `src/mcp/tools/*.tools.ts`,
call a controller from the DI container in its handler, and add it to
`mcpTools` in `src/mcp/server.ts`.

## Architecture

This project follows Clean Architecture principles while keeping framework code
at the edges:

```
src/
├── app/                   # TanStack Start file routes and server routes
├── server-functions/      # TanStack server functions for mutations/data
├── lib/env/               # Server/client env validation
├── mcp/                   # MCP server and tools
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
7. **MCP Tools**: Add a `defineMcpTool` in `src/mcp/tools` and list it in `mcpTools`
8. **Before Commit**: Run `pnpm test:run`
9. **Deploy**: merge a pull request from `dev` into `main`, CD deploys it

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
