# Error Handling Reference

## HttpError Methods

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

`classifyError(error)` (`src/shared/infrastructure/http/error-classifier.ts`)
returns `{ code, message, status, details }`. The route wrappers in
`lib/zod-route.ts` build an `ApiResponse` from all four fields, while
`actionErrorResponse` (server functions) and MCP tool errors drop `status`:

| Thrown error                        | Code                | Message                                          | Status     |
| ----------------------------------- | ------------------- | ------------------------------------------------ | ---------- |
| `HttpError`                         | its code            | its message                                      | its status |
| `DomainError`                       | `VALIDATION_ERROR`  | its message                                      | 422        |
| other `ApplicationError` (unmapped) | `APPLICATION_ERROR` | `Request failed` in production, else its message | 400        |
| anything else                       | `INTERNAL_ERROR`    | its message in development, else generic         | 500        |

An unmapped feature error such as `AdminOperationError` lands on the
`APPLICATION_ERROR` row, so a code the client must see belongs in the feature
mapper. `assertAccess`, `accessRoute` and `getRequiredActionAccess` all throw
`HttpError.forbidden`.

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
