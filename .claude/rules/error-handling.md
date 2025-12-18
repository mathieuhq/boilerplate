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

## Throwing Errors

**API Routes** (`/lib/errors`):

```typescript
throw ZodRouteError.unauthorized("Session not found");
throw ZodRouteError.forbidden("Admin access required");
throw ZodRouteError.notFound("User");
throw ZodRouteError.badRequest("INVALID_INPUT", "Invalid email format");
```

**Server Actions** (`/lib/errors`):

```typescript
throw ActionError.unauthorized("Session not found");
throw ActionError.forbidden("Admin access required");
throw ActionError.notFound("User");
```

**Domain/Application Layer** (`/src/shared/domain/errors`):

```typescript
throw HttpError.notFound("User");
throw HttpError.conflict("EMAIL_EXISTS", "Email already in use");
```

## Result Pattern

Use cases return `Result<T>`:

```typescript
const result = await useCase.execute(input);
if (result.isFailure) {
  throw result.error;
}
return result.value;
```

## Feature-specific Errors

- `UserNotFoundError` - User domain
- `ForbiddenActionError` - Admin domain

Create errors in `src/features/{domain}/domain/errors/`
