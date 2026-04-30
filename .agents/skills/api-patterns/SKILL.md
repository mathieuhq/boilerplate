---
name: api-patterns
description: Next.js API routes and Server Actions for reads, mutations, HTTP responses, and route/action wrappers. Use when adding or changing API endpoints, server actions, response helpers, request schemas, authRoute/adminRoute/authAction handlers, or data mutations.
---

# API Patterns

## Workflow

- Use API routes only for GET/read endpoints that benefit from Next.js caching.
- Use Server Actions for POST, PUT, PATCH, DELETE, form submissions, and other mutations.
- Wrap protected reads with `authRoute` or `adminRoute`; wrap protected mutations with `authAction`.
- Return project response helpers: `ApiResponse` for routes and `ActionResponse` for actions.
- Keep validation schemas near the interface layer and hand business work to controllers/use cases.

## Resources

- Read [references/reference.md](references/reference.md) for HTTP codes, response helpers, client utilities, and wrappers.
- Read [references/examples.md](references/examples.md) for concrete route, action, and client usage examples.

## Boundaries

- Use `$clean-architecture` when a change requires entities, repositories, use cases, controllers, or DI updates.
- Use `$error-handling` when choosing error classes or mapping failures.
