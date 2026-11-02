# API Patterns Reference

## HTTP Status Codes

Use the `HttpStatus` constants from `@/shared/infrastructure/http/http-status`.

| Code | Usage               |
| ---- | ------------------- |
| 200  | OK                  |
| 201  | Created             |
| 204  | No Content          |
| 400  | Bad Request         |
| 401  | Unauthorized        |
| 403  | Forbidden           |
| 404  | Not Found           |
| 409  | Conflict            |
| 410  | Gone                |
| 422  | Validation Error    |
| 429  | Too Many Requests   |
| 500  | Internal Error      |
| 503  | Service Unavailable |

## Response Helpers

### Server Routes

```typescript
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

ApiResponse.success(data);
ApiResponse.created(data);
ApiResponse.noContent();
ApiResponse.paginated(data, { total, page, limit });
ApiResponse.badRequest("CODE", "message", details);
ApiResponse.notFound("Resource");
ApiResponse.forbidden("message");
ApiResponse.tooManyRequests("message", headers);
```

TanStack server route handlers return Web `Response` objects. Use
`Response.json(...)`, `Response.redirect(...)`, or `new Response(...)` when a
project helper does not fit.

### Server Functions

```typescript
import { ActionResponse } from "@/shared/infrastructure/http/api-response";

ActionResponse.success(data);
ActionResponse.error("CODE", "message", details);
```

Server functions live in `src/server-functions/**` and are created with
`createServerFn({ method: "POST" })` for mutations. Each file exports a typed
`*Action` wrapper that casts the result to `ActionResponse<T>`.

### CSV Export

```typescript
import { iterateListPages } from "@/shared/application/list-pages";
import { createCsvStream, csvResponse } from "@/shared/infrastructure/csv/csv";
import { parseListQueryRequest } from "@/shared/infrastructure/http/list-query-request";
```

| Helper                                     | Purpose                                                      |
| ------------------------------------------ | ------------------------------------------------------------ |
| `parseListQueryRequest(request, schema)`   | Parses the URL search params with the list query schema      |
| `iterateListPages(fetchPage, { maxRows })` | Yields every filtered page as batches, in the use case       |
| `createCsvStream(columns, batches)`        | Streams a BOM-prefixed CSV from `CsvColumn<T>[]` and batches |
| `csvResponse(body, name)`                  | Attachment `Response` named `name-YYYY-MM-DD.csv`, no-store  |
| `escapeCsvValue(value)`                    | Escapes a value and neutralizes spreadsheet formulas         |

## Client-Side Utilities

```typescript
import { unwrapActionData } from "@/lib/actions/actions-utils";

const data = unwrapActionData(await updateUserAction(values));
```

`unwrapActionData` returns `data` on success and throws an `Error` with the
action error message otherwise, so it fits `useMutation` and `onError` toasts.

## Route And Auth Helpers

| Helper                                    | Purpose                                        | Location                              |
| ----------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| `authRoute`                               | Authenticated server routes, `ctx.user`        | `lib/zod-route`                       |
| `accessRoute(feature, level)`             | Server routes gated by feature access          | `lib/zod-route`                       |
| `getRequiredActionUser()`                 | Authenticated server function, returns user    | `lib/actions/safe-actions`            |
| `getRequiredActionAccess(feature, level)` | Gated server function, returns user and access | `lib/actions/safe-actions`            |
| `requireSession`                          | `beforeLoad` session with `user` and `access`  | `src/server-functions/auth.functions` |
| `assertAccess(access, feature, level)`    | `beforeLoad` access check, throws 403          | `lib/access`                          |
| `ADMIN_PAGES`                             | Admin pages and their feature                  | `lib/admin-access`                    |
| `useAccess().can(feature, level)`         | Access check in components                     | `hooks/use-access`                    |

Route wrappers and `actionErrorResponse` both go through `classifyError`: an
`HttpError` keeps its code (and its status in routes), `DomainError` becomes
422 and other errors a 400 or 500 response.

## TanStack Route Shape

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/example")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        return Response.json({ ok: true });
      },
    },
  },
});
```

Wrapped handlers only receive `request` (and `ctx`); read `params` from the
outer handler and call the wrapper inside it when a route needs both.
