# API Patterns

## Pattern A: API Routes (`/app/api`)

Use for REST endpoints, webhooks, external integrations.

```typescript
import { ApiResponse } from "@/shared/infrastructure/http";

export const GET = adminRoute
  .query(listUsersSchema)
  .handler(async (_req, { query }) => {
    const adminController = container.getAdminController();
    const result = await adminController.listUsers(query);
    return ApiResponse.paginated(result.users, { total: result.total });
  });
```

## Pattern B: Server Actions (`/actions`)

Use for form submissions and mutations tied to UI components.

```typescript
import { ActionResponse } from "@/shared/infrastructure/http";

export const updateUserAction = authAction
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userController = container.getUserController();
    const result = await userController.updateUserProfile(
      ctx.user.id,
      parsedInput,
    );
    return ActionResponse.success(result);
  });
```

## Response Format

**Success**: `{ data: T }` or `{ data: T, meta: { total: number } }`

**Error**: `{ error: { code: string, message: string, details?: unknown } }`

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

```typescript
// API Routes
ApiResponse.success(data);
ApiResponse.created(data);
ApiResponse.paginated(data, { total });
ApiResponse.notFound("Resource");
ApiResponse.forbidden("message");

// Server Actions
ActionResponse.success(data);
ActionResponse.error("CODE", "message", details);
```

## Client-Side

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
