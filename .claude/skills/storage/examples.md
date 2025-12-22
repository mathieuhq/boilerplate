# Storage Examples

## Server Action: Generate Upload URL

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

export const deleteFileAction = authAction
  .inputSchema(z.object({ key: z.string() }))
  .action(async ({ parsedInput }) => {
    const storageController = container.getStorageController();
    await storageController.deleteFile(parsedInput.key);
    return ActionResponse.success({ success: true });
  });
```

## API Route: Download Proxy

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

## Feature Component: Avatar Upload

```typescript
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateUploadUrlAction } from "@/actions/storage/storage.action";
import { updateUserAction } from "@/actions/user/user.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";

type AvatarUploadProps = {
  currentImage: string | null;
};

export const AvatarUpload = ({ currentImage }: AvatarUploadProps) => {
  const router = useRouter();
  const t = useTranslations("settings.profile.avatar");
  const [preview, setPreview] = useState<string | null>(currentImage);

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File) => {
      // Step 1: Get presigned URL
      const urlResult = await generateUploadUrlAction({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        prefix: "avatars",
      });

      if (!isActionSuccessful(urlResult)) {
        throw new Error(getActionErrorMessage(urlResult));
      }

      const { uploadUrl, key } = urlResult.data.data;

      // Step 2: Upload directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      // Step 3: Update user with new avatar key
      const updateResult = await updateUserAction({ image: key });

      if (!isActionSuccessful(updateResult)) {
        throw new Error(getActionErrorMessage(updateResult));
      }

      return key;
    },
    onSuccess: () => {
      toast.success(t("uploadSuccess"));
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      toast.error(t("invalidFileType"));
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    mutate(file);
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={preview || undefined} />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <label htmlFor="avatar-upload">
          <Button asChild disabled={isPending}>
            <span>{isPending ? t("uploading") : t("upload")}</span>
          </Button>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
    </div>
  );
};
```

## Use Case: Generate Upload URL

From `src/features/storage/application/use-cases/generate-upload-url.use-case.ts`:

```typescript
import { IUseCase } from "@/shared/application/use-case.interface";
import { Result } from "@/shared/domain/result";
import { IObjectStoragePort } from "../ports/object-storage.port";
import { FileKey } from "../../domain/value-objects/file-key.value-object";
import { FileTooLargeError } from "../../domain/errors/file-too-large.error";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_EXPIRATION_SECONDS = 3600;

interface Input {
  fileName: string;
  contentType: string;
  fileSize: number;
  prefix?: string;
}

interface Output {
  uploadUrl: string;
  key: string;
  expiresAt: Date;
}

export class GenerateUploadUrlUseCase implements IUseCase<Input, Result<Output>> {
  constructor(private readonly objectStorage: IObjectStoragePort) {}

  async execute(input: Input): Promise<Result<Output>> {
    if (input.fileSize > MAX_FILE_SIZE) {
      return Result.fail(new FileTooLargeError(input.fileSize, MAX_FILE_SIZE));
    }

    const fileKey = FileKey.create({
      prefix: input.prefix,
      fileName: input.fileName,
    });

    const uploadUrl = await this.objectStorage.generatePresignedUploadUrl(
      fileKey.value,
      input.contentType,
      DEFAULT_EXPIRATION_SECONDS,
    );

    const expiresAt = new Date(Date.now() + DEFAULT_EXPIRATION_SECONDS * 1000);

    return Result.ok({
      uploadUrl,
      key: fileKey.value,
      expiresAt,
    });
  }
}
```
