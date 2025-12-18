# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 full-stack application with TypeScript, PostgreSQL (Prisma), Better Auth, Stripe payments, and Resend emails. Uses App Router with Server Components and follows **Clean Architecture** with domain-based folder structure.

## Development Commands

```bash
# Development
pnpm dev                # Start Next.js dev server
pnpm build              # Build production app
pnpm start              # Start production server

# Database
pnpm db:ai              # Run migrations, format schema, generate client

# Code Quality
pnpm lint               # ESLint with auto-fix
pnpm format             # Prettier formatting

# Testing
pnpm test:run           # Run all tests with Vitest
pnpm test:coverage      # Run tests with coverage report

# Local Development
pnpm stripe             # Listen to Stripe webhooks (forwards to localhost:3000/api/webhooks/stripe)
```

**Pre-commit hooks**: Husky + lint-staged automatically runs ESLint and Prettier on staged files.

## Clean Architecture

The codebase follows Clean Architecture with domain-based folder structure and manual dependency injection:

```
src/
├── features/           # Domain-based modules
│   ├── user/          # User domain
│   ├── auth/          # Authentication domain
│   ├── email/         # Email domain
│   ├── admin/         # Admin domain
│   └── payment/       # Payment domain
└── shared/            # Shared infrastructure
    ├── domain/        # Base classes (Entity, ValueObject, errors)
    ├── application/   # Interfaces (IUseCase, Result)
    └── infrastructure/# DI Container
```

### Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    FRAMEWORKS & DRIVERS                      │
│  (Next.js Pages, API Routes, Server Actions, Prisma Client)  │
└────────────────────────────┬────────────────────────────────┘
                             │ uses
┌────────────────────────────▼────────────────────────────────┐
│                    INTERFACE ADAPTERS                        │
│  (Controllers, Zod Schemas)                                  │
└────────────────────────────┬────────────────────────────────┘
                             │ calls
┌────────────────────────────▼────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  (Use Cases, DTOs, Ports interfaces)                         │
└────────────────────────────┬────────────────────────────────┘
                             │ uses
┌────────────────────────────▼────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  (Entities, Value Objects, Repository interfaces, Errors)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                       │
│  (Repository impls, Adapters: Prisma, Resend, Stripe, etc)   │
│  Implements interfaces from Domain and Application layers    │
└─────────────────────────────────────────────────────────────┘
```

### Domain Structure (per feature)

Each domain follows this structure:

```
src/features/{domain}/
├── domain/
│   ├── entities/           # Domain entities (user.entity.ts)
│   ├── value-objects/      # Immutable value objects (email.value-object.ts)
│   ├── repositories/       # Repository interfaces (user.repository.interface.ts)
│   └── errors/             # Domain-specific errors (user-not-found.error.ts)
├── application/
│   ├── use-cases/          # Business operations (get-user-by-id.use-case.ts)
│   ├── dto/                # Data transfer objects (user-response.dto.ts)
│   └── ports/              # External service interfaces (email-notifier.port.ts)
├── infrastructure/
│   ├── repositories/       # Repository implementations (prisma-user.repository.ts)
│   ├── adapters/           # External service adapters (resend.adapter.ts)
│   └── mappers/            # Entity-persistence mappers (prisma-user.mapper.ts)
└── interface/
    ├── controllers/        # HTTP/Action handlers (user.controller.ts)
    └── schemas/            # Zod validation schemas (user.schema.ts)
```

### DI Container

All dependencies are wired through a manual DI container at `src/shared/infrastructure/di/container.ts`:

```typescript
import { container } from "@/shared/infrastructure/di/container";

// Get controllers with all dependencies injected
const userController = container.getUserController();
const emailController = container.getEmailController();
const authController = container.getAuthController();
const adminController = container.getAdminController();
```

### Key Patterns

**Entities**: Rich domain objects with business logic

```typescript
export class User extends Entity<UserProps> {
  get id(): UserId { return this.props.id; }
  get email(): Email { return this.props.email; }

