---
name: api-patterns
description: TanStack Start server routes, server functions, HTTP responses, and route wrappers. Use when choosing between a server function and a server route, adding or changing API endpoints, createServerFn mutations, response helpers, request schemas, authRoute/accessRoute handlers, getRequiredActionUser/getRequiredActionAccess checks, publicRoute API key routes, CSV export routes, MCP tools, or data mutations.
---

# API Patterns

## Server Function or Server Route

Ask who calls the endpoint and what it reads back. If a React component calls
it and reads JSON, it is a server function. Anything else is a server route.

| Caller and response                                       | Use                                       | Example                                 |
| --------------------------------------------------------- | ----------------------------------------- | --------------------------------------- |
| Page loader reading data                                  | Server function, `method: "GET"`          | `getAdminOverviewServerFn`              |
| Form, button or table action changing data                | Server function, `method: "POST"`         | `createApiKeyAction`                    |
| Script or integration with an API key                     | Route in `api/v1/public`, `publicRoute`   | `/api/v1/public/me`                     |
| MCP client                                                | `api/v1/public/mcp` and a `defineMcpTool` | `admin_get_overview`                    |
| Monitoring probe                                          | Route in `api/v1/public`, no auth         | `/api/v1/public/health`                 |
| Third party protocol (Better Auth, OAuth, Stripe webhook) | Better Auth under `api/v1/private/auth`   | `/api/v1/private/auth/stripe/webhook`   |
| Browser download (`<a href>`, CSV, file)                  | Route in `api/v1/private`, `accessRoute`  | `/api/v1/private/admin/users/export`    |
| Redirect opened from an email or a notification           | Route in `api/v1/private`, `authRoute`    | `/api/v1/private/user/export/$exportId` |
| Long-lived stream (`EventSource`)                         | Route in `api/v1/private`, `authRoute`    | `/api/v1/private/notifications/stream`  |

Rules:

- `src/app/api/v1/public/**` is for callers outside the app: an API key, an MCP
  token or nothing. `src/app/api/v1/private/**` is for the app's own browser
  requests and Better Auth.
- Never add a server route that a component reads with `fetch` and parses as
  JSON. Write a server function and call it from the loader or a mutation.
- Never add a server route "in case" an integration needs it. Add the public
  route when the integration exists, calling the same controller as the server
  function or the MCP tool.
- A route is `GET` unless a third party protocol requires another method.
- Rate limiting covers only `/api/v1/*` and `POST` server functions
  (`src/shared/infrastructure/rate-limit/rate-limit-scope.ts`). A new
  unlimited prefix goes in `UNLIMITED_API_PREFIXES` with its test case.

## Workflow

- Wrap public routes with `publicRoute` from `lib/zod-route.ts`: it
  authenticates the `x-api-key` header and gives `ctx.user` and `ctx.keyId`.
- Use `createServerFn` in `src/server-functions/**` for loaders, form
  submissions and mutations.
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
- Export filtered lists as CSV with a `GET` route under `src/app/api/v1/private/admin/*/export.ts`
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
