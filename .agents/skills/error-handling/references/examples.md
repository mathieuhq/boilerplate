# Error Handling Examples

## HttpError Implementation

From `src/shared/domain/errors/http.error.ts`:

```typescript
import type { HttpStatusCode } from "@/shared/infrastructure/http/http-status";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

import { ApplicationError } from "./application.error";

export class HttpError extends ApplicationError {
  readonly status: HttpStatusCode;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    status: HttpStatusCode = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static forbidden(message = "Access denied") {
    return new HttpError("FORBIDDEN", message, HttpStatus.FORBIDDEN);
  }

  static notFound(resource = "Resource", message?: string) {
    return new HttpError(
      `${resource.toUpperCase().replace(/\s+/g, "_")}_NOT_FOUND`,
      message ?? `${resource} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}
```

`badRequest`, `unauthorized`, `conflict`, `validationError` and
`internalError` follow the same shape. `HttpError` is the only error class with
a client-facing code, in routes, server functions and MCP tools alike.

## Domain-Specific Error

From `src/features/user/domain/errors/user-not-found.error.ts`:

```typescript
import { DomainError } from "@/shared/domain/errors/domain.error";

export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = "UserNotFoundError";
  }
}
```

## Feature Error Mapper

From `src/features/auth/interface/errors/session-action-error.mapper.ts`:

```typescript
import { HttpError } from "@/shared/domain/errors/http.error";

import { SessionOperationError } from "../../application/errors/session-operation.error";

export function toSessionActionError(error: unknown): unknown {
  if (!(error instanceof SessionOperationError)) return error;

  if (error.code === "SESSION_REQUIRED") return HttpError.unauthorized();

  if (error.code === "SESSION_NOT_FOUND")
    return HttpError.notFound("Session", error.message);

  if (error.code === "SESSION_IMPERSONATION_FORBIDDEN")
    return HttpError.forbidden(error.message);

  return HttpError.badRequest(error.code, error.message);
}
```

## Using Errors In An API Route

Condensed from `src/app/api/v1/private/user/export/$exportId.ts` and
`src/features/user/interface/errors/data-export-error.mapper.ts`:

```typescript
import { toDataExportHttpError } from "@/features/user/interface/errors/data-export-error.mapper";
import { authRoute } from "@/lib/zod-route";

authRoute.handler(async ({ ctx }) => {
  try {
    const { downloadUrl } = await container
      .getDataExportController()
      .getDownloadUrl(ctx.user.id, params.exportId);

    return new Response(null, {
      status: 302,
      headers: { Location: downloadUrl, "Cache-Control": "no-store" },
    });
  } catch (error) {
    throw toDataExportHttpError(error);
  }
});

export function toDataExportHttpError(error: unknown): unknown {
  if (error instanceof DataExportNotFoundError)
    return HttpError.notFound("Data export");

  if (error instanceof DataExportExpiredError)
    return new HttpError(
      "DATA_EXPORT_EXPIRED",
      "This data export has expired",
      HttpStatus.GONE,
    );

  return error;
}
```

Throw `HttpError` directly for route-only failures, for example
`throw HttpError.badRequest("MISSING_PATH", "Missing file path")`.

## Using Errors In A Server Function

From `src/server-functions/session.functions.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";

import { toSessionActionError } from "@/features/auth/interface/errors/session-action-error.mapper";
import { userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";

const revokeUserSessionServerFn = createServerFn({ method: "POST" })
  .validator(revokeUserSessionSchema)
  .handler(({ data }) =>
    userAction(
      () => container.getSessionController().revokeSession(data),
      toSessionActionError,
    ),
  );
```

Gated functions call `getRequiredActionAccess(feature, level)` instead, which
throws `HttpError.forbidden` when the role lacks access. MCP tools pass the
same mapper as `mapError`.

## Result Pattern in Use Case

From `src/features/user/application/use-cases/update-user-profile.use-case.ts`:

```typescript
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";

export class UpdateUserProfileUseCase implements IUseCase<
  UpdateUserProfileDTO,
  UserResponseDTO
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserProfileDTO): Promise<Result<UserResponseDTO>> {
    const userId = UserId.create(input.userId);

    const user = await this.userRepository.findById(userId);

    if (!user) return Result.fail(new UserNotFoundError(input.userId));

    user.updateProfile({
      name: input.name,
      image: input.image,
      language: input.language,
      birthDate: input.birthDate,
    });

    const savedUser = await this.userRepository.save(user);

    return Result.ok(toUserResponseDTO(savedUser));
  }
}
```

## Controller Handling Result

```typescript
export class DataExportController {
  async requestExport(userId: string) {
    const result = await this.requestDataExportUseCase.execute({ userId });

    return result.unwrap();
  }
}
```

`unwrap()` throws the failure's error, which reaches the route, action or MCP
boundary, where the feature mapper and `actionErrorResponse` turn it into a
client response.

## Creating Custom Errors

```typescript
import { DomainError } from "@/shared/domain/errors/domain.error";

export class PaymentFailedError extends DomainError {
  constructor(
    readonly transactionId: string,
    readonly reason: string,
  ) {
    super(`Payment failed for transaction ${transactionId}: ${reason}`);
    this.name = "PaymentFailedError";
  }
}
```

```typescript
import { ApplicationError } from "@/shared/domain/errors/application.error";

export type PaymentOperationErrorCode =
  | "PAYMENT_DECLINED"
  | "PAYMENT_NOT_FOUND";

export class PaymentOperationError extends ApplicationError {
  constructor(
    readonly code: PaymentOperationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PaymentOperationError";
  }
}
```

`DomainError` and `ApplicationError` take only a message. Put codes on an
application error and translate them in a `to<Feature>ActionError` mapper.
