---
name: error-handling
description: Error handling, Result failures, ApplicationError, DomainError, HttpError, ZodRouteError, ActionError, and feature error mappers. Use when throwing, returning, mapping, or testing errors in domain, application, route, action, MCP tool, or controller code.
---

# Error Handling

## Workflow

- Return `Result<T>` (`@/shared/application/result`) from use cases for expected business failures; controllers return `result.unwrap()`, which throws the failure's error.
- Throw `ZodRouteError` in server route handlers and `ActionError` in server functions.
- Use `HttpError` or feature-specific domain/application errors for failures that need structured handling.
- Map errors at controller, route, or action boundaries with the feature mapper in
  `interface/errors/*-error.mapper.ts`: `mapError` of `userAction`/`accessAction`
  in server functions, `mapError` in MCP tools, `throw toXHttpError(error)` in routes.
  Do not leak persistence or provider errors directly to clients.
- Keep error codes stable, uppercase, and specific enough for clients and tests.

## Resources

- Read [references/reference.md](references/reference.md) for error methods, status codes, Result API, feature errors and mappers.
- Read [references/examples.md](references/examples.md) for route, action, mapper, use case, controller, and custom domain error examples.

## Boundaries

- Use `$api-patterns` when choosing route/server function response helpers.
- Use `$clean-architecture` when deciding which layer owns a failure.
- Use `$testing` when adding error assertions.
