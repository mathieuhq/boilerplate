# Storage Examples

## Server Function: Generate Upload URL

```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

const generateUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

const generateUploadUrlServerFn = createServerFn({ method: "POST" })
  .validator(generateUploadUrlSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const storageController = container.getStorageController();
      const result = await storageController.generateUploadUrl(data);

      return ActionResponse.success(result);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });
```

## Server Function: Process And Upload File

Use `FormData` for `File` uploads:

```typescript
const processAndUploadFileServerFn = createServerFn({ method: "POST" })
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw HttpError.validationError("Expected FormData");
    }

    const file = data.get("file");

    if (!(file instanceof File)) {
      throw HttpError.validationError("A file is required");
    }

    return { file };
  })
  .handler(async ({ data }) => {
    const arrayBuffer = await data.file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storageController = container.getStorageController();
    const result = await storageController.processAndUploadFile({
      buffer,
      contentType: data.file.type,
    });

    return ActionResponse.success(result);
  });
```

## Server Route: Download Proxy

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

## Feature Component: Avatar Upload

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslations } from "@/i18n";
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { processAndUploadFileAction } from "@/server-functions/storage.functions";

export const AvatarUpload = ({ currentImage }: AvatarUploadProps) => {
  const router = useRouter();
  const t = useTranslations("settings.profile.avatar");

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File) => {
      const result = await processAndUploadFileAction(file, {
        contentType: file.type,
        prefix: "user-avatars",
      });

      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }

      return result.data.data.key;
    },
    onSuccess: () => {
      toast.success(t("uploadSuccess"));
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <input
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      disabled={isPending}
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) mutate(file);
      }}
    />
  );
};
```
