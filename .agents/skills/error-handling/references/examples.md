# Error Handling Examples

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

## Feature Error Mapper

From `src/features/admin/interface/errors/admin-action-error.mapper.ts`:

```typescript
import { HttpError } from "@/shared/domain/errors/http.error";

import { AdminOperationError } from "../../application/errors/admin-operation.error";

export function toAdminActionError(error: unknown): unknown {
  if (error instanceof AdminOperationError) {
    if (error.code === "ADMIN_USER_NOT_FOUND")
      return HttpError.notFound("User", "User not found");

    if (FORBIDDEN_CODES.has(error.code))
      return HttpError.forbidden(error.message);

    if (CONFLICT_CODES.has(error.code))
      return HttpError.conflict(error.code, error.message);

    return HttpError.badRequest(error.code, error.message);
  }

  return error;
}
```

## Using Errors In A Server Route

From `src/app/api/user/data-exports/$exportId.ts`. The route wrapper turns the thrown error into an `ApiResponse` through `classifyError`:

```typescript
GET: async ({ request, params }) =>
  authRoute.handler(async ({ ctx }) => {
    try {
      const { downloadUrl } = await container
        .getDataExportController()
        .getDownloadUrl(ctx.user.id, params.exportId);

      return new Response(null, {
        status: 302,
        headers: { Location: downloadUrl },
      });
    } catch (error) {
      throw toDataExportHttpError(error);
    }
  })({ request }),
```

## Using Errors In A Server Function

From `src/server-functions/admin.functions.ts`:

```typescript
function adminActionErrorResponse(error: unknown) {
  return actionErrorResponse(toAdminActionError(error));
}

const deleteAdminRoleServerFn = createServerFn({ method: "POST" })
  .validator(deleteAdminRoleSchema)
  .handler(async ({ data }) => {
    try {
      const actor = await getRequiredActionAccess("roles", "write");
      const result = await container.getAdminController().deleteRole({
        ...data,
        actorUserId: actor.user.id,
        actorAccess: actor.access,
      });

      return ActionResponse.success(result);
    } catch (error) {
      return adminActionErrorResponse(error);
    }
  });
```

## Result Pattern in Use Case

```typescript
import { ApplicationError } from "@/shared/domain/errors";
import { Result } from "@/shared/domain/result";

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
