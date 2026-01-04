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

### API Routes

```typescript
import { ApiResponse } from "@/shared/infrastructure/http";

ApiResponse.success(data);
ApiResponse.created(data);
ApiResponse.paginated(data, { total });
ApiResponse.notFound("Resource");
ApiResponse.forbidden("message");
```

### Server Actions

```typescript
import { ActionResponse } from "@/shared/infrastructure/http";

ActionResponse.success(data);
ActionResponse.error("CODE", "message", details);
```

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

## Route Wrappers

| Wrapper      | Purpose                  | Location          |
| ------------ | ------------------------ | ----------------- |
| `adminRoute` | Admin-only GET endpoints | `lib/zod-route`   |
| `authRoute`  | Authenticated GET routes | `lib/zod-route`   |
| `authAction` | Authenticated mutations  | `lib/safe-action` |
| `action`     | Public mutations         | `lib/safe-action` |
