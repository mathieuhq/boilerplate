# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Create production build
npm run start        # Run production server
```

### Database Operations

```bash
npm run db           # Run migrations, format schema, generate Prisma client
```

This command chains: `prisma migrate dev && prisma format && prisma generate`

### Code Quality

```bash
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
```

### Stripe Development

```bash
npm run stripe       # Listen to Stripe webhooks (forwards to localhost:3000/api/webhooks/stripe)
```

## Architecture Overview

This is a full-stack Next.js 16 application using the App Router with a **layered architecture**:

```
API Routes / Server Actions
         ↓
    Controllers (validation)
         ↓
     Services (business logic)
         ↓
    Database (Prisma + PostgreSQL)
```

### Core Technology Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Authentication**: Better-Auth with Prisma adapter
- **Database**: PostgreSQL via Prisma ORM
- **Payments**: Stripe (integrated via Better-Auth plugin)
- **Email**: Resend with React-Email templates
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack Query (mutations)
- **Server Actions**: next-safe-action (type-safe actions)
- **Styling**: Tailwind CSS v4 + Shadcn/UI components

## Key Architectural Patterns

### 1. Authentication (Better-Auth)

**Server-side** (`lib/auth.ts`):

- Configured with Prisma adapter for PostgreSQL
- Email/password authentication + optional OAuth (GitHub, Google)
- Stripe plugin auto-creates customers on signup
- Session duration: 20 days, updates after 7 days

**Client-side** (`lib/auth-client.ts`):

- React hooks: `useSession()`, `signOut()`
- Service wrapper: `services/auth/auth-client.service.ts`

**Usage**:

- Server components: `await AuthService.getUser()` or `AuthService.getRequiredUser()`
- Client components: `const { data: session } = useSession()`
- API routes use `authRoute` (defined in `lib/zod-route.ts`)
- Server actions use `authAction` (defined in `lib/actions/safe-actions.ts`)

### 2. Database Layer (Prisma)

**Models**: User, Session, Account, Verification (see `prisma/schema.prisma`)

**Data Access Pattern**:

- Services handle all Prisma operations (`services/user/user.service.ts`)
- Singleton client in `lib/db.ts` prevents connection exhaustion in dev
- Prisma client generates to `generated/prisma/client` (custom path)

**After schema changes**:

```bash
npm run db  # Migrate + format + generate
```

### 3. API Patterns

This codebase uses **two patterns** for APIs:

**A) API Routes with next-zod-route** (`/app/api` directory):

```typescript
// Example: GET /api/users
export const GET = route
  .use(listUsersQuerySchema)
  .handler(async ({ output }) => {
    // output is validated and typed
  });
```

- Type-safe with Zod validation
- Use `authRoute` for authenticated endpoints (from `lib/zod-route.ts`)
- Automatic error handling for `ApplicationError` and `ZodRouteError`

**B) Server Actions with next-safe-action** (`/actions` directory):

```typescript
export const updateUserAction = authAction
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    // parsedInput is validated
    // ctx.user is available (from authAction middleware)
  });
```

- Automatically validates input via Zod schemas
- `authAction` provides authenticated user context
- Called from client via `useMutation()` (TanStack Query)

### 4. Form Pattern

Standard form implementation flow:

1. Define Zod schema in `schemas/` directory
2. Create TypeScript type: `type FormData = z.infer<typeof schema>`
3. Initialize form: `useForm({ resolver: zodResolver(schema) })`
4. Wrap in mutation: `useMutation({ mutationFn: serverAction })`
5. Use Shadcn form components: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`

Example in `components/features/sign/sign-up-form.tsx`

### 5. Service Layer with Adapters

**Payment Service** (`services/payment/`):

- Interface: `PaymentAdapter`
- Implementation: `StripeAdapter`
- Orchestrator: `PaymentService`
- Auto-creates Stripe customers via Better-Auth plugin

**Email Service** (`services/email/`):

- Interface: `MailAdapter`
- Implementation: `ResendAdapter`
- Renders React components to HTML via `@react-email/render`
- Auto-prefixes subjects with "[DEV]" in development

**Storage Service** (`services/storage/`):

- Interface: `StorageAdapter`
- Implementation: `S3Adapter`
- Orchestrator: `StorageService`
- File upload/download with S3, signed URLs, automatic key generation

This adapter pattern allows easy swapping of implementations.

### 6. Error Handling

**Error Classes** (`lib/errors/`):

- `ApplicationError`: Expected business logic errors (safe to show users)
- `ActionError`: Server action specific errors
- `ZodRouteError`: API validation errors

**Error Flow**:

- Services throw `ApplicationError` for expected issues
- `handleServerError()` (in server actions) shows ApplicationErrors to client, hides others in production
- API routes automatically format errors as `{ error: string, details?: any }`
- Client mutations show errors via `toast.error()`

### 7. Type Safety

**Environment Variables** (`lib/env.ts`):

- Validated at runtime with Zod via `@t3-oss/env-nextjs`
- Type-safe access throughout application
- See `.env.example` for required variables

**Type Flow**:

```
Zod Schema → TypeScript Type → Runtime Validation → Typed Result
```

All boundaries (API routes, server actions, forms) use Zod schemas.

## Project Structure