  updateProfile(data: {...}): void { /* business logic */ }
  shouldSubscribeToMarketing(newPref: boolean): boolean { /* rules */ }
}
```

**Value Objects**: Immutable objects with validation

```typescript
export class Email extends ValueObject<EmailProps> {
  static create(email: string): Email {
    if (!isValidEmail(email)) throw new Error("Invalid email");
    return new Email({ value: email });
  }
}
```

**Use Cases**: Single responsibility operations

```typescript
export class UpdateUserProfileUseCase implements IUseCase<Input, Output> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: Input): Promise<Result<Output>> {
    // 1. Validate input
    // 2. Load entity
    // 3. Execute business logic
    // 4. Persist changes
    // 5. Return result
  }
}
```

**Result Pattern**: Explicit success/failure handling

```typescript
const result = await useCase.execute(input);
if (result.isFailure) {
  throw result.error;
}
return result.value;
```

## Two API Patterns

**Pattern A: API Routes** (`/app/api`):

- Use `next-zod-route` for type-safe route handlers
- Schema validation for query params, body, and URL params
- `authRoute` middleware for protected endpoints
- Return responses using `ApiResponse` helpers

```typescript
import { ApiResponse } from "@/shared/infrastructure/http";

export const GET = adminRoute
  .query(listUsersSchema)
  .handler(async (_req, { query }) => {
    const adminController = container.getAdminController();
    const result = await adminController.listUsers(query);
    return ApiResponse.paginated(result.users, { total: result.total });
  });
```

**Pattern B: Server Actions** (`/actions`):

- Use `next-safe-action` for type-safe server actions
- Built-in authentication context via `authAction`
- Return responses using `ActionResponse` helpers

```typescript
import { ActionResponse } from "@/shared/infrastructure/http";

export const updateUserAction = authAction
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userController = container.getUserController();
    const result = await userController.updateUserProfile(
      ctx.user.id,
      parsedInput,
    );
    return ActionResponse.success(result);
  });
```

**When to use which**: Use server actions for form submissions and mutations tied to UI components. Use API routes for REST endpoints, webhooks, or external integrations.

## Standardized Response Format

All API routes and server actions use a **unified response format** for consistency.

### Response Structure

**Success Response:**

```typescript
{ data: T }                           // Simple response
{ data: T, meta: { total: number } }  // Paginated response
```

**Error Response:**

```typescript
{
  error: {
    code: string;      // e.g., "USER_NOT_FOUND", "FORBIDDEN"
    message: string;   // Human-readable message
    details?: unknown; // Optional validation details
  }
}
```

### HTTP Status Codes

| Code | Constant                   | Usage                   |
| ---- | -------------------------- | ----------------------- |
| 200  | `HttpStatus.OK`            | Successful request      |
| 201  | `HttpStatus.CREATED`       | Resource created        |
| 204  | `HttpStatus.NO_CONTENT`    | Success with no body    |
| 400  | `HttpStatus.BAD_REQUEST`   | Invalid request         |
| 401  | `HttpStatus.UNAUTHORIZED`  | Authentication required |
| 403  | `HttpStatus.FORBIDDEN`     | Access denied           |
| 404  | `HttpStatus.NOT_FOUND`     | Resource not found      |
| 409  | `HttpStatus.CONFLICT`      | Resource conflict       |
| 422  | `HttpStatus.UNPROCESSABLE` | Validation error        |
| 500  | `HttpStatus.INTERNAL`      | Server error            |

### API Response Helpers

Located in `src/shared/infrastructure/http/api-response.ts`:

```typescript
import { ApiResponse } from "@/shared/infrastructure/http";

// Success responses
ApiResponse.success(data); // 200 OK
ApiResponse.created(data); // 201 Created
ApiResponse.noContent(); // 204 No Content
ApiResponse.paginated(data, { total: 100 }); // 200 with meta

// Error responses
ApiResponse.badRequest("CODE", "message");
ApiResponse.unauthorized("message");
ApiResponse.forbidden("message");
ApiResponse.notFound("Resource"); // -> "RESOURCE_NOT_FOUND"
ApiResponse.conflict("CODE", "message");
ApiResponse.validationError("message", details);
ApiResponse.internalError("message");
```

### Action Response Helpers

Located in `src/shared/infrastructure/http/api-response.ts`:

```typescript
import { ActionResponse } from "@/shared/infrastructure/http";

