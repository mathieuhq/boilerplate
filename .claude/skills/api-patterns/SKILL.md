---
name: api-patterns
description: API route and Server Action patterns for Next.js. Use when creating API endpoints, server actions, handling HTTP responses, or implementing data mutations. Triggers on API routes, server actions, response format, HTTP status codes.
---

# API Patterns

## Decision Rule

| Pattern        | HTTP Methods | Use Case                                    |
| -------------- | ------------ | ------------------------------------------- |
| API Routes     | GET only     | Read operations (leverage Next.js caching)  |
| Server Actions | Mutations    | POST, PUT, PATCH, DELETE (form submissions) |

**Critical**: API Routes should ONLY be used for GET requests. All mutations MUST use Server Actions.

## API Routes (`/app/api`) - GET Only

Use `adminRoute` or `authRoute` wrappers with `ApiResponse` helpers.

```typescript
export const GET = adminRoute
  .query(schema)
  .handler(async (_req, { query }) => {
    const controller = container.getAdminController();
    const result = await controller.listUsers(query);
    return ApiResponse.paginated(result.users, { total: result.total });
  });
```

## Server Actions (`/actions`) - All Mutations

Use `authAction` wrapper with `ActionResponse` helpers.

```typescript
export const updateUserAction = authAction
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const controller = container.getUserController();
    const result = await controller.updateUserProfile(ctx.user.id, parsedInput);
    return ActionResponse.success(result);
  });
```

## Response Format

- **Success**: `{ data: T }` or `{ data: T, meta: { total: number } }`
- **Error**: `{ error: { code: string, message: string, details?: unknown } }`

See [reference.md](reference.md) for HTTP codes and helpers.
See [examples.md](examples.md) for real project examples.
