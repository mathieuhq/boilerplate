---
name: api-patterns
description: "API routes for GET operations with Next.js caching and server actions for all mutations (POST, PUT, PATCH, DELETE). Response helpers (ApiResponse, ActionResponse), status codes, and client-side utilities. Use when implementing new API endpoints, handling form submissions, structuring request/response patterns, or choosing between routes and actions."
---

## When to Use Each Pattern

**Critical Rule**: Choose the right pattern based on HTTP method and use case.

| Pattern        | HTTP Methods | Use Case                                    |
| -------------- | ------------ | ------------------------------------------- |
| API Routes     | GET only     | Read operations (leverage Next.js caching)  |
| Server Actions | Mutations    | POST, PUT, PATCH, DELETE (form submissions) |

**Important**: API Routes should ONLY be used for GET requests to benefit from Next.js caching. All mutations (POST, PUT, PATCH, DELETE) MUST use Server Actions.

**Exception**: Webhooks from external services (Stripe, etc.) must use API Routes since they require public HTTP endpoints.

---

## Pattern A: API Routes (`/app/api`) - GET Only

Use for read-only endpoints that benefit from Next.js caching and need public HTTP access.

### Basic Example

```typescript
import { adminRoute } from "@/lib/routes/admin-route";
import { ApiResponse } from "@/shared/infrastructure/http";
import { container } from "@/shared/infrastructure/di/container";
import { listUsersSchema } from "@/features/admin/interface/schemas/admin.schema";

export const GET = adminRoute
  .query(listUsersSchema)
  .handler(async (_req, { query }) => {
    const adminController = container.getAdminController();
    const result = await adminController.listUsers(query);
    return ApiResponse.paginated(result.users, { total: result.total });
  });
```

### With Authentication

```typescript
import { authRoute } from "@/lib/routes/auth-route";
import { ApiResponse } from "@/shared/infrastructure/http";

export const GET = authRoute.handler(async (_req, { user }) => {
  const userController = container.getUserController();
  const profile = await userController.getUserProfile(user.id);
  return ApiResponse.success(profile);
});
```

### Public Route

```typescript
import { route } from "@/lib/routes/route";
import { ApiResponse } from "@/shared/infrastructure/http";

export const GET = route.handler(async (req) => {
  const data = await fetchPublicData();
  return ApiResponse.success(data);
});
```

### Response Helpers (API Routes)

```typescript
import { ApiResponse } from "@/shared/infrastructure/http";

// Success (200)
ApiResponse.success(data);

// Created (201)
ApiResponse.created(data);

// Paginated (200 with meta)
ApiResponse.paginated(items, { total: 100 });

// Not Found (404)
ApiResponse.notFound("User");

// Forbidden (403)
ApiResponse.forbidden("Admin access required");
```

---

## Pattern B: Server Actions (`/actions`) - All Mutations

Use for all data mutations (create, update, delete) and form submissions. Server Actions are the preferred way to handle mutations in Next.js.

### Basic Example

```typescript
"use server";

import { authAction } from "@/lib/actions/safe-action";
import { ActionResponse } from "@/shared/infrastructure/http";
import { container } from "@/shared/infrastructure/di/container";
import { updateUserProfileSchema } from "@/features/user/interface/schemas/user.schema";

export const updateUserProfileAction = authAction
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

### With Custom Validation

```typescript
"use server";

import { action } from "@/lib/actions/safe-action";
import { ActionResponse } from "@/shared/infrastructure/http";
import { signInSchema } from "@/features/auth/interface/schemas/auth.schema";

export const signInAction = action
  .inputSchema(signInSchema)
  .action(async ({ parsedInput }) => {
    const authController = container.getAuthController();
    await authController.signIn(parsedInput);
    return ActionResponse.success({ message: "Signed in successfully" });
  });
```

### Response Helpers (Server Actions)

```typescript
import { ActionResponse } from "@/shared/infrastructure/http";

// Success
ActionResponse.success(data);

// Error
ActionResponse.error("VALIDATION_ERROR", "Invalid input", { field: "email" });
ActionResponse.error("NOT_FOUND", "User not found");
ActionResponse.error("UNAUTHORIZED", "Please sign in");
```

---

## Response Format

All responses follow a consistent format for success and error cases.

### Success Response

```typescript
{
  data: T
}

