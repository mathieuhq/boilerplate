# Error Handling Reference

## HttpError Methods

```typescript
import { HttpError } from "@/shared/domain/errors/http.error";

HttpError.badRequest("CODE", "message", details);
HttpError.unauthorized("message");
HttpError.forbidden("message");
HttpError.notFound("Resource"); // Generates code: RESOURCE_NOT_FOUND
HttpError.conflict("CODE", "message");
HttpError.validationError("message", details);
HttpError.internalError("message");
new HttpError("CODE", "message", HttpStatus.TOO_MANY_REQUESTS, details);
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

## Error Classification

`classifyError(error)` returns `{ code, message, status, details }`. `ApiResponse.error` uses all four fields, `ActionResponse.error` and MCP tool errors drop `status`.

| Thrown error                        | Code                | Message                                          | Status     |
| ----------------------------------- | ------------------- | ------------------------------------------------ | ---------- |
| `HttpError`                         | its code            | its message                                      | its status |
| `DomainError`                       | `VALIDATION_ERROR`  | its message                                      | 422        |
| other `ApplicationError` (unmapped) | `APPLICATION_ERROR` | `Request failed` in production, else its message | 400        |
| anything else                       | `INTERNAL_ERROR`    | its message in development, else generic         | 500        |

An unmapped feature error such as `AdminOperationError` lands on the `APPLICATION_ERROR` row, so a code the client must see belongs in the feature mapper.

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
