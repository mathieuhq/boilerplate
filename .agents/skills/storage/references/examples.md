# Storage Examples

## Server Function: Replace User Avatar

Condensed from `src/server-functions/storage.functions.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";

import { processAndUploadFileSchema } from "@/features/storage/interface/schemas/storage.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { STORAGE_PREFIXES } from "@/lib/storage";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

function parseImageUploadInput(
  data: unknown,
  prefix: ImageUploadInput["prefix"],
) {
  if (!(data instanceof FormData))
    throw ActionError.validationError("Expected FormData");

  const file = data.get("file");

  if (!(file instanceof File))
    throw ActionError.validationError("A file is required");

  if (file.size > MAX_FILE_SIZE_BYTES)
    throw ActionError.validationError("File size cannot exceed 10 MB");

  const { contentType } = processAndUploadFileSchema.parse({
    prefix,
    contentType: file.type,
  });

  return { file, prefix, contentType };
}

const replaceUserAvatarServerFn = createServerFn({ method: "POST" })
  .validator((data) =>
    parseImageUploadInput(data, STORAGE_PREFIXES.userAvatars),
  )
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const userController = container.getUserController();
      const currentUser = await userController.getCurrentUserProfile();
      const uploaded = await container
        .getStorageController()
        .processAndUploadFile({
          buffer: Buffer.from(await data.file.arrayBuffer()),
          prefix: data.prefix,
          contentType: data.contentType,
        });

      try {
        await userController.updateUserProfile(user.id, {
          image: uploaded.key,
        });
      } catch (error) {
        await deleteStorageObjectIfManaged(uploaded.key, data.prefix);
        throw error;
      }

      await deleteStorageObjectIfManaged(currentUser.image, data.prefix);

      return ActionResponse.success(uploaded);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

export async function replaceUserAvatarAction(file: File) {
  const formData = new FormData();

  formData.set("file", file);

  return replaceUserAvatarServerFn({ data: formData }) as Promise<
    ActionResponseType<ReplaceImageOutput>
  >;
}
```

`deleteStorageObjectIfManaged` only deletes keys under the same prefix and logs
failures instead of throwing.

## Server Function: Presigned Image URLs

From `src/server-functions/page-data.functions.ts`:

```typescript
import { resolveStorageImageUrl } from "@/features/storage/application/services/storage-image-url-resolver";
import { logger } from "@/lib/logger";
import { container } from "@/shared/infrastructure/di/container";

function createStorageImageResolver() {
  const storageController = container.getStorageController();

  return async (image: string | null | undefined) =>
    resolveStorageImageUrl(
      image,
      storageController.generateDownloadUrl.bind(storageController),
      {
        onError: (error, key) => {
          logger.warn("Failed to resolve storage image URL", { error, key });
        },
      },
    );
}

const resolveImageUrl = createStorageImageResolver();
const userImageUrl = await resolveImageUrl(user.image);
```

Return the resolved URL next to the stored key (`imageUrl`, `logoUrl`) and keep
the key as the persisted value.

## Server-Generated Files

Data exports wrap the storage controller in a feature port in
`src/shared/infrastructure/di/container.ts`:

```typescript
const storageController = this.getStorageController();
const storage: IDataExportStoragePort = {
  upload: async (input) => {
    await storageController.uploadFile(input);
  },
  download: async (key) => storageController.downloadFile(key),
  delete: async (key) => {
    await storageController.deleteFile(key);
  },
  getDownloadUrl: async ({ key, ...options }) => {
    const { downloadUrl } = await storageController.generateDownloadUrl(
      key,
      options,
    );

    return downloadUrl;
  },
};
```

The use case writes `data-exports/{userId}/{exportId}.zip`:

```typescript
await this.storage.upload({
  key: getDataExportFileKey(userId, dataExport.id),
  body: Buffer.from(archive),
  contentType: "application/zip",
});

const downloadUrl = await this.storage.getDownloadUrl({
  key: dataExport.fileKey,
  fileName: getDataExportFileName(dataExport.createdAt),
  expiresInSeconds: DATA_EXPORT_DOWNLOAD_URL_TTL_SECONDS,
});
```

## Server Route: Download Redirect

From `src/app/api/user/data-exports/$exportId.ts`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { toDataExportHttpError } from "@/features/user/interface/errors/data-export-error.mapper";
import { authRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";

export const Route = createFileRoute("/api/user/data-exports/$exportId")({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        authRoute.handler(async ({ ctx }) => {
          try {
            const { downloadUrl } = await container
              .getDataExportController()
              .getDownloadUrl(ctx.user.id, params.exportId);

            return new Response(null, {
              status: 302,
              headers: {
                Location: downloadUrl,
                "Cache-Control": "no-store",
                "Referrer-Policy": "no-referrer",
              },
            });
          } catch (error) {
            throw toDataExportHttpError(error);
          }
        })({ request }),
    },
  },
});
```

Check ownership in the use case before signing a URL, and keep the lifetime short.

## Feature Component: Avatar Upload

Condensed from `components/features/dashboard/form/avatar-form.tsx`:

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { replaceUserAvatarAction } from "@/server-functions/storage.functions";

import { useImageFileInput } from "./use-image-file-input";

export const AvatarForm = ({ user, onUploadSuccessAction }: AvatarFormProps) => {
  const t = useTranslations("settings.profile.avatar");

  const { accept, inputRef, resetInput, resetPreview, getValidFile } =
    useImageFileInput({
      onInvalidType: () => toast.error(t("invalidType")),
      onTooLarge: () => toast.error(t("tooLarge")),
    });

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File) => {
      const { key } = unwrapActionData(await replaceUserAvatarAction(file));

      return key;
    },
    onSuccess: (key) => {
      toast.success(t("updated"));
      onUploadSuccessAction?.(key);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("uploadError"));
      resetPreview();
    },
    onSettled: () => resetInput(),
  });

  return (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      disabled={isPending}
      onChange={(event) => {
        const file = getValidFile(event);
        if (file) mutate(file);
      }}
    />
  );
};
```