```
app/
├── api/                      # API routes
│   ├── auth/[...all]/       # Better-Auth catch-all handler
│   └── users/               # User CRUD endpoints
├── auth/                     # Authentication pages (signin, signup, forget-password)
├── layout.tsx                # Root layout with providers
└── providers.tsx             # Client-side provider wrapper (Query, Theme)

components/
├── ui/                       # Shadcn/UI primitives (Button, Form, Input, etc.)
└── features/                 # Feature-specific components
    ├── auth/                 # AuthButton, AuthDropdown, AuthTemplate
    ├── form/                 # FormButton, PasswordInput
    └── sign/                 # SignInForm, SignUpForm

lib/
├── auth.ts                   # Server-side Better-Auth config
├── auth-client.ts            # Client-side Better-Auth config
├── db.ts                     # Prisma singleton client
├── env.ts                    # Environment validation
├── logger.ts                 # TSLog configuration
├── zod-route.ts              # API route utilities (route, authRoute)
├── errors/                   # Error classes
└── actions/                  # Server action utilities (action, authAction)

actions/                      # Server actions (mutations)
├── user/                     # User update/delete actions
└── email/                    # Email sending actions

services/                     # Business logic layer
├── auth/                     # Authentication logic
├── user/                     # User data operations
├── email/                    # Email service with Resend adapter
├── payment/                  # Payment service with Stripe adapter
└── storage/                  # Storage service with S3 adapter

controllers/                  # Request validation layer
├── user.controller.ts        # User input validation
└── email.controller.ts       # Email input validation

schemas/                      # Zod validation schemas
├── user/                     # User schemas (list, update, profile)
└── email/                    # Email schemas (send)

hooks/                        # Custom React hooks
prisma/                       # Database configuration
├── schema.prisma             # Data models
└── migrations/               # Migration history

generated/                    # Generated files (Prisma client)
```

## Important Conventions

### File Organization

- **Server actions**: Export named actions (e.g., `export const updateUserAction`)
- **Services**: Export singleton instances (e.g., `export const userService = new UserService()`)
- **Controllers**: Export class instances (e.g., `export const userController = new UserController()`)
- **Schemas**: Export const schemas (e.g., `export const updateUserProfileSchema`)
- **No index.ts files**: Never create `index.ts` files. Services and modules export directly from their main files (e.g., `*.service.ts`). Import directly from the source file instead of using barrel exports.

### Component Patterns

- Server components by default (no `"use client"` directive)
- Client components only when needed (forms, hooks, interactivity)
- Separate client services (e.g., `auth-client.service.ts`) from server services

### Naming Conventions

- Server actions: `{verb}{Entity}Action` (e.g., `updateUserAction`)
- Services: `{Entity}Service` (e.g., `UserService`)
- Controllers: `{Entity}Controller` (e.g., `UserController`)
- Schemas: `{verb}{entity}Schema` or `{entity}QuerySchema` (e.g., `updateUserProfileSchema`, `listUsersQuerySchema`)

### Response Format

- **Success**: `{ success: true, data: T }`
- **Error**: `{ error: string, details?: any }`

## Working with Key Features

### Adding a New Server Action

1. Create Zod schema in `schemas/` if needed
2. Create action in `actions/` directory:

```typescript
export const myAction = authAction // or just 'action' if public
  .inputSchema(mySchema)
  .action(async ({ parsedInput, ctx }) => {
    // Implementation
  });
```

3. Call from client component:

```typescript
const { mutate, isPending } = useMutation({
  mutationFn: myAction,
  onSuccess: () => toast.success("Done!"),
  onError: (error) => toast.error(error.message),
});
```

### Adding a New API Route

1. Create route file in `app/api/` directory
2. Define Zod schema for input validation
3. Use `route` or `authRoute` helper:

```typescript
export const GET = authRoute
  .use(myQuerySchema)
  .handler(async ({ output, user }) => {
    // output is validated query params
    // user is available if using authRoute
    return Response.json({ success: true, data: result });
  });
```

### Adding Database Models

1. Update `prisma/schema.prisma`
2. Run `npm run db` to migrate and regenerate client
3. Create/update service in `services/` to interact with new model
4. Add Zod schemas for validation

### Sending Emails

Use the email service with React-Email templates:

```typescript
await emailService.sendEmail({
  to: ["user@example.com"],
  subject: "Welcome!",
  html: await render(WelcomeEmail({ name: "User" })),
});
```

### Stripe Integration

Stripe customers are auto-created on user signup. Access via:

```typescript
const customerId = await paymentService.getOrCreateCustomer(userId);
```

### Storage with S3

Upload, download, and manage files with the storage service:

```typescript
// Upload a file
const result = await storageService.uploadFile(fileBuffer, {
  filename: "avatar.png",
  contentType: "image/png",
  prefix: `users/${userId}`,
  metadata: { uploadedBy: userId },
});

// Generate signed URL for temporary access
const urlResult = await storageService.getSignedUrl({
  key: result.data.key,
  expiresIn: 3600, // 1 hour
});

// Delete a file
await storageService.deleteFile(key);
```

## Environment Setup

Required environment variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_URL`: Application URL
- `BETTER_AUTH_SECRET`: Min 32 chars random string
- `EMAIL_FROM`, `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`: Email config
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`: Stripe config
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Client-side Stripe key
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`: AWS S3 config

Optional (for OAuth):

- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Code Style

- **ESLint**: TypeScript strict mode, React hooks rules, TanStack Query rules
- **Prettier**: 80-char line width, Tailwind class sorting plugin
- **Imports**: Use `simple-import-sort` ESLint plugin (auto-sorted)
- **Styling**: Tailwind utility classes, use `cn()` helper for conditional classes

Run `npm run lint` and `npm run format` before committing.

## Logging

Use the logger from `lib/logger.ts`:

```typescript
logger.debug("Debug info", { data });
logger.info("Info message");
logger.warn("Warning");
logger.error("Error occurred", error);
```

Development shows all logs, production shows only errors (level 3+).
