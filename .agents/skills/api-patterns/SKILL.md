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
- Turn a caught server function error into a response with `actionErrorResponse` (after the feature error mapper); route wrappers already do this. Both go through `classifyError`, so a thrown `HttpError` keeps its code everywhere.
- Keep validation schemas near the interface layer and hand business work to controllers/use cases.
- Expose an API to MCP clients with `defineMcpTool` in `src/mcp/tools/*.tools.ts`
  and list it in `mcpTools` (`src/mcp/server.ts`). Tools run as the OAuth user,
  call controllers, mark admin tools `adminOnly` with an `admin_` prefix and use
  JSON-friendly inputs (ISO strings, not `Date`).

## Resources

- Read [references/reference.md](references/reference.md) for HTTP codes, response helpers, client utilities, and wrappers.
- Read [references/examples.md](references/examples.md) for concrete route, server function, MCP tool, and client usage examples.

## Boundaries

- Use `$clean-architecture` when a change requires entities, repositories, use cases, controllers, or DI updates.
- Use `$error-handling` when choosing error classes or mapping failures.
