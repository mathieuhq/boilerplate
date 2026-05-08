---
name: api-patterns
description: TanStack Start server routes, server functions, HTTP responses, and route wrappers. Use when adding or changing API endpoints, createServerFn mutations, response helpers, request schemas, authRoute/adminRoute handlers, or data mutations.
---

# API Patterns

## Workflow

- Use TanStack server routes in `src/app/api/**` for raw HTTP endpoints.
- Use `createServerFn` in `src/server-functions/**` for POST, PUT, PATCH,
  DELETE, form submissions, and other typed mutations.
- Wrap protected server route handlers with `authRoute` or `adminRoute`.
- Protect server functions with `requireSession`, `requireAdmin`, or the
  existing action-user helpers.
- Return project response helpers: `ApiResponse` for routes and `ActionResponse` for server functions.
- Keep validation schemas near the interface layer and hand business work to controllers/use cases.

## Resources

- Read [references/reference.md](references/reference.md) for HTTP codes, response helpers, client utilities, and wrappers.
- Read [references/examples.md](references/examples.md) for concrete route, server function, and client usage examples.

## Boundaries

- Use `$clean-architecture` when a change requires entities, repositories, use cases, controllers, or DI updates.
- Use `$error-handling` when choosing error classes or mapping failures.
