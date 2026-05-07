# API Patterns Reference

## HTTP Status Codes

| Code | Usage            |
| ---- | ---------------- |
| 200  | OK               |
| 201  | Created          |
| 204  | No Content       |
| 400  | Bad Request      |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 404  | Not Found        |
| 409  | Conflict         |
| 422  | Validation Error |
| 500  | Internal Error   |

## Response Helpers

### Server Routes

```typescript
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

ApiResponse.success(data);
ApiResponse.created(data);
ApiResponse.paginated(data, { total });
ApiResponse.notFound("Resource");
ApiResponse.forbidden("message");
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
`createServerFn({ method: "POST" })` for mutations.

## Client-Side Utilities

```typescript
import {
  isActionSuccessful,
  getActionErrorMessage,
} from "@/lib/actions/actions-utils";

if (isActionSuccessful(result)) {
  const data = result.data.data;
} else {
  toast.error(getActionErrorMessage(result));
}
```

## Route And Auth Helpers

| Helper           | Purpose                         | Location                      |
| ---------------- | ------------------------------- | ----------------------------- |
| `adminRoute`     | Admin-only server routes        | `lib/zod-route`               |
| `authRoute`      | Authenticated server routes     | `lib/zod-route`               |
| `requireSession` | Protected route/server function | `src/server-functions/auth.*` |
| `requireAdmin`   | Admin route/server function     | `src/server-functions/auth.*` |

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