// In server actions
return ActionResponse.success(data);
return ActionResponse.error("CODE", "message", details);
```

### Client-Side Helpers

Located in `lib/actions/actions-utils.ts`:

```typescript
import {
  isActionSuccessful,
  getActionErrorMessage,
  getActionErrorCode,
} from "@/lib/actions/actions-utils";

const result = await updateUserAction(data);

if (isActionSuccessful(result)) {
  const user = result.data.data; // Access the data
} else {
  const code = getActionErrorCode(result); // "FORBIDDEN"
  const message = getActionErrorMessage(result); // "Access denied"
  toast.error(message);
}
```

## Server Components Pattern

Server Components (pages and layouts) use controllers from the DI container:

```typescript
// app/(dashboard)/settings/profile/page.tsx
export default async function ProfilePage() {
  const userController = container.getUserController();
  const user = await userController.getCurrentUserProfile();
  return <ProfileSettingsView user={user} />;
}

// app/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }: Props) {
  const userController = container.getUserController();
  const user = await userController.getCurrentUser();
  return <Layout user={user}>{children}</Layout>;
}
```

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

**Auth Domain** (`/src/features/auth`):

- `BetterAuthAdapter` implements `IAuthProviderPort`
- Use cases: `GetSessionUseCase`, `GetCurrentUserUseCase`, `GetActiveSubscriptionsUseCase`

## Email Domain

Implements Clean Architecture with adapter pattern:

- **Port**: `IEmailProviderPort` defines contract
- **Adapter**: `ResendAdapter` implements port
- **Use Cases**: `SendEmailUseCase`, `SubscribeContactUseCase`, `UnsubscribeContactUseCase`

Features:

- Send transactional emails
- Subscribe/unsubscribe contacts to audience
- React Email templates with Tailwind
- Development mode subject prefixing

## Database & Prisma

**Configuration**:

- PostgreSQL datasource with `@prisma/adapter-pg` for connection pooling
- Custom output: `lib/generated/prisma`
- Singleton pattern in `lib/db.ts` prevents connection exhaustion in dev

**Workflow**:

1. Update `schema.prisma`
2. Run `pnpm db` (migrates, formats, generates client)
3. Import from `@/lib/generated/prisma`

**Models**:

- `User` - Core user data with language support, Stripe/Resend IDs
- `Session` - User sessions with IP and user agent tracking
- `Account` - OAuth and password accounts
- `Verification` - Email verification tokens

## Error Handling

### Error Hierarchy

```
Error
└── ApplicationError (base for expected errors)
    ├── DomainError (domain-specific errors)
    ├── HttpError (API errors with HTTP status)
    ├── ZodRouteError (API route errors)
    └── ActionError (server action errors)
```

**Domain Errors** (`/src/shared/domain/errors`):

- `DomainError` - Base class for domain errors
- `ApplicationError` - Expected business logic errors
- `HttpError` - HTTP-aware error with status code and error code

**Route/Action Errors** (`/lib/errors`):

- `ZodRouteError` - For API routes, includes HTTP status
- `ActionError` - For server actions

**Feature-specific Errors**:

- `UserNotFoundError` - User domain
- `ForbiddenActionError` - Admin domain

### Throwing Errors

Use static factory methods for clean error creation:

```typescript
// In API routes
throw ZodRouteError.unauthorized("Session not found");
throw ZodRouteError.forbidden("Admin access required");
throw ZodRouteError.notFound("User");
throw ZodRouteError.badRequest("INVALID_INPUT", "Invalid email format");

// In server actions
throw ActionError.unauthorized("Session not found");
throw ActionError.forbidden("Admin access required");
throw ActionError.notFound("User");

