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

`pnpm services` starts only PostgreSQL and Redis from `compose.yaml`, published
on `127.0.0.1` (`POSTGRES_PORT`, `REDIS_PORT`). `pnpm dev` then runs the Vite dev
server directly on the host, reading `DATABASE_URL` and `REDIS_URL` from `.env`,
so they must match the `POSTGRES_*` and `REDIS_PASSWORD` values. Apply pending
migrations with `pnpm db`. Stop the services with `docker compose stop db redis`.

### Database Setup

```bash
pnpm db
```

This creates migrations, formats the schema, and generates the Prisma client
against the PostgreSQL container published on `POSTGRES_PORT`.

## Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `pnpm services`      | Start PostgreSQL and Redis         |
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

`compose.yaml` is the production stack: PostgreSQL, Redis, a one-off migration
job, then the app. No external service is needed, and everything is configured
from `.env`. In development only `db` and `redis` run in containers
(`pnpm services`); the app runs on the host with `pnpm dev`.

```bash
podman compose up -d --build
```

The `Dockerfile` produces two images:

| Target    | Image                 | Contents                                           |
| --------- | --------------------- | -------------------------------------------------- |
| `runtime` | `boilerplate`         | Alpine + Node binary + Nitro output, ~175 MB       |
| `migrate` | `boilerplate-migrate` | Prisma CLI, runs `prisma migrate deploy` and exits |

- The app runs with `NODE_ENV=production`, as a non-root user, on a read-only
  filesystem with every Linux capability dropped.
- Every variable from `.env.example` is passed to the app container. Required:
  `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_PASSWORD`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Compose refuses to start without
  them, and builds `DATABASE_URL` and `REDIS_URL` from them.
- Generate `POSTGRES_PASSWORD` and `REDIS_PASSWORD` with `openssl rand -hex 32`:
  they go into connection URLs, which characters such as `/`, `@` or `:` break.
- Redis stores Better Auth sessions and rate limit counters, with append-only
  persistence so sessions survive restarts.
- PostgreSQL and Redis are published on `127.0.0.1` only, for `pnpm dev`,
  `pnpm db` and Prisma Studio.
- The app is published on `127.0.0.1` too (`APP_BIND_ADDRESS`). In production
  the `proxy` profile puts Caddy in front of it on ports 80 and 443, with
  automatic HTTPS for `DOMAIN` and `TRUSTED_IP_HEADER=x-forwarded-for`. Anyone
  reaching the app port directly could forge that header, so use `0.0.0.0`
  only if the port is firewalled to the proxy.
- `--build` reuses cached base images. To pick up security patches, run
  `podman compose pull --ignore-buildable` and
  `podman compose build --pull` before `up`.
- Images built locally match the host architecture (arm64 on Apple Silicon).
  Release images are linux/amd64, so the VPS must be x86.
- CI builds both images, starts the stack behind Caddy, then checks
  `/api/health` and that the app stops cleanly. It publishes nothing: release
  images come from CD.

Replace `podman` with `docker` if you use Docker.

## CI/CD

| Workflow                       | Runs on                     | Does                                                                     |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------ |
| `.github/workflows/ci.yml`     | Pull requests, called by CD | Format, lint, types, tests, then builds both images and smoke tests them |
| `.github/workflows/cd.yml`     | Push to `main`              | Runs CI, creates a release, publishes its images, deploys to the VPS     |
| `.github/workflows/backup.yml` | Every day at 03:17 UTC      | Dumps the production database to a Cloudflare R2 bucket                  |

### Releasing

Every push to `main` is released and deployed, except one that only changes
`README.md`, `AGENTS.md`, `.agents/` or `.claude/`. CD:

1. Runs CI on it. A failure stops there: no release, no deploy.
2. Tags the commit with the next patch version, `v0.1.0` then `v0.1.1`, and
   creates a GitHub release listing the commits since the previous one.
3. Publishes `ghcr.io/mathieuhq/boilerplate:vX.Y.Z` and
   `ghcr.io/mathieuhq/boilerplate-migrate:vX.Y.Z`.
4. Over SSH, copies `compose.yaml`, `caddy/` and a `.env` generated from the
   repository secrets to `~/boilerplate`, pulls the images, runs the
   migrations, replaces the app, then checks `https://DOMAIN/api/health`.

