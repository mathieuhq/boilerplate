# Pushlab Boilerplate

A modern, production-ready full-stack SaaS boilerplate by [Pushlab](https://pushlab.co), built with Next.js 16, TypeScript, and Clean Architecture principles.

## Features

- **Authentication** - Email/password, OAuth (GitHub, Google), email verification, password reset
- **Payments** - Stripe integration with subscriptions, webhooks, and customer portal
- **Email** - Plunk integration with React Email templates
- **File Storage** - Cloudflare R2 with presigned URLs and image compression
- **Admin Dashboard** - User management, registration statistics
- **Internationalization** - Multi-language support (EN, FR)
- **Clean Architecture** - Domain-driven design with clear separation of concerns
- **Type Safety** - End-to-end TypeScript with Zod validation
- **Testing** - Vitest with 80% coverage thresholds

## Tech Stack

| Category   | Technologies                         |
| ---------- | ------------------------------------ |
| Framework  | Next.js 16, React 19, TypeScript 5.9 |
| Database   | PostgreSQL, Prisma 7                 |
| Auth       | Better Auth                          |
| Payments   | Stripe                               |
| Email      | Plunk, React Email                   |
| Storage    | Cloudflare R2 (AWS S3 SDK)           |
| Styling    | Tailwind CSS 4, Radix UI             |
| Testing    | Vitest                               |
| Validation | Zod 4                                |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+
- Stripe CLI (for webhooks)

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
BETTER_AUTH_SECRET="your-secret"
```

Optional integrations:

```env
# Auth URL override and initial admin promotion
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_ADMIN_EMAIL="admin@example.com,second-admin@example.com"

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

# Upstash Redis rate limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Cloudflare R2 storage
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""

# Analytics
NEXT_PUBLIC_UMAMI_URL=""
NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
```

Empty optional values are treated as absent. In development and tests, missing
optional integrations do not block startup; using an unconfigured integration
returns an explicit error such as `EMAIL_NOT_CONFIGURED`,
`STORAGE_NOT_CONFIGURED`, or `UPSTASH_REDIS_NOT_CONFIGURED`.

### Database Setup

```bash
pnpm db
```

This runs migrations, formats the schema, and generates the Prisma client.

### Development

```bash
pnpm dev
```

For Stripe webhooks in development:

```bash
pnpm stripe
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
| `pnpm stripe`        | Stripe webhook listener            |

## Architecture

This project follows Clean Architecture principles:

```
src/
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

### Features

| Module    | Description                     |
| --------- | ------------------------------- |
| `auth`    | Authentication, sessions, OAuth |
| `user`    | User management, profiles       |
| `payment` | Stripe subscriptions, webhooks  |
| `email`   | Plunk integration, templates    |
| `storage` | R2 file uploads, presigned URLs |
| `admin`   | Admin dashboard, user stats     |

## Development Workflow

1. **Database Changes**: Update `schema.prisma` → Run `pnpm db`
2. **New Feature**: Entity → Repository → Use Case → Tests → Controller → DI → Route
3. **New Page**: Add SEO config in `lib/seo.ts`
4. **Protected Routes**: Use `authAction` or `authRoute`
5. **Before Commit**: Run `pnpm test:run`

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
