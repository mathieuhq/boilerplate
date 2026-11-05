# Pushlab Boilerplate

A modern, production-ready full-stack SaaS boilerplate by [Pushlab](https://pushlab.co), built with TanStack Start, React 19, TypeScript, and Clean Architecture principles.

## Features

- **Authentication** - Email/password, OAuth (GitHub, Google), email verification, password reset, two-factor authentication, passkeys
- **Sessions** - Active sessions per device with browser, OS, IP and last activity, per-session revoke and sign out of all other devices
- **Organizations** - Multi-tenant organizations with members, roles, email invitations and an activity log for owners and admins
- **Email** - Plunk integration with React Email templates
- **File Storage** - Cloudflare R2 with presigned URLs and image compression
- **Admin Dashboard** - User and organization management, registration statistics, audit logs, custom roles with per-feature read/write access, audited user impersonation
- **Data Tables** - Server-driven lists with pagination, sorting, search, filters, bulk actions and CSV export, all kept in the URL
- **Global Search** - `⌘K` command menu searching pages, members, users and organizations, case and accent insensitive
- **Background Jobs** - BullMQ queue on Redis with retries, a worker in the app process and cron schedules
- **In-app Notifications** - Real-time notifications over Server-Sent Events and Redis pub/sub, with a header bell, toasts and read state synced across tabs
- **Personal Data Export** - GDPR export from `/settings/profile`: a ZIP of readable JSON files and stored files, without secrets, limited to one every 24 hours and deleted after 7 days
- **MCP Server** - Remote MCP endpoint with OAuth 2.1 so AI clients can call the app's APIs
- **Internationalization** - Multi-language support (EN, FR)
- **Clean Architecture** - Domain-driven design with clear separation of concerns
- **Type Safety** - End-to-end TypeScript with Zod validation
- **Testing** - Vitest with 100% coverage thresholds

## Tech Stack

| Category   | Technologies                                                |
| ---------- | ----------------------------------------------------------- |
| Framework  | TanStack Start, TanStack Router, Vite, React 19, TypeScript |
| Database   | PostgreSQL, Prisma 7, Redis                                 |
| Jobs       | BullMQ                                                      |
| Auth       | Better Auth                                                 |
| Email      | Plunk, React Email                                          |
| Storage    | Cloudflare R2 (AWS S3 SDK)                                  |
| Styling    | Tailwind CSS 4, Radix UI                                    |
| Testing    | Vitest                                                      |
| Validation | Zod 4                                                       |

## Getting Started

### Prerequisites

- Node.js 26+
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

# Redis: sessions, rate limiting, cache, jobs and notifications (required in production)
REDIS_URL="redis://:password@localhost:6379"

# Header the reverse proxy sets to the client IP (cf-connecting-ip, x-real-ip, x-forwarded-for)
TRUSTED_IP_HEADER=""

# Cloudflare R2 storage (R2_ENDPOINT replaces R2_ACCOUNT_ID for any other S3 server)
R2_ACCOUNT_ID=""
R2_ENDPOINT=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""

# Stripe organization billing (required)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_PRICE_ID=""
STRIPE_TEAM_PRICE_ID=""
STRIPE_TEAM_SEAT_PRICE_ID=""
```

Stripe bills organizations through `@better-auth/stripe`. Create three monthly
recurring prices: `STRIPE_PRO_PRICE_ID` (Pro, members cannot be added),
`STRIPE_TEAM_PRICE_ID` (Team base price) and `STRIPE_TEAM_SEAT_PRICE_ID` (Team
price per member beyond the owner, who is included in the base price). The
seat quantity is kept at the member count minus one, with prorations, after
checkout, on every subscription update and on every member change. Both plans start with a 7-day
free trial, granted once per organization. Point a webhook at
`/api/v1/private/auth/stripe/webhook` with the `checkout.session.completed` and
`customer.subscription.created`, `.updated` and `.deleted` events. Free and Pro
users own a single organization and cannot invite members. Owning an
organization with an active or trialing Team subscription allows up to five
owned organizations, and inviting or accepting an invitation requires the
organization itself to be on Team. Leaving Team keeps existing members and
organizations but cancels pending invitations. Platform admins bypass both
limits. Locally, run
`pnpm stripe` (Stripe CLI) and copy the printed `whsec_` secret to
`STRIPE_WEBHOOK_SECRET`.

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

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm services`      | Start PostgreSQL, Redis, S3 bucket       |
| `pnpm dev`           | Start the Vite dev server                |
| `pnpm build`         | Production build                         |
| `pnpm start`         | Start production server                  |
| `pnpm db`            | Run migrations + format + generate       |
| `pnpm db:ia`         | Same as `pnpm db` with a named migration |
| `pnpm lint`          | Oxlint with auto-fix                     |
| `pnpm format`        | Oxfmt formatting                         |
| `pnpm test:run`      | Run tests                                |
| `pnpm test:coverage` | Generate coverage report                 |
| `pnpm studio`        | Prisma Studio                            |
| `pnpm stripe`        | Forward Stripe webhooks to the dev app   |
| `pnpm tsc`           | Type check                               |
| `pnpm knip`          | Find unused files and exports            |

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
  against it, then checks `/api/v1/public/health` and that the app stops cleanly. It also
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

`/api/v1/public/health` runs `SELECT 1` on PostgreSQL and `PING` on Redis, and answers
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

Redis only holds sessions, rate limit counters, cached reads, the job queue and
notification pub/sub: losing it signs every user out and drops pending jobs,
without losing stored data.

To dump or restore the local database:

```bash
docker compose --file compose.dev.yaml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backup.dump
```

```bash
docker compose --file compose.dev.yaml exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backup.dump
```

## Roles and Access

Every user has one platform role, stored in `user.role`. A role grants an
access level per feature: no access, `read`, or `write` (which includes read).
Two system roles are built in and cannot be deleted: `admin` has full access to
every feature, including the ones added later, and cannot be changed, while
`user`, the default role of every account, has no access until it is edited.
Admins edit the `user` role and create custom roles on `/admin/roles`:

| Feature         | Levels      | Read                                | Write                         |
| --------------- | ----------- | ----------------------------------- | ----------------------------- |
| `overview`      | read        | Overview metrics and registrations  |                               |
| `users`         | read, write | User list                           | Ban, unban and change roles   |
| `organizations` | read        | Organizations, members, invitations |                               |
| `audit-logs`    | read        | Audit logs                          |                               |
| `roles`         | read, write | Roles and their access              | Create, edit and delete roles |
| `impersonation` | write       |                                     | Sign in as another user       |

Features live in `ACCESS_FEATURES` (`src/shared/domain/access-control.ts`). To
add one, register it with its group and supported levels, add its EN/FR labels
under `admin.access.features`, then guard it with `getRequiredActionAccess` in
server functions, `accessRoute` in API routes, `assertAccess(context.access, …)`
in `beforeLoad`, `useAccess().can(…)` in components and `access` on MCP tools.
Roles are stored as `feature:level` entries, so no migration is needed.

A user reaches `/admin` as soon as their role reads one admin page and only sees
the pages it allows. Nobody can grant, assign or revoke access they lack, or ban
or change the role of a user with more access. A role can only be deleted once
no user holds it, and every change is written to the audit logs.

### Impersonation

Users with `impersonation` write access get a button on `/admin/users` to sign
in as another user for 30 minutes, to reproduce what they see. The target must
not be an admin, banned or the actor, and the actor's access must cover the
target's. A banner across the dashboard shows who is impersonated, until when,
and a Stop button that restores the actor's own session.

Better Auth's own impersonation routes are disabled: starts and stops go through
`ImpersonateAdminUserUseCase` and `StopImpersonationUseCase`, which write
`admin.impersonation.started` and `admin.impersonation.stopped` to the audit
logs. Session revocation is blocked while impersonating, and organization
events done during an impersonation are flagged in the organization activity.

## Sessions and Activity

`/settings/security` lists the user's active sessions with the browser, OS and
device parsed from the user agent, the IP, the last activity and which one is
the current device. Each session can be revoked, or every other one at once;
each revocation is written to the audit logs as `auth.session.revoked` or
`auth.session.revoked-others`.

`/settings/organization-activity` shows owners and admins of the active
organization what happened in it: creation and updates, invitations sent,
canceled, accepted or rejected, members removed, role changes and departures.
A Better Auth after hook (`lib/organization-activity-log.ts`) records them on
the organization endpoints, so every path that goes through Better Auth is
logged.

## Data Tables

Admin lists (`/admin/users`, `/admin/organizations`, `/admin/audit-logs`) are
rendered by `DataTable` (`components/features/data-table/data-table.tsx`) and
paginated, sorted, searched and filtered on the server. Page, page size (10,
20, 50 or 100), sort, search and filters live in the URL, so a filtered view
can be shared or bookmarked; column visibility is remembered per table in
`localStorage`. Rows can be selected for bulk actions, such as banning users.

Each list is built from the same pieces:

1. The feature's domain declares its sortable fields as a const array.
2. `createListQuerySchema({ sortFields, filters })`
   (`src/shared/interface/schemas/list-query.schema.ts`) validates the URL with
   `text`, `select`, `multiSelect`, `boolean` and `dateRange` filters. Invalid
   values fall back to defaults and unknown keys are dropped.
3. The Prisma repository turns the query into `findMany` arguments with
   `toPrismaListArgs`, whose `sortable` and `filters` keys are the whitelist,
   and returns `toPaginatedResult`.
4. The route uses the schema as `validateSearch` and loads data with
   `loadListData`, which returns `null` on failure so the table shows its error
   state.

The export button calls a `GET` route under `/api/v1/private/admin/*/export` that parses
the same query, streams every filtered row as CSV (up to 50,000, in batches of 500) and writes the export to the audit logs. Values are quoted per RFC 4180,
formulas are neutralized and the file starts with a BOM so Excel reads UTF-8.

## Background Jobs

Jobs run on a BullMQ queue stored in Redis. The worker starts with the app
(`src/jobs/worker.ts`, a Nitro plugin), so there is no extra process to deploy.
Failed jobs retry 5 times with exponential backoff.

| Job                               | Trigger                             | Does                                                                        |
| --------------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `email.send`                      | Every auth email                    | Delivers the email through the provider, retried if the provider fails      |
| `auth.purge-expired-records`      | Every day at 03:00 (`jobSchedules`) | Deletes expired sessions, verifications, OAuth tokens and client assertions |
| `notification.dispatch`           | Every `NotificationController.send` | Resolves the recipients, stores one notification each and pushes it live    |
| `notification.purge-read`         | Every day at 03:30 (`jobSchedules`) | Deletes notifications read more than 90 days ago                            |
| `user.export-data`                | Every data export request           | Builds the ZIP, stores it on S3, then sends a notification and an email     |
| `user.purge-expired-data-exports` | Every day at 04:00 (`jobSchedules`) | Deletes expired data exports and their S3 objects                           |

Without `REDIS_URL`, jobs run inline in the request and schedules are disabled.

To add a job:

1. Declare its name and payload in the feature's `application/jobs/*.jobs.ts`
   and add that type to `AppJobs` in `src/jobs/jobs.ts`.
2. Add its handler to `getJobHandlers()` in the DI container. Handlers call a
   controller, like MCP tools.
3. Enqueue it from a use case that receives an `IJobQueuePort`, or schedule it
   with a cron pattern in `jobSchedules`.

## Notifications

In-app notifications are separate from the email preferences in
`/settings/notifications`. They are stored in the `notification` table and
pushed live to every open tab of their recipients:

1. `container.getNotificationController().send(input)` validates the link and
   enqueues `notification.dispatch`, so the caller never waits for the fan-out.
2. The job resolves the audience, skips `excludeUserIds` (usually the actor),
   stores one row per recipient and publishes a `notification.created` event.
3. `GET /api/v1/private/notifications/stream` is a Server-Sent Events stream per signed-in
   user. With `REDIS_URL` events go through Redis pub/sub so every app instance
   receives them; without it they stay in process memory.
4. The header bell (`components/features/notification/notification-bell.tsx`)
   loads the latest notifications, shows the unread count, raises a toast for
   new ones and keeps read state in sync across tabs.

An audience is one of:

| Audience                                           | Recipients                                              |
| -------------------------------------------------- | ------------------------------------------------------- |
| `{ kind: "users", userIds }`                       | These users, if they still exist                        |
| `{ kind: "organization", organizationId, roles? }` | Members of the organization, optionally only some roles |
| `{ kind: "access", feature, level }`               | Users whose role grants that access, admins included    |

To add a notification type:

1. Declare its payload in `NotificationPayloads`
   (`src/features/notification/domain/notification.types.ts`), for example
   `"organization.member-joined": { memberName: string; organizationName: string }`.
2. Add `notifications.types.organization.member-joined.title` and an optional
   `body` to `messages/en.json` and `messages/fr.json`. Payload fields are
   interpolated with `{memberName}`.
3. Trigger it from a use case through a port the use case owns, wired in the DI
   container to the notification controller:

```ts
new AcceptOrganizationInvitationUseCase(organizationManagement, {
  memberJoined: async ({
    organizationId,
    memberId,
    memberName,
    organizationName,
  }) =>
    this.getNotificationController().send({
      audience: {
        kind: "organization",
        organizationId,
        roles: ["owner", "admin"],
      },
      type: "organization.member-joined",
      data: { memberName, organizationName },
      link: "/settings/organization",
      excludeUserIds: [memberId],
    }),
});
```

A job handler or a cron entry can call `send` the same way. Links must be
relative app paths such as `/settings`.

## Global Search

The command menu (`⌘K`) searches the server once the query has at least two
characters. `globalSearchAction` (`src/server-functions/search.functions.ts`)
rate limits each user, resolves their access and active organization, then
`GlobalSearchUseCase` runs every provider the user may use in parallel, keeps
5 results per type and drops a provider that fails or takes more than 2 seconds
without breaking the others. Recent searches are stored in `localStorage` per
user.

| Provider        | Results                                  | Requirement                             |
| --------------- | ---------------------------------------- | --------------------------------------- |
| `pages`         | Navigation pages from `NAVIGATION_PAGES` | Signed in, each page filtered by access |
| `members`       | Members of the active organization       | Owner or admin of that organization     |
| `users`         | Users by name or email                   | `users` read access                     |
| `organizations` | Organizations by name or slug            | `organizations` read access             |

Database providers match through `public.search_normalize(column)`, an
immutable `lower(unaccent(...))` function backed by `pg_trgm` GIN indexes, so
`elodie` finds `Élodie`. To add an entity, write an `ISearchProvider` in
`src/features/search/infrastructure/providers/`, register it in
`getSearchProviders()` of the DI container and add its `command.groups` label.

## API

HTTP endpoints live under `/api/v1`, split by who calls them:

| Prefix              | Called by                                  | Auth                                       |
| ------------------- | ------------------------------------------ | ------------------------------------------ |
| `/api/v1/public/*`  | Scripts, integrations, MCP clients, probes | `x-api-key` header, MCP access token, none |
| `/api/v1/private/*` | The app itself, Better Auth, Stripe, OAuth | Session cookie or the Better Auth protocol |

`publicRoute` (`lib/zod-route.ts`) authenticates a public route with the
`x-api-key` header and hands the handler the key owner. `GET /api/v1/public/me`
returns that owner:

```bash
curl -H "x-api-key: <key>" https://<your-domain>/api/v1/public/me
```

Users create and revoke their keys on `/settings/api-keys`. The secret is shown
once, keys are hashed at rest, a banned owner's keys stop working, and creation
and revocation are written to the audit log (`auth.api-key.created`,
`auth.api-key.revoked`). Better Auth's own `/api-key/*` HTTP endpoints are
disabled so every change goes through the audited use cases.

In production, requests are rate limited per client IP (100 per minute) only on
`/api/v1/*` and on `POST` server functions. Pages, loaders, assets and
`/api/v1/public/health` are never limited, `/api/v1/private/auth/*` keeps Better
Auth's own limiter, and each API key is also limited to 100 requests per minute.

## MCP Server

The app serves a remote [MCP](https://modelcontextprotocol.io) server at
`https://<your-domain>/api/v1/public/mcp` (Streamable HTTP). MCP clients such as Claude,
ChatGPT, Cursor or VS Code connect with the URL alone:

1. The client gets a `401` pointing to
   `/.well-known/oauth-protected-resource/api/v1/public/mcp`, then discovers the
   authorization server at `/.well-known/oauth-authorization-server/api/v1/private/auth`.
2. It registers itself through a Client ID Metadata Document or Dynamic Client
   Registration (`/api/v1/private/auth/oauth2/register`, rate limited).
3. The user signs in on `/auth/signin` and approves the client on
   `/auth/consent`.
4. The client calls the tools with the access token. Every tool runs as that
   user, with the same access as in the app.

Tools cover the profile, notification preferences, organizations, members and
invitations. Users whose role grants admin access also get the matching `admin_*`
tools (overview, users, role assignment, bans, organizations, audit logs, roles),
each listed only when the role has the feature and level it needs.

`BETTER_AUTH_URL` (or the server URL) must be the public HTTPS origin in
production, because it is the token issuer and the MCP resource identifier.

To try it locally, run `pnpm dev`, then:

```bash
npx @modelcontextprotocol/inspector
```

and connect to `http://localhost:3000/api/v1/public/mcp`.

To add a tool, create it with `defineMcpTool` in `src/mcp/tools/*.tools.ts`,
call a controller from the DI container in its handler, and add it to
`mcpTools` in `src/mcp/server.ts`.

## Architecture

This project follows Clean Architecture principles while keeping framework code
at the edges:

```
├── src/
│   ├── app/                # TanStack Start file routes and server routes
│   ├── server-functions/   # TanStack server functions
│   ├── mcp/                # MCP server and tools (endpoint: /api/v1/public/mcp)
│   ├── jobs/               # Job types, schedules and the BullMQ worker
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

Routes live in `src/app` and use TanStack Router file conventions:
`__root.tsx` for the root layout, `index.tsx` for `/`, `_dashboard` for the
protected pathless layout, `$param` for dynamic params, and `$` for splats.
`src/routeTree.gen.ts` is generated, committed, and not edited by hand.

### Features

| Module         | Description                                               |
| -------------- | --------------------------------------------------------- |
| `auth`         | Authentication, sessions, OAuth, 2FA, passkeys            |
| `user`         | Profiles, notification preferences, personal data export  |
| `organization` | Organizations, members, invitations, activity log         |
| `email`        | Plunk integration, templates                              |
| `storage`      | R2 file uploads and downloads, presigned URLs             |
| `admin`        | Admin dashboard, roles, access, audit logs, impersonation |
| `notification` | In-app notifications, real-time stream                    |
| `search`       | Global search providers for the command menu              |

## Development Workflow

1. **Database Changes**: Update `schema.prisma` → Run `pnpm db`
2. **New Feature**: Entity → Repository → Use Case → Tests → Controller → DI → Route
3. **New Page**: Add a route in `src/app`, SEO via `Route.head`, and data via `loader`
4. **Mutations**: Add a `createServerFn` wrapper in `src/server-functions`
5. **Server Routes**: Add `server.handlers` in `src/app/api/**`
6. **Protected Routes**: Use `beforeLoad` with `requireSession`, which returns the user's `access`, and `assertAccess`; each admin page requires read access to the feature listed in `ADMIN_PAGES`
7. **MCP Tools**: Add a `defineMcpTool` in `src/mcp/tools` and list it in `mcpTools`
8. **Background Jobs**: Type the job in `AppJobs`, add its handler in the DI container, enqueue it through `IJobQueuePort` or schedule it in `jobSchedules`
9. **Notifications**: Add the payload to `NotificationPayloads` and its EN/FR copy under `notifications.types`, then call `getNotificationController().send` from a port wired in the DI container
10. **Global Search**: Write an `ISearchProvider` and register it in `getSearchProviders()`
11. **List Pages**: Build the schema with `createListQuerySchema`, translate it with `toPrismaListArgs`, and render a `DataTable`
12. **Before Commit**: Run `pnpm test:run`
13. **Deploy**: merge a pull request from `dev` into `main`, CD deploys it

## Testing

Tests are written with Vitest and follow the same architecture layers:

```bash
pnpm test:run          # Run all tests
pnpm test:coverage     # With coverage report
```

Coverage thresholds: 100% for lines, branches, functions, and statements, enforced in CI.

## Author

Built by **Mathieu Dacheux**

- X: [@mathieudacheux](https://x.com/mathieudacheux)
- LinkedIn: [mathieudacheux](https://linkedin.com/in/mathieudacheux)
