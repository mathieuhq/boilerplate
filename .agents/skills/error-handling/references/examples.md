# Error Handling Examples

## HttpError Implementation

From `src/shared/domain/errors/http.error.ts`:

```typescript
import { ApplicationError } from "./application.error";

export class HttpError extends ApplicationError {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(code, message);
  }

  static badRequest(code: string, message: string): HttpError {
    return new HttpError(code, message, 400);
  }

  static unauthorized(message: string): HttpError {
    return new HttpError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message: string): HttpError {
    return new HttpError("FORBIDDEN", message, 403);
  }

  static notFound(resource: string): HttpError {
    const code = `${resource.toUpperCase().replace(/ /g, "_")}_NOT_FOUND`;
    return new HttpError(code, `${resource} not found`, 404);
  }

  static conflict(code: string, message: string): HttpError {
    return new HttpError(code, message, 409);
  }

  static validationError(message: string, details?: unknown): HttpError {
    return new HttpError("VALIDATION_ERROR", message, 422, details);
  }

  static internalError(message: string): HttpError {
    return new HttpError("INTERNAL_ERROR", message, 500);
  }
}
```

## Domain-Specific Error

From `src/features/user/domain/errors/user-not-found.error.ts`:

```typescript
import { DomainError } from "@/shared/domain/errors";

export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super("USER_NOT_FOUND", `User not found: ${identifier}`);
  }
}
```

## Using Errors in API Route

```typescript
import { ZodRouteError } from "@/lib/errors";
import { adminRoute } from "@/lib/zod-route";

export const GET = adminRoute.query(schema).handler(async (_req, { query }) => {
  const controller = container.getAdminController();

  try {
    const result = await controller.getUser(query.id);
    return ApiResponse.success(result);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw ZodRouteError.notFound("User");
    }
    throw ZodRouteError.internalError("Failed to fetch user");
  }
});
```

## Using Errors In A Server Function

```typescript
import { createServerFn } from "@tanstack/react-start";

import { ActionError } from "@/lib/errors";
import { requireAdmin } from "@/server-functions/auth.functions";
import { ActionResponse } from "@/shared/infrastructure/http/api-response";

const deleteUserServerFn = createServerFn({ method: "POST" })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    await requireAdmin();

    const controller = container.getAdminController();

    try {
      await controller.deleteUser(data.userId);
      return ActionResponse.success({ deleted: true });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw ActionError.notFound("User");
      }
      throw error;
    }
  });
```

## Result Pattern in Use Case

```typescript
import { Result } from "@/shared/domain/result";
import { ApplicationError } from "@/shared/domain/errors";
import { UserNotFoundError } from "../../domain/errors/user-not-found.error";

export class UpdateUserProfileUseCase implements IUseCase<Input, Output> {
  async execute(input: Input): Promise<Result<UserResponseDTO>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail(new UserNotFoundError(input.userId));
    }

    if (input.email) {
      const emailTaken = await this.userRepository.isEmailTaken(email, userId);
      if (emailTaken) {
        return Result.fail(
          new ApplicationError("EMAIL_TAKEN", "Email already in use"),
        );
      }
    }

    user.updateProfile(input);
    await this.userRepository.save(user);

    return Result.ok(toUserResponseDTO(user));
  }
}
```

## Controller Handling Result

```typescript
export class UserController {
  async updateUserProfile(userId: string, input: UpdateProfileInput) {
    const result = await this.updateUserProfileUseCase.execute({
      userId,
      ...input,
    });

    if (result.isFailure) {
      throw result.error; // Error propagates to action/route layer
    }

    return result.value;
  }
}
```

## Creating Custom Domain Error

```typescript
// src/features/payment/domain/errors/payment-failed.error.ts
import { DomainError } from "@/shared/domain/errors";

export class PaymentFailedError extends DomainError {
  constructor(
    public readonly transactionId: string,
    public readonly reason: string,
  ) {
    super(
      "PAYMENT_FAILED",
      `Payment failed for transaction ${transactionId}: ${reason}`,
    );
  }
}
```
