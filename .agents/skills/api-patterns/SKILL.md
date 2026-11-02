---
name: api-patterns
description: TanStack Start server routes, server functions, HTTP responses, and route wrappers. Use when adding or changing API endpoints, createServerFn mutations, response helpers, request schemas, authRoute/accessRoute handlers, getRequiredActionUser/getRequiredActionAccess checks, CSV export routes, MCP tools, or data mutations.
---

# API Patterns

## Workflow

- Use TanStack server routes in `src/app/api/**` for raw HTTP endpoints.
- Use `createServerFn` in `src/server-functions/**` for POST, PUT, PATCH,
  DELETE, form submissions, and other typed mutations.
- Wrap protected server route handlers with `authRoute` or
  `accessRoute(feature, level)` from `lib/zod-route.ts`.
- Write mutation handlers as `userAction(run, mapError)` or
  `accessAction(feature, level, run, mapError)` from
  `lib/actions/safe-actions.ts`: they authorize, run the controller call and
  turn any thrown error, after the feature's `mapError`, into an
  `ActionResponse`. Loaders that throw call `getRequiredActionUser()` or
  `getRequiredActionAccess(feature, level)` directly. Features and levels come
  from `ACCESS_FEATURES` (`src/shared/domain/access-control.ts`), and `write`
  includes `read`.
- Protect pages in `beforeLoad` with `requireSession` (it returns `access`) and
  `assertAccess(context.access, feature, level)` from `lib/access.ts`.
- Return project response helpers: `ApiResponse` for routes and `ActionResponse` for server functions.
- Pass the feature's action error mapper (`toAdminActionError`, ...) as the
  runner's `mapError` instead of catching errors by hand.
- Keep validation schemas near the interface layer and hand business work to controllers/use cases.
- Export filtered lists as CSV with a `GET` route under `src/app/api/admin/*/export.ts`
  that uses `parseListQueryRequest`, an audited export use case,
  `createCsvStream` and `csvResponse`.
- Expose an API to MCP clients with `defineMcpTool` in `src/mcp/tools/*.tools.ts`
  and list it in `mcpTools` (`src/mcp/server.ts`). Tools run as the OAuth user,
  call controllers, set `mapError`, give admin tools an `admin_` prefix and
  `access: { feature, level }`, and use JSON-friendly inputs (ISO strings, not `Date`).

## Resources

- Read [references/reference.md](references/reference.md) for HTTP codes, response helpers, client utilities, and wrappers.
- Read [references/examples.md](references/examples.md) for concrete route, server function, CSV export, MCP tool, and client usage examples.

## Boundaries

- Use `$clean-architecture` when a change requires entities, repositories, use cases, controllers, or DI updates.
- Use `$error-handling` when choosing error classes or mapping failures.