Releases run one at a time. Pushes made while one runs are released together
by the next run.

The `package.json` version is the minimum for the next release, so it only
changes for a minor or major bump. Commit it, and the next push releases it:

```bash
pnpm version minor --no-git-tag-version
```

The server builds nothing and keeps no long-lived registry token: each deploy
logs it in to GHCR with the workflow token and logs it out at the end. While
the app container is replaced, Caddy holds incoming requests for up to 30
seconds instead of failing them.

To roll back or redeploy, run the **CD** workflow from the Actions tab with an
earlier tag such as `v1.2.2`: it deploys that release's images, `compose.yaml`
and `Caddyfile` without rebuilding. Migrations are not rolled back, so keep
them compatible with the previous release: add columns and tables in one
release, drop the old ones in a later one.

### Server setup

Once, on a fresh x86 Debian or Ubuntu VPS:

1. Install Docker Engine with the Compose plugin
   ([docs](https://docs.docker.com/engine/install/)).
2. Create the user CD connects as. Membership of `docker` is equivalent to
   root, so keep its key for CD only:

   ```bash
   adduser --disabled-password --gecos "" deploy && usermod -aG docker deploy
   ```

3. Generate a key pair on your machine, and append `deploy_key.pub` to
   `/home/deploy/.ssh/authorized_keys` on the server:

   ```bash
   ssh-keygen -t ed25519 -N "" -C github-actions-deploy -f deploy_key
   ```

4. Open 22/tcp, 80/tcp, 443/tcp and 443/udp in the firewall. Docker publishes
   ports past `ufw` rules, which is why PostgreSQL, Redis and the app listen on
   `127.0.0.1` only.
5. Point an `A` (and `AAAA`) record for `DOMAIN` at the server. Caddy gets the
   Let's Encrypt certificate on the first deploy. Behind Cloudflare, keep the
   record DNS only, or Caddy cannot issue it and every client shares
   Cloudflare's IP.

### Secrets

Every password and key the workflows use, and every setting CD and backups
read, is a repository secret: no GitHub variable is used. Set them under
**Settings → Secrets and variables → Actions → Secrets**, or with `gh`:

```bash
gh secret set CI_POSTGRES_PASSWORD --body "$(openssl rand -hex 32)"
gh secret set CI_REDIS_PASSWORD --body "$(openssl rand -hex 32)"
gh secret set CI_BETTER_AUTH_SECRET --body "$(openssl rand -base64 32)"
gh secret set DEPLOY_SSH_KEY < deploy_key
gh secret set DEPLOY_HOST --body "203.0.113.10"
gh secret set DEPLOY_KNOWN_HOSTS --body "$(ssh-keyscan 203.0.113.10)"
gh secret set DOMAIN --body "app.example.com"
gh secret set POSTGRES_PASSWORD --body "$(openssl rand -hex 32)"
gh secret set REDIS_PASSWORD --body "$(openssl rand -hex 32)"
gh secret set BETTER_AUTH_SECRET --body "$(openssl rand -base64 32)"
```

Check the `ssh-keyscan` output against `ssh-keygen -lf
/etc/ssh/ssh_host_ed25519_key.pub` on the server: CD refuses any other host
key.

| Name                                                     | Used by     | Required     | Notes                                                    |
| -------------------------------------------------------- | ----------- | ------------ | -------------------------------------------------------- |
| `CI_POSTGRES_PASSWORD`, `CI_REDIS_PASSWORD`              | CI          | yes          | Smoke test stack only, never the production values       |
| `CI_BETTER_AUTH_SECRET`                                  | CI          | yes          | Smoke test stack only, never the production value        |
| `DEPLOY_HOST`                                            | CD, backups | yes          | IP or host name of the VPS                               |
| `DEPLOY_KNOWN_HOSTS`                                     | CD, backups | yes          | `ssh-keyscan` output for `DEPLOY_HOST`                   |
| `DEPLOY_SSH_KEY`                                         | CD, backups | yes          | Private key of the deploy user                           |
| `DEPLOY_USER`                                            | CD, backups | no           | Defaults to `deploy`                                     |
| `DEPLOY_PORT`                                            | CD, backups | no           | Defaults to `22`                                         |
| `DOMAIN`                                                 | CD          | yes          | Host name served by Caddy, also sets `BETTER_AUTH_URL`   |
| `POSTGRES_PASSWORD`                                      | CD          | yes          | Never change it once deployed                            |
| `REDIS_PASSWORD`                                         | CD          | yes          |                                                          |
| `BETTER_AUTH_SECRET`                                     | CD          | yes          | Never change it once deployed                            |
| `POSTGRES_USER`, `POSTGRES_DB`                           | CD          | no           | Default to `boilerplate`                                 |
| `BETTER_AUTH_ADMIN_EMAIL`, `BETTER_AUTH_TRUSTED_ORIGINS` | CD          | no           |                                                          |
| `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_SECRET`   | CD          | no           | Written as `GITHUB_CLIENT_*`: GitHub reserves the prefix |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`               | CD          | no           |                                                          |
| `EMAIL_FROM`, `EMAIL_API_KEY`                            | CD          | no           | Sign-ups need the email provider in production           |
| `EMAIL_API_BASE_URL`, `EMAIL_CONTACT_LIST_ID`            | CD          | no           |                                                          |
| `R2_ACCOUNT_ID`                                          | CD, backups | no           | Required for backups                                     |
| `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`                     | CD          | no           |                                                          |
| `R2_SECRET_ACCESS_KEY`                                   | CD          | no           |                                                          |
| `BACKUP_R2_BUCKET_NAME`                                  | backups     | no           | Turns backups on                                         |
| `BACKUP_R2_ACCESS_KEY_ID`, `BACKUP_R2_SECRET_ACCESS_KEY` | backups     | with backups | Token limited to the backup bucket                       |

- PostgreSQL keeps the password it was first started with in `db-data`, so a
  new `POSTGRES_PASSWORD` locks the app out of the database.
- `BETTER_AUTH_SECRET` signs sessions and encrypts two-factor secrets: a new
  one signs everyone out and breaks two-factor sign-in.
- Values must not contain a single quote or a line break.
- GitHub replaces every secret value with `***` in workflow logs, so `DOMAIN`
  shows up masked. A common word such as `deploy` or `boilerplate` would be
  masked everywhere: leave `DEPLOY_USER`, `POSTGRES_USER` and `POSTGRES_DB`
  unset when the default fits.
- GitHub does not pass secrets to pull requests from forks or Dependabot, so CI
  fails on those.
- Every deploy rewrites the server's `.env`, so change settings in GitHub, not
  on the server. It also sets `COMPOSE_PROFILES=proxy`, so `docker compose ps`,
  `logs` or `exec` run in `~/boilerplate` include Caddy.

### Backups

`backup.yml` runs every night, or on demand from the Actions tab. Over SSH, it
runs `pg_dump --format custom` in the `db` container, then uploads the dump to
`postgres/<UTC timestamp>.dump` in an R2 bucket. The R2 keys stay in GitHub:
someone who takes over the server cannot read or delete the backups. GitHub
emails you when a run fails.

The workflow does nothing until `BACKUP_R2_BUCKET_NAME` is set. In the
Cloudflare dashboard:

1. Create a bucket for backups only, separate from the app's `R2_BUCKET_NAME`.
2. Create an R2 API token with **Object Read & Write** on that bucket only.
3. Under the bucket's settings, add an object lifecycle rule that deletes
   objects after 30 days. Backups never delete anything themselves.

```bash
gh secret set R2_ACCOUNT_ID --body "<account-id>"
gh secret set BACKUP_R2_BUCKET_NAME --body "boilerplate-backups"
gh secret set BACKUP_R2_ACCESS_KEY_ID
gh secret set BACKUP_R2_SECRET_ACCESS_KEY
```

To restore, download a dump from the bucket, copy it to the server, and in
`~/boilerplate` stop the app, restore, then start it again:

```bash
docker compose stop app
```

```bash
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backup.dump
```

```bash
docker compose start app
```

The same `pg_restore` command restores into the local stack. To take a dump by
hand:

```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backup.dump
```

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
8. **Release**: push to `main`, CD releases and deploys it

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
