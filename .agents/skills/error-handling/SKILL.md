---
name: error-handling
description: Error handling, Result failures, ApplicationError, DomainError, HttpError, classifyError, and feature error mappers. Use when throwing, returning, mapping, or testing errors in domain, application, route, action, MCP tool, or controller code.
---

# Error Handling

## Workflow

- Return `Result<T>` (`@/shared/application/result`) from use cases for expected business failures; controllers return `result.unwrap()`, which throws the failure's error.
- Throw `HttpError` (`@/shared/domain/errors/http.error`) wherever a failure needs a client-facing code: server routes, server functions, MCP tools, auth guards and feature error mappers. It is the only error class with a code and status.
- Let `classifyError` (`@/shared/infrastructure/http/error-classifier`) decide the response: `actionErrorResponse` and the `authRoute`/`accessRoute` wrappers both call it, so an error keeps the same code and message in routes, server functions and MCP tools.
- Map errors at controller, route, or action boundaries with the feature mapper in
  `interface/errors/*-error.mapper.ts`: `mapError` of `userAction`/`accessAction`
  in server functions, `mapError` in MCP tools, `throw toXHttpError(error)` in routes.
  Do not leak persistence or provider errors directly to clients.
- Keep error codes stable, uppercase, and specific enough for clients and tests.

## Resources

- Read [references/reference.md](references/reference.md) for `HttpError` factories, status codes, the classification table, the Result API, feature errors and mappers.
- Read [references/examples.md](references/examples.md) for route, action, mapper, use case, controller, and custom domain error examples.

## Boundaries

- Use `$api-patterns` when choosing route/server function response helpers.
- Use `$clean-architecture` when deciding which layer owns a failure.
- Use `$testing` when adding error assertions.