// Or with pagination
{
  data: T[],
  meta: {
    total: number
  }
}
```

### Error Response

```typescript
{
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

---

## HTTP Status Codes

Use these status codes consistently across API routes.

| Code | Usage            | Example                             |
| ---- | ---------------- | ----------------------------------- |
| 200  | OK               | Successful GET request              |
| 201  | Created          | Resource created successfully       |
| 204  | No Content       | Successful DELETE with no body      |
| 400  | Bad Request      | Invalid request parameters          |
| 401  | Unauthorized     | Not authenticated                   |
| 403  | Forbidden        | Authenticated but not authorized    |
| 404  | Not Found        | Resource doesn't exist              |
| 409  | Conflict         | Duplicate resource (email exists)   |
| 422  | Validation Error | Request body validation failed      |
| 500  | Internal Error   | Unexpected server error             |

---

## Client-Side Usage

### Server Actions in React Components

```typescript
"use client";

import { useMutation } from "@tanstack/react-query";
import { updateUserProfileAction } from "@/actions/user/user.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";
import { toast } from "sonner";

export const ProfileForm = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const result = await updateUserProfileAction(data);
      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Profile updated!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Form implementation...
};
```

### API Routes with fetch

```typescript
const response = await fetch("/api/admin/users?page=1&limit=10");
const data = await response.json();

if (response.ok) {
  console.log(data.data); // Access users
  console.log(data.meta); // Access pagination
} else {
  console.error(data.error.message);
}
```

---

## Utilities

### Action Helpers

```typescript
import {
  isActionSuccessful,
  getActionErrorMessage,
  getActionData,
} from "@/lib/actions/actions-utils";

// Check if action succeeded
if (isActionSuccessful(result)) {
  const data = getActionData(result);
  // Handle success
} else {
  const errorMessage = getActionErrorMessage(result);
  toast.error(errorMessage);
}
```

### Route Builders

Available route builders with different auth levels:

- `route` - Public route (no auth)
- `authRoute` - Requires authentication
- `adminRoute` - Requires admin role

```typescript
import { route } from "@/lib/routes/route";
import { authRoute } from "@/lib/routes/auth-route";
import { adminRoute } from "@/lib/routes/admin-route";

// Public
export const GET = route.handler(async (req) => {
  // No auth required
});

// Authenticated users
export const GET = authRoute.handler(async (req, { user }) => {
  // user is available
});

// Admin only
export const GET = adminRoute.handler(async (req, { user }) => {
  // user with admin role
});
```

### Action Builders

Available action builders:

- `action` - Public action (no auth)
- `authAction` - Requires authentication

```typescript
import { action } from "@/lib/actions/safe-action";
import { authAction } from "@/lib/actions/safe-action";

// Public action
export const publicAction = action
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    // No auth
  });

// Authenticated action
export const protectedAction = authAction
  .inputSchema(schema)
  .action(async ({ parsedInput, ctx }) => {
    // ctx.user available
  });
```

---

## Best Practices

1. **Always use GET for API routes** - Never implement POST/PUT/DELETE in API routes unless it's a webhook
2. **Validate inputs** - Use Zod schemas with `.query()` for routes and `.inputSchema()` for actions
3. **Use response helpers** - Don't manually construct response objects
4. **Handle errors properly** - Use Result pattern from use cases and throw appropriate errors
5. **Type safety** - Define input/output types for all endpoints
6. **Consistent error codes** - Use uppercase snake_case (e.g., `EMAIL_EXISTS`, `INVALID_INPUT`)
7. **Client-side error handling** - Always check `isActionSuccessful()` before accessing data
8. **Toast notifications** - Show user feedback for all mutations using `toast` from Sonner

---

## Common Patterns

### Pagination in API Routes

```typescript
const listUsersSchema = z.object({
  skip: z.coerce.number().default(0),
  take: z.coerce.number().default(10),
});

export const GET = adminRoute
  .query(listUsersSchema)
  .handler(async (_req, { query }) => {
    const { users, total } = await controller.listUsers(query);
    return ApiResponse.paginated(users, { total });
  });
```

### File Upload with Server Action

```typescript
export const uploadAvatarAction = authAction
  .inputSchema(uploadAvatarSchema)
  .action(async ({ parsedInput, ctx }) => {
    const storageController = container.getStorageController();
    const { uploadUrl, key } = await storageController.generateUploadUrl({
      fileName: parsedInput.fileName,
      contentType: parsedInput.contentType,
      fileSize: parsedInput.fileSize,
      prefix: "avatars",
    });

    return ActionResponse.success({ uploadUrl, key });
  });
```

### Conditional Logic in Actions

```typescript
export const deleteUserAction = authAction
  .inputSchema(deleteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Business logic check
    if (ctx.user.id === parsedInput.userId) {
      return ActionResponse.error(
        "INVALID_OPERATION",
        "Cannot delete your own account",
      );
    }

    const adminController = container.getAdminController();
    await adminController.deleteUser(parsedInput.userId);
    return ActionResponse.success({ message: "User deleted" });
  });
```
