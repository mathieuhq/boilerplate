# Error Handling Reference

## ZodRouteError Methods (API Routes)

```typescript
import { ZodRouteError } from "@/lib/errors/zod-route-error";

ZodRouteError.badRequest("CODE", "message", details);
ZodRouteError.unauthorized("message");
ZodRouteError.forbidden("message");
ZodRouteError.notFound("Resource", "message");
ZodRouteError.conflict("CODE", "message");
ZodRouteError.validationError("message", details);
ZodRouteError.internalError("message");
```

## ActionError Methods (Server Functions)

```typescript
import { ActionError } from "@/lib/errors/action-error";

ActionError.badRequest("CODE", "message", details);
ActionError.unauthorized("message");
ActionError.forbidden("message");
ActionError.notFound("Resource", "message");
ActionError.conflict("CODE", "message");
ActionError.validationError("message", details);
new ActionError("CODE", "message", details);
```

`ActionError` carries a code and details but no status, and has no
`internalError`; unknown errors become `INTERNAL_ERROR` in `actionErrorResponse`.

## HttpError Methods (Domain/Application)

```typescript
import { HttpError } from "@/shared/domain/errors/http.error";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

HttpError.badRequest("CODE", "message", details);
HttpError.unauthorized("message");
HttpError.forbidden("message");
HttpError.notFound("Data export");
HttpError.conflict("CODE", "message");
HttpError.validationError("message", details);
HttpError.internalError("message");
new HttpError("CODE", "message", HttpStatus.GONE);
```

`notFound(resource)` builds the code from the resource name, for example
`DATA_EXPORT_NOT_FOUND`. `unauthorized`, `forbidden`, `notFound` and
`internalError` have default messages.

## Error Status Codes

| Method            | Status Code | Use Case                        |
| ----------------- | ----------- | ------------------------------- |
| `badRequest`      | 400         | Invalid input format            |
| `unauthorized`    | 401         | Missing or invalid session      |
| `forbidden`       | 403         | Missing feature access          |
| `notFound`        | 404         | Resource doesn't exist          |
| `conflict`        | 409         | Duplicate resource (email, etc) |
| `validationError` | 422         | Schema validation failed        |
| `internalError`   | 500         | Unexpected server error         |

## Boundary Conversion

`actionErrorResponse` (`src/server-functions/action-errors.server.ts`) and the
route wrappers in `lib/zod-route.ts` convert thrown errors the same way:

| Thrown error                 | Response                                           |
| ---------------------------- | -------------------------------------------------- |
| `ActionError`                | Its code, message and details                      |
| `ZodRouteError`, `HttpError` | Its code, message, details and status              |
| `DomainError`                | `VALIDATION_ERROR` (422 in routes)                 |
| `ApplicationError`           | `APPLICATION_ERROR`, generic message in production |
| Anything else                | `INTERNAL_ERROR`, message only in development      |

`assertAccess` throws `HttpError.forbidden`, `accessRoute` throws
`ZodRouteError.forbidden` and `getRequiredActionAccess` throws
`ActionError.forbidden`, all with the `FORBIDDEN` code.

## Result Pattern API

```typescript
import { Result } from "@/shared/application/result";

Result.ok(value);
Result.fail(error);

result.isSuccess;
result.isFailure;
result.value;
result.error;
result.unwrap();
```

`value` throws on a failed result and `error` throws on a successful one.
`unwrap()` returns the value or throws the failure's own error; controllers use
it to hand a failed use case to the boundary.

## Feature-Specific Errors

| Error                           | Domain       | Use Case                                 |
| ------------------------------- | ------------ | ---------------------------------------- |
| `UserNotFoundError`             | user         | User lookup failed                       |
| `DataExportNotFoundError`       | user         | Export missing, not ready or not owned   |
| `DataExportExpiredError`        | user         | Export past its retention                |
| `DataExportRateLimitedError`    | user         | Export requested within the cooldown     |
| `AdminOperationError`           | admin        | Admin action refused, `ADMIN_*` code     |
| `SessionOperationError`         | auth         | Session action refused, `SESSION_*` code |
| `OrganizationOperationError`    | organization | Organization action refused, with a code |
| `OrganizationAccessDeniedError` | organization | Not an owner or admin                    |
| `FileTooLargeError`             | storage      | File exceeds size limit                  |
| `InvalidFileTypeError`          | storage      | File type not supported                  |
| `EmailDeliveryError`            | email        | Email provider failed                    |

## Error Mappers

| Mapper                      | Location                                                                         | Output        |
| --------------------------- | -------------------------------------------------------------------------------- | ------------- |
| `toAdminActionError`        | `src/features/admin/interface/errors/admin-action-error.mapper.ts`               | `ActionError` |
| `toSessionActionError`      | `src/features/auth/interface/errors/session-action-error.mapper.ts`              | `ActionError` |
| `toOrganizationActionError` | `src/features/organization/interface/errors/organization-action-error.mapper.ts` | `ActionError` |
| `toDataExportActionError`   | `src/features/user/interface/errors/data-export-error.mapper.ts`                 | `ActionError` |
| `toDataExportHttpError`     | `src/features/user/interface/errors/data-export-error.mapper.ts`                 | `HttpError`   |

Mappers take `unknown`, translate the feature's errors and return anything
else unchanged.
