---
name: error-handling
description: Error handling, Result failures, ApplicationError, DomainError, HttpError, ZodRouteError, and ActionError patterns. Use when throwing, returning, mapping, or testing errors in domain, application, route, action, or controller code.
---

# Error Handling

## Workflow

- Return `Result<T>` from use cases for expected business failures.
- Throw `ZodRouteError` in server route handlers and `ActionError` in server functions.
- Use `HttpError` or feature-specific domain errors for domain/application failures that need structured handling.
- Map errors at controller, route, or action boundaries; do not leak persistence or provider errors directly to clients.
- Keep error codes stable, uppercase, and specific enough for clients and tests.

## Resources

- Read [references/reference.md](references/reference.md) for error methods, status codes, Result API, and feature-specific error guidance.
- Read [references/examples.md](references/examples.md) for route, action, use case, controller, and custom domain error examples.

## Boundaries

- Use `$api-patterns` when choosing route/server function response helpers.
- Use `$clean-architecture` when deciding which layer owns a failure.
- Use `$testing` when adding error assertions.