// In domain/application layer
throw HttpError.notFound("User");
throw HttpError.conflict("EMAIL_EXISTS", "Email already in use");
```

### Result Pattern

Use cases return `Result<T>` for explicit success/failure handling:

```typescript
const result = await useCase.execute(input);
if (result.isFailure) {
  throw result.error;
}
return result.value;
```

## Naming Conventions

| Type                 | Pattern                          | Example                           |
| -------------------- | -------------------------------- | --------------------------------- |
| Entity               | `{name}.entity.ts`               | `user.entity.ts`                  |
| Value Object         | `{name}.value-object.ts`         | `email.value-object.ts`           |
| Repository Interface | `{name}.repository.interface.ts` | `user.repository.interface.ts`    |
| Repository Impl      | `prisma-{name}.repository.ts`    | `prisma-user.repository.ts`       |
| Use Case             | `{verb}-{noun}.use-case.ts`      | `update-user-profile.use-case.ts` |
| DTO                  | `{name}.dto.ts`                  | `user-response.dto.ts`            |
| Port                 | `{name}.port.ts`                 | `email-provider.port.ts`          |
| Adapter              | `{provider}.adapter.ts`          | `resend.adapter.ts`               |
| Controller           | `{domain}.controller.ts`         | `user.controller.ts`              |
| Mapper               | `prisma-{name}.mapper.ts`        | `prisma-user.mapper.ts`           |
| Schema               | `{domain}.schema.ts`             | `user.schema.ts`                  |
| Error                | `{name}.error.ts`                | `user-not-found.error.ts`         |

## Code Quality & Formatting

**ESLint**:

- TypeScript strict rules
- React hooks enforcement
- Custom import order
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
- Path aliases: `@/*` → root, `@/features/*` → src/features, `@/shared/*` → src/shared
- Prisma client uses custom output location

## Key Integrations

**Stripe**:

- `StripeAdapter` in Payment domain
- Better Auth plugin creates customers on signup
- Webhook handling at `/api/webhooks/stripe`

**Resend**:

- `ResendAdapter` in Email domain
- React Email templates in `/emails`
- Better Auth integration for transactional emails

**TanStack Query**:

- Client-side data fetching
- Configured in `/lib/query-client.ts`
- Use with server actions for optimistic updates

## Testing (MANDATORY)

**All code changes MUST include tests using Vitest.** Testing is not optional.

**Commands**:

```bash
pnpm test:run           # Run all tests
pnpm test:coverage      # Run with coverage report
```

**Test Structure**:

Tests are located in `__tests__` folders within each domain layer:

```
src/features/{domain}/
├── domain/__tests__/           # Entity and value object tests
├── application/__tests__/      # Use case tests
src/shared/
├── domain/__tests__/           # Shared domain tests
├── application/__tests__/      # Shared application tests
```

**Coverage Requirements** (minimum 80%):

- Lines: 80%
- Branches: 80%
- Functions: 80%
- Statements: 80%

**Test File Naming**: `{name}.test.ts`

**What to Test**:

1. **Domain Layer**: Entity behavior, value object validation
2. **Application Layer**: Use case logic with mocked repositories
3. **Edge cases**: Error handling, boundary conditions

**Example Test**:

```typescript
import { describe, expect, it, vi } from "vitest";

describe("UpdateUserProfileUseCase", () => {
  it("should update user profile successfully", async () => {
    // Arrange
    const mockRepository = { findById: vi.fn(), save: vi.fn() };
    const useCase = new UpdateUserProfileUseCase(mockRepository);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isSuccess).toBe(true);
  });
});
```

## Development Workflow

1. **Database Changes**: Update `schema.prisma` → Run `pnpm db`
2. **New Feature**:
   - Create domain entities/value objects if needed
   - Define repository interface
   - Implement use case(s)
   - **Write tests for all new code**
   - Create controller methods
   - Wire in DI container
   - Create server action or API route
   - **Run `pnpm test:run` to verify tests pass**
3. **New Domain**:
   - Create folder structure under `src/features/{domain}/`
   - Follow existing domain patterns (user, email, auth, admin, payment)
   - Add controller to DI container
   - **Create `__tests__` folders and write tests**
4. **New Page**: When creating a new page, **always add SEO metadata**:
   - Add the page's SEO config in `lib/seo.ts` with `title` and `description`
   - Import and export metadata in the page file using `getPageMetadata()`
   - Example:

     ```typescript
     // lib/seo.ts - Add new entry
     newPage: {
       title: "Page Title",
       description: "Page description for search engines.",
     },

     // app/new-page/page.tsx
     import { getPageMetadata } from "@/lib/seo";
     import type { Metadata } from "next";

     export const metadata: Metadata = getPageMetadata("newPage");
     ```

5. **Authentication**: Use `authAction` or `authRoute` for protected endpoints
6. **Email Template**: Create React Email component → Use `EmailController.sendEmail()`
7. **Before Committing**: Always run `pnpm test:run` to ensure all tests pass
