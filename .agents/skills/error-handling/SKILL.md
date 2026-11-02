---
name: error-handling
description: Error handling, Result failures, ApplicationError, DomainError, HttpError, classifyError, and feature error mappers. Use when throwing, returning, mapping, or testing errors in domain, application, route, action, MCP tool, or controller code.
---

# Error Handling

## Workflow

- Return `Result<T>` from use cases for expected business failures.
- Throw `HttpError` (`@/shared/domain/errors/http.error`) wherever a failure needs a client-facing code: server routes, server functions, MCP tools, auth guards and feature error mappers. It is the only error class with a code and status.
- Give each feature an `interface/errors/*-action-error.mapper.ts` that turns its `ApplicationError`/`DomainError` subclasses into `HttpError` and returns anything else unchanged; call it before the response builder (`actionErrorResponse(toAdminActionError(error))`, `throw toDataExportHttpError(error)` in a route, `mapError` on an MCP tool).
- Let `classifyError` (`@/shared/infrastructure/http/error-classifier`) decide the response: `actionErrorResponse` and the `authRoute`/`accessRoute` wrappers both call it, so an error keeps the same code and message in routes, server functions and MCP tools.
- Keep error codes stable, uppercase, and specific enough for clients and tests.

## Resources

- Read [references/reference.md](references/reference.md) for `HttpError` factories, the classification table, the Result API, and feature-specific errors.
- Read [references/examples.md](references/examples.md) for route, action, mapper, use case, and controller examples.

## Boundaries

- Use `$api-patterns` when choosing route/server function response helpers.
- Use `$clean-architecture` when deciding which layer owns a failure.
- Use `$testing` when adding error assertions.
