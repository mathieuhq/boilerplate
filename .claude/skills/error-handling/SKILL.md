---
name: error-handling
description: "Error hierarchy with ApplicationError, DomainError, HttpError, ZodRouteError, and ActionError. Result pattern for use cases and domain-specific errors. Use when implementing error handling in API routes, server actions, use cases, or throwing domain-specific errors."
---

## Error Hierarchy

The codebase uses a structured error hierarchy for consistent error handling across all layers.

```
Error (JavaScript base)
└── ApplicationError (Base application error)
    ├── DomainError (Domain layer errors)
    ├── HttpError (General HTTP errors with status codes)
    ├── ZodRouteError (API route-specific errors)
    └── ActionError (Server action-specific errors)
```

---

## Error Types by Layer

### 1. API Routes - Use `ZodRouteError`

For API routes in `/app/api`, use `ZodRouteError` which includes HTTP status codes.

```typescript
import { ZodRouteError } from "@/lib/errors";

// 401 Unauthorized
throw ZodRouteError.unauthorized("Session not found");

// 403 Forbidden
throw ZodRouteError.forbidden("Admin access required");

// 404 Not Found
throw ZodRouteError.notFound("User");

// 400 Bad Request
throw ZodRouteError.badRequest("INVALID_INPUT", "Invalid email format");

// 409 Conflict
throw ZodRouteError.conflict("EMAIL_EXISTS", "Email already in use");

// 422 Validation Error
throw ZodRouteError.validationError("INVALID_DATA", "Validation failed", {
  field: "email",
  issue: "Invalid format",
});
```

### 2. Server Actions - Use `ActionError`

For server actions in `/actions`, use `ActionError`.

```typescript
import { ActionError } from "@/lib/errors";

// 401 Unauthorized
throw ActionError.unauthorized("Session not found");

// 403 Forbidden
throw ActionError.forbidden("Admin access required");

// 404 Not Found
throw ActionError.notFound("User");

// 400 Bad Request
throw ActionError.badRequest("INVALID_INPUT", "Invalid data provided");

// 409 Conflict
throw ActionError.conflict("EMAIL_EXISTS", "Email already registered");
```

### 3. Domain/Application Layer - Use `HttpError`

For use cases and domain logic, use `HttpError` from the shared domain.

```typescript
import { HttpError } from "@/shared/domain/errors";

// Not Found
throw HttpError.notFound("User");

// Conflict
throw HttpError.conflict("EMAIL_EXISTS", "Email already in use");

// Bad Request
throw HttpError.badRequest("INVALID_STATE", "Cannot perform action in current state");

// Forbidden
throw HttpError.forbidden("Cannot access this resource");
```

### 4. Feature-Specific Errors

Create custom errors in domain layer for specific business rules.

```typescript
// src/features/user/domain/errors/user-not-found.error.ts
import { DomainError } from "@/shared/domain/errors";

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = "UserNotFoundError";
  }
}
```

```typescript
// src/features/admin/domain/errors/forbidden-action.error.ts
import { DomainError } from "@/shared/domain/errors";

export class ForbiddenActionError extends DomainError {
  constructor(action: string) {
    super(`Action ${action} is forbidden`);
    this.name = "ForbiddenActionError";
  }
}
```

---

## Result Pattern

Use cases should return `Result<T>` for explicit success/failure handling.

### Basic Usage

```typescript
import { Result } from "@/shared/domain/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

export class UpdateUserProfileUseCase
  implements IUseCase<UpdateUserProfileDTO, void>
{
  async execute(input: UpdateUserProfileDTO): Promise<Result<void>> {
    try {
      const user = await this.userRepository.findById(input.userId);

      if (!user) {
        return Result.fail(HttpError.notFound("User"));
      }

      user.updateProfile(input.name);
      await this.userRepository.save(user);

      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
```

### Handling Results in Controllers

```typescript
export class UserController {
  async updateUserProfile(userId: string, data: UpdateUserProfileDTO): Promise<void> {
    const useCase = new UpdateUserProfileUseCase(this.userRepository);
    const result = await useCase.execute({ ...data, userId });

    if (result.isFailure) {
      throw result.error; // Error propagates to route/action
    }

    return result.value;
  }
}
```

### Result API

```typescript
// Success
const success = Result.ok(value);
success.isSuccess; // true
success.isFailure; // false
success.value; // the value

// Failure
const failure = Result.fail(error);
failure.isSuccess; // false
failure.isFailure; // true
failure.error; // the error

// Without value
const voidSuccess = Result.ok();
```

---

## HTTP Status Code Reference

| Code | Error Type           | When to Use                              |
| ---- | -------------------- | ---------------------------------------- |
| 400  | Bad Request          | Invalid request format or parameters     |
| 401  | Unauthorized         | Not authenticated (no session/token)     |
| 403  | Forbidden            | Authenticated but not authorized         |
| 404  | Not Found            | Resource doesn't exist                   |
| 409  | Conflict             | Duplicate resource (email/username)      |
| 422  | Validation Error     | Request body validation failed           |
| 500  | Internal Server Error| Unexpected server error                  |

---

## Common Error Patterns

### 1. Not Found Errors

```typescript
// API Route
const user = await userRepository.findById(id);
if (!user) {
  throw ZodRouteError.notFound("User");
}

// Server Action
const user = await userRepository.findById(id);
if (!user) {
  throw ActionError.notFound("User");
}

// Use Case
const user = await this.userRepository.findById(input.userId);
if (!user) {
  return Result.fail(HttpError.notFound("User"));
}
```

### 2. Authorization Errors

