# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 full-stack application with TypeScript, PostgreSQL (Prisma), Better Auth, Stripe payments, and Resend emails. Uses App Router with Server Components and follows a strict layered architecture pattern.

## Development Commands

```bash
# Development
pnpm dev                 # Start Next.js dev server
pnpm build              # Build production app
pnpm start              # Start production server

# Database
pnpm db                 # Run migrations, format schema, generate client

# Code Quality
pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier formatting

# Local Development
pnpm stripe             # Listen to Stripe webhooks (forwards to localhost:3000/api/webhooks/stripe)
```

**Pre-commit hooks**: Husky + lint-staged automatically runs ESLint and Prettier on staged files.

## Layered Architecture

The codebase follows a strict layered architecture with clear separation of concerns:

```
API Routes / Server Actions
         ↓
    Controllers (Business Logic + Validation)
         ↓
    Services (Data Access + External APIs)
         ↓
    Adapters (Third-party Service Implementations)
         ↓
    Database (Prisma ORM)
```

**Actions** (`/actions`): Server actions using `next-safe-action`. Type-safe with Zod validation and built-in auth middleware. Pattern:

```typescript
authAction.inputSchema(schema).action(async ({ parsedInput, ctx }) => {
  // ctx.user is available from auth middleware
});
```

**Controllers** (`/controllers`): Business logic orchestration. Returns standardized `{ success: boolean, data?: any, error?: string }`. Validates with Zod schemas.

**Services** (`/services`): Pure data access and external API calls. Organized by domain (auth, email, payment, user). Singleton pattern for service instances.

**Adapters** (`/services/*/adapters`): Interface-based implementations for third-party services. Allows easy swapping of providers (e.g., ResendAdapter implements MailAdapter interface).

## Two API Patterns

**Pattern A: API Routes** (`/app/api`):

- Use `next-zod-route` for type-safe route handlers
- Schema validation for query params, body, and URL params
- `authRoute` middleware for protected endpoints
- Example: `/api/users` routes

**Pattern B: Server Actions** (`/actions`):

- Use `next-safe-action` for type-safe server actions
- Built-in authentication context via `authAction`
- Automatic revalidation support
- Example: `updateUserAction`, `postEmailAction`

**When to use which**: Use server actions for form submissions and mutations tied to UI components. Use API routes for REST endpoints, webhooks, or external integrations.

## Authentication Architecture

**Server-Side** (`/lib/auth.ts`):

- Better Auth with Prisma adapter and PostgreSQL sessions
- Email/password + OAuth (GitHub, Google)
- Features: email verification, password reset, email change verification, account deletion
- Session config: 20 day expiry, 7 day update interval
- Stripe plugin automatically creates customers on signup

**Client-Side** (`/lib/auth-client.ts`):

- React hooks: `useSession`, `signOut`
- Stripe subscription plugin integration

**Auth Service** (`/services/auth/auth.service.ts`):

- `getSession()` - Get current session
- `getUser()` - Get current user or null
- `getRequiredUser()` - Get user or redirect to signin

## Email Service Architecture

Implements adapter pattern for swappable email providers:

1. **Interface**: `MailAdapter` defines contract (`/services/email/adapters/mail-adapter.interface.ts`)
2. **Implementation**: `ResendAdapter` implements interface
3. **Service**: `EmailService` depends on interface (dependency inversion)

EmailService features:

- Send transactional emails
- Subscribe/unsubscribe contacts to audience
- React Email templates with Tailwind
- Development mode subject prefixing
- HTML rendering from React components

Used by Better Auth for verification emails, password reset, etc.

## Database & Prisma

**Configuration**:

- PostgreSQL datasource with `@prisma/adapter-pg` for connection pooling
- Custom output: `lib/generated/prisma`
- Singleton pattern in `lib/prisma.ts` prevents connection exhaustion in dev

**Workflow**:

1. Update `schema.prisma`
2. Run `pnpm db` (migrates, formats, generates client)
3. Import from `@/lib/generated/prisma`

**Models**:

- `User` - Core user data with language support, Stripe/Resend IDs
- `Session` - User sessions with IP and user agent tracking
- `Account` - OAuth and password accounts
- `Verification` - Email verification tokens

## Schema Validation

**Centralized schemas** (`/schemas`): All Zod schemas organized by domain. Reused across actions, routes, and controllers.

Pattern:

```typescript
export const schema = z.object({...});
export type SchemaInput = z.infer<typeof schema>;
```

Import and use in actions, controllers, and routes for consistent validation.

## Error Handling & Logging

**Custom Error Classes**:

- `ApplicationError` - Expected business logic errors
- `ZodRouteError` - API route errors with HTTP status

**Error Flow**:

- Controllers/Services throw `ApplicationError`
- Safe actions catch and transform to user-friendly messages
- Development mode shows full error details
- All errors logged with tslog

**Structured Logging**:

```typescript
logger.info("Email sent", { userId, emailId });
logger.error("Failed to send", { error, userId });
```

## Code Quality & Formatting

**ESLint**:

- TypeScript strict rules
- React hooks enforcement
- Custom import order (configured below)
- TanStack Query best practices

**Import Order** (enforced by `eslint-plugin-simple-import-sort`):

1. React imports
2. Next.js imports
3. External packages
4. Internal absolute imports (`@/`)
5. Relative imports
6. CSS imports

**Prettier**:

- 80 character line width
- 2 space indentation
- Semicolons required
- Double quotes
- Tailwind class sorting (via plugin)

## Type Safety

**Environment Variables**:

- Use `@t3-oss/env-nextjs` with Zod validation
- Define in `/lib/env.ts`
- Separate server/client validation
- Runtime validation on startup

**TypeScript**:

- Strict mode enabled
- Path alias: `@/*` → root directory
- Prisma client uses custom output location

## Key Integrations

**Stripe**:

- `StripeAdapter` for API calls
- `PaymentService` for business logic
- Better Auth plugin creates customers on signup
- Webhook handling at `/api/webhooks/stripe`

**Resend**:

- Email service via adapter pattern
- React Email templates in `/emails`
- Better Auth integration for transactional emails

**TanStack Query**:

- Client-side data fetching
- Configured in `/lib/query-client.ts`
- Use with server actions for optimistic updates

## Development Workflow

1. **Database Changes**: Update `schema.prisma` → Run `pnpm db`
2. **New API Endpoint**: Create schema → Controller → Service → Route/Action
3. **New Feature**: Component → Hook → Server Action → Controller → Service
4. **Authentication**: Use `authAction` or `authRoute` for protected endpoints
5. **Email Template**: Create React Email component → Use `EmailService.send()`
6. **Payment Logic**: Use `PaymentService` → Handle webhooks for events
