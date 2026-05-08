# API Patterns Examples

## Server Route: Admin Stats

From `src/app/api/admin/stats/registrations.ts`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { adminRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export const Route = createFileRoute("/api/admin/stats/registrations")({
  server: {
    handlers: {
      GET: adminRoute.handler(async () => {
        const adminController = container.getAdminController();
        const stats = await adminController.getRegistrationStats(30);

        return ApiResponse.success({ stats });
      }),
    },
  },
});
```

## Server Route: Storage Download

From `src/app/api/storage/$.ts`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

const storagePrefix = "/api/storage/";

export const Route = createFileRoute("/api/storage/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = decodeURIComponent(
          url.pathname.slice(storagePrefix.length),
        );

        if (!key)
          return ApiResponse.badRequest("MISSING_PATH", "Missing file path");

        try {
          const storageController = container.getStorageController();
          const result = await storageController.generateDownloadUrl(key);

          return Response.redirect(result.downloadUrl, 302);
        } catch {
          return ApiResponse.notFound("File");
        }
      },
    },
  },
});
```

## Server Function: User Profile Update

From `src/server-functions/user.functions.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";

import { updateUserProfileSchema } from "@/features/user/interface/schemas/user.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

const updateUserServerFn = createServerFn({ method: "POST" })
  .inputValidator(updateUserProfileSchema)
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const userController = container.getUserController();
      const updatedUser = await userController.updateUserProfile(user.id, data);

      return ActionResponse.success(updatedUser);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });
```

## Server Function: File Upload FormData

From `src/server-functions/storage.functions.ts`:

```typescript
const processAndUploadFileServerFn = createServerFn({ method: "POST" })
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw ActionError.validationError("Expected FormData");
    }

    const file = data.get("file");

    if (!(file instanceof File)) {
      throw ActionError.validationError("A file is required");
    }

    return { file };
  })
  .handler(async ({ data }) => {
    const arrayBuffer = await data.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return ActionResponse.success({ buffer });
  });
```

## Client Component: Calling A Server Function

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { updateUserAction } from "@/server-functions/user.functions";

const { mutate, isPending } = useMutation({
  mutationFn: async (data: FormValues) => {
    const result = await updateUserAction(data);

    if (!isActionSuccessful(result)) {
      throw new Error(getActionErrorMessage(result));
    }

    return result.data;
  },
  onSuccess: () => toast.success(t("updateSuccess")),
  onError: (error) => toast.error(error.message),
});
```
