# API Patterns Examples

## Real API Route: Admin Stats

From `app/api/admin/stats/registrations/route.ts`:

```typescript
import { ApiResponse } from "@/shared/infrastructure/http";
import { container } from "@/shared/infrastructure/di/container";
import { adminRoute } from "@/lib/zod-route";

export const GET = adminRoute.handler(async () => {
  const adminController = container.getAdminController();
  const stats = await adminController.getRegistrationStats();
  return ApiResponse.success(stats);
});
```

## Real API Route: Storage Download

From `app/api/storage/[...path]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { container } from "@/shared/infrastructure/di/container";

type Params = Promise<{ path: string[] }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params },
) {
  const { path } = await params;
  const key = path.join("/");

  try {
    const storageController = container.getStorageController();
    const { downloadUrl } = await storageController.generateDownloadUrl(key);
    return NextResponse.redirect(downloadUrl);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
```

## Real Server Action: User Profile Update

From `actions/user/user.action.ts`:

```typescript
"use server";

import { authAction } from "@/lib/safe-action";
import { ActionResponse } from "@/shared/infrastructure/http";
import { container } from "@/shared/infrastructure/di/container";
import { updateUserProfileSchema } from "@/features/user/interface/schemas/user.schema";

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

## Real Server Action: File Upload

From `actions/storage/storage.action.ts`:

```typescript
"use server";

import { z } from "zod";
import { authAction } from "@/lib/safe-action";
import { ActionResponse } from "@/shared/infrastructure/http";
import { container } from "@/shared/infrastructure/di/container";

export const generateUploadUrlAction = authAction
  .inputSchema(
    z.object({
      fileName: z.string(),
      contentType: z.string(),
      fileSize: z.number(),
      prefix: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const storageController = container.getStorageController();
    const result = await storageController.generateUploadUrl(parsedInput);
    return ActionResponse.success(result);
  });
```

## Client Component: Using Server Action with React Query

From `components/features/dashboard/form/profile-form.tsx`:

```typescript
"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateUserAction } from "@/actions/user/user.action";
import {
  isActionSuccessful,
  getActionErrorMessage,
} from "@/lib/actions/actions-utils";

const { mutate, isPending } = useMutation({
  mutationFn: async (data: FormValues) => {
    const result = await updateUserAction(data);
    if (!isActionSuccessful(result)) {
      throw new Error(getActionErrorMessage(result));
    }
    return result.data;
  },
  onSuccess: () => {
    toast.success(t("updateSuccess"));
    router.refresh();
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```
