---
name: error-handling
description: Error hierarchy and handling patterns. Use when throwing errors, handling exceptions, using the Result pattern, or creating custom error types. Triggers on error handling, throwing errors, Result pattern, ApplicationError, DomainError, HttpError.
---

# Error Handling

## Error Hierarchy

```
Error
└── ApplicationError
    ├── DomainError
    ├── HttpError (with HTTP status)
    ├── ZodRouteError (API routes)
    └── ActionError (server actions)
```

## When to Use Each Error

| Context              | Error Class      | Import From                    |
| -------------------- | ---------------- | ------------------------------ |
| API Routes           | `ZodRouteError`  | `@/lib/errors`                 |
| Server Actions       | `ActionError`    | `@/lib/errors`                 |
| Domain/Application   | `HttpError`      | `@/shared/domain/errors`       |
| Feature-specific     | Custom errors    | `@/features/{domain}/errors`   |

## Result Pattern

Use cases return `Result<T>` for explicit success/failure:

```typescript
const result = await useCase.execute(input);
if (result.isFailure) {
  throw result.error;
}
return result.value;
```

## Quick Examples

```typescript
// API Routes
throw ZodRouteError.notFound("User");
throw ZodRouteError.forbidden("Admin access required");

// Server Actions
throw ActionError.unauthorized("Session not found");

// Domain layer
throw HttpError.conflict("EMAIL_EXISTS", "Email already in use");
```

See [reference.md](reference.md) for all error methods.
See [examples.md](examples.md) for real error implementations.
