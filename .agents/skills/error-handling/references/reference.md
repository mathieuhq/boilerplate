# Error Handling Reference

## ZodRouteError Methods (API Routes)

```typescript
import { ZodRouteError } from "@/lib/errors";

ZodRouteError.badRequest("CODE", "message"); // 400
ZodRouteError.unauthorized("message"); // 401
ZodRouteError.forbidden("message"); // 403
ZodRouteError.notFound("Resource"); // 404
ZodRouteError.conflict("CODE", "message"); // 409
ZodRouteError.validationError("message", details); // 422
ZodRouteError.internalError("message"); // 500
```

## ActionError Methods (Server Actions)

```typescript
import { ActionError } from "@/lib/errors";

ActionError.badRequest("CODE", "message");
ActionError.unauthorized("message");
ActionError.forbidden("message");
ActionError.notFound("Resource");
ActionError.conflict("CODE", "message");
ActionError.validationError("message", details);
ActionError.internalError("message");
```

## HttpError Methods (Domain/Application)

```typescript
import { HttpError } from "@/shared/domain/errors";

HttpError.badRequest("CODE", "message");
HttpError.unauthorized("message");
HttpError.forbidden("message");
HttpError.notFound("Resource"); // Generates code: RESOURCE_NOT_FOUND
HttpError.conflict("CODE", "message");
HttpError.validationError("message", details);
HttpError.internalError("message");
```

## Error Status Codes

| Method            | Status Code | Use Case                        |
| ----------------- | ----------- | ------------------------------- |
| `badRequest`      | 400         | Invalid input format            |
| `unauthorized`    | 401         | Missing or invalid session      |
| `forbidden`       | 403         | Insufficient permissions        |
| `notFound`        | 404         | Resource doesn't exist          |
| `conflict`        | 409         | Duplicate resource (email, etc) |
| `validationError` | 422         | Schema validation failed        |
| `internalError`   | 500         | Unexpected server error         |

## Result Pattern API

```typescript
import { Result } from "@/shared/domain/result";

// Creating results
Result.ok(value); // Success result
Result.fail(error); // Failure result

// Checking results
result.isSuccess; // boolean
result.isFailure; // boolean
result.value; // T (if success)
result.error; // Error (if failure)
```

## Feature-Specific Errors

| Error                  | Domain  | Use Case                 |
| ---------------------- | ------- | ------------------------ |
| `UserNotFoundError`    | user    | User lookup failed       |
| `ForbiddenActionError` | admin   | Admin action not allowed |
| `FileTooLargeError`    | storage | File exceeds size limit  |
| `InvalidFileTypeError` | storage | File type not supported  |