```typescript
// API Route - No session
if (!session) {
  throw ZodRouteError.unauthorized("Please sign in");
}

// API Route - Insufficient permissions
if (!user.isAdmin()) {
  throw ZodRouteError.forbidden("Admin access required");
}

// Server Action
if (!user.isAdmin()) {
  throw ActionError.forbidden("Admin access required");
}

// Use Case
if (!user.canPerformAction()) {
  return Result.fail(HttpError.forbidden("Insufficient permissions"));
}
```

### 3. Conflict Errors

```typescript
// API Route
const existing = await userRepository.findByEmail(email);
if (existing) {
  throw ZodRouteError.conflict("EMAIL_EXISTS", "Email already registered");
}

// Server Action
const existing = await userRepository.findByEmail(email);
if (existing) {
  throw ActionError.conflict("EMAIL_EXISTS", "Email already in use");
}

// Use Case
const existing = await this.userRepository.findByEmail(input.email);
if (existing) {
  return Result.fail(
    HttpError.conflict("EMAIL_EXISTS", "Email already registered"),
  );
}
```

### 4. Validation Errors

```typescript
// API Route - Custom validation
if (!isValidFormat(input)) {
  throw ZodRouteError.validationError(
    "INVALID_FORMAT",
    "Invalid input format",
    { field: "email" },
  );
}

// Server Action
if (!isValidState(resource)) {
  throw ActionError.badRequest(
    "INVALID_STATE",
    "Resource is in invalid state",
  );
}

// Use Case
if (!this.isValidInput(input)) {
  return Result.fail(
    HttpError.badRequest("INVALID_INPUT", "Input validation failed"),
  );
}
```

---

## Error Code Conventions

Use consistent error codes across the application.

### Format

- Uppercase snake_case: `EMAIL_EXISTS`, `INVALID_INPUT`
- Descriptive and specific
- Consistent across similar errors

### Common Error Codes

| Code               | Usage                              |
| ------------------ | ---------------------------------- |
| `NOT_FOUND`        | Generic not found                  |
| `UNAUTHORIZED`     | Not authenticated                  |
| `FORBIDDEN`        | Not authorized                     |
| `EMAIL_EXISTS`     | Duplicate email                    |
| `USERNAME_EXISTS`  | Duplicate username                 |
| `INVALID_INPUT`    | Invalid request data               |
| `INVALID_STATE`    | Invalid resource state             |
| `INVALID_TOKEN`    | Invalid auth/reset token           |
| `EXPIRED_TOKEN`    | Expired token                      |
| `INVALID_CREDENTIALS` | Wrong email/password            |
| `VALIDATION_ERROR` | Zod validation failed              |

---

## Best Practices

### 1. Use Appropriate Error Type for Layer

```typescript
// ❌ Don't use ZodRouteError in use cases
export class MyUseCase {
  async execute() {
    throw ZodRouteError.notFound("User"); // WRONG!
  }
}

// ✅ Use HttpError in use cases
export class MyUseCase {
  async execute() {
    return Result.fail(HttpError.notFound("User")); // CORRECT
  }
}

// ❌ Don't use HttpError in API routes
export const GET = route.handler(async () => {
  throw HttpError.notFound("User"); // WRONG!
});

// ✅ Use ZodRouteError in API routes
export const GET = route.handler(async () => {
  throw ZodRouteError.notFound("User"); // CORRECT
});
```

### 2. Always Use Result Pattern in Use Cases

```typescript
// ❌ Don't throw directly in use cases
export class MyUseCase {
  async execute() {
    throw new Error("Something went wrong"); // WRONG!
  }
}

// ✅ Return Result
export class MyUseCase {
  async execute(): Promise<Result<void>> {
    try {
      // logic
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
```

### 3. Provide Meaningful Error Messages

```typescript
// ❌ Generic messages
throw ActionError.notFound("Resource");
throw ActionError.badRequest("INVALID", "Invalid");

// ✅ Specific messages
throw ActionError.notFound("User");
throw ActionError.badRequest("INVALID_EMAIL", "Email format is invalid");
```

### 4. Handle Result in Controllers

```typescript
// ❌ Don't ignore failures
const result = await useCase.execute(input);
return result.value; // WRONG - could be undefined if failed!

// ✅ Check and throw
const result = await useCase.execute(input);
if (result.isFailure) {
  throw result.error;
}
return result.value;
```

### 5. Create Feature-Specific Errors When Needed

```typescript
// For complex domain rules, create custom errors
export class InsufficientBalanceError extends DomainError {
  constructor(required: number, available: number) {
    super(`Insufficient balance: required ${required}, available ${available}`);
    this.name = "InsufficientBalanceError";
  }
}

// Use in domain logic
if (account.balance < amount) {
  return Result.fail(new InsufficientBalanceError(amount, account.balance));
}
```

---

## Client-Side Error Handling

### Server Actions

```typescript
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";

const result = await updateUserAction(data);

if (isActionSuccessful(result)) {
  toast.success("Updated successfully!");
} else {
  const errorMessage = getActionErrorMessage(result);
  toast.error(errorMessage);
}
```

### API Routes

```typescript
const response = await fetch("/api/users");
const data = await response.json();

if (response.ok) {
  console.log(data.data);
} else {
  console.error(data.error.message);
  toast.error(data.error.message);
}
```

---

## Testing Errors

```typescript
import { describe, expect, it } from "vitest";
import { HttpError } from "@/shared/domain/errors";

describe("UpdateUserProfileUseCase", () => {
  it("should fail when user not found", async () => {
    const mockRepository = {
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const useCase = new UpdateUserProfileUseCase(mockRepository);
    const result = await useCase.execute({ userId: "invalid", name: "John" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(HttpError);
  });
});
```
