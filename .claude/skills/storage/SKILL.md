---
name: storage
description: "Cloudflare R2 object storage with S3-compatible API. Presigned URLs for uploads, API routes for downloads, file validation (size, type), and helper functions. Use when implementing file uploads, handling images, managing storage operations, or working with user-uploaded content."
---

## Overview

The application uses **Cloudflare R2** for object storage with S3-compatible API via `@aws-sdk/client-s3`.

**Provider**: Cloudflare R2
**Client**: `@aws-sdk/client-s3`
**Max file size**: 10 MB
**Allowed types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

---

## Architecture

```
src/features/storage/
├── domain/
│   ├── value-objects/      # FileKey, ContentType validation
│   └── errors/             # InvalidFileType, FileTooLarge
├── application/
│   ├── use-cases/          # GenerateUploadUrl, GenerateDownloadUrl, DeleteFile
│   ├── dto/                # PresignedUrl DTO
│   └── ports/              # IObjectStoragePort interface
├── infrastructure/
│   └── adapters/           # R2Adapter (S3-compatible)
└── interface/
    ├── controllers/        # StorageController
    └── schemas/            # Zod validation schemas
```

---

## Operations

| Operation  | Pattern       | Location                             | Use Case                    |
| ---------- | ------------- | ------------------------------------ | --------------------------- |
| Upload URL | Server Action | `actions/storage/storage.action.ts`  | Generate presigned URL      |
| Download   | API Route     | `app/api/storage/[...path]/route.ts` | Proxy file downloads        |
| Delete     | Server Action | `actions/storage/storage.action.ts`  | Delete file from storage    |

---

## Upload Flow

1. **Client requests presigned URL** via `generateUploadUrlAction`
2. **Client uploads directly to R2** using presigned URL (PUT request)
3. **Store returned `key`** in database
4. **Display using `getStorageFile(key)`** which proxies through API route

---

## Server Actions

### Generate Upload URL

```typescript
import { generateUploadUrlAction } from "@/actions/storage/storage.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";

const result = await generateUploadUrlAction({
  fileName: "avatar.png",
  contentType: "image/png",
  fileSize: 1024 * 100, // 100KB
  prefix: "avatars", // Optional folder prefix
});

if (isActionSuccessful(result)) {
  const { uploadUrl, key } = result.data.data;

  // Upload file directly to R2
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": "image/png",
    },
  });

  // Save key to database
  await updateUserAction({ image: key });
}
```

### Delete File

```typescript
import { deleteFileAction } from "@/actions/storage/storage.action";

await deleteFileAction({
  key: "avatars/uuid-avatar.png",
});
```

---

## File URL Helper

The `getStorageFile` helper converts R2 URLs or keys to internal API route.

```typescript
import { getStorageFile } from "@/lib/storage";

// Convert key to URL
const imageUrl = getStorageFile("avatars/uuid-avatar.png");
// Returns: "/api/storage/avatars/uuid-avatar.png"

// Convert R2 URL to internal URL
const imageUrl = getStorageFile("https://r2.cloudflare.com/bucket/avatars/uuid-avatar.png");
// Returns: "/api/storage/avatars/uuid-avatar.png"

// Use in image component
<Image src={getStorageFile(user.image)} alt="Avatar" width={100} height={100} />
```

**Why proxy through API route?**
- Hide R2 credentials from client
- Apply access control
- Generate presigned download URLs server-side

---

## Validation Constraints

| Constraint     | Value                                        |
| -------------- | -------------------------------------------- |
| Max file size  | 10 MB (10,485,760 bytes)                     |
| Allowed types  | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| Key max length | 1024 characters                              |

---

## Controller Access

```typescript
import { container } from "@/shared/infrastructure/di/container";

const storageController = container.getStorageController();

// Generate upload URL
const { uploadUrl, key } = await storageController.generateUploadUrl({
  fileName: "document.pdf",
  contentType: "application/pdf",
  fileSize: 5000000, // 5MB
  prefix: "documents",
});

// Generate download URL (presigned)
const { downloadUrl } = await storageController.generateDownloadUrl(key);

// Delete file
await storageController.deleteFile(key);
```

---

## Complete Upload Example

### Client Component with File Upload

```typescript
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateUploadUrlAction } from "@/actions/storage/storage.action";
import { updateUserProfileAction } from "@/actions/user/user.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";

export const AvatarUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const { mutate: uploadAvatar, isPending } = useMutation({
    mutationFn: async (file: File) => {
      // 1. Generate presigned upload URL
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

      // 2. Upload file directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // 3. Update user profile with new image key
      const updateResult = await updateUserProfileAction({
        image: key,
      });

      if (!isActionSuccessful(updateResult)) {
        throw new Error(getActionErrorMessage(updateResult));
      }

      return key;
    },
    onSuccess: () => {
      toast.success("Avatar uploaded successfully!");
      setFile(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div>
      <Input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
      />
      <Button
        onClick={() => file && uploadAvatar(file)}
        disabled={!file || isPending}
      >
        {isPending ? "Uploading..." : "Upload Avatar"}
      </Button>
    </div>
  );
};
```

---

## API Route for Downloads

```typescript
// app/api/storage/[...path]/route.ts
import { NextRequest } from "next/server";

import { route } from "@/lib/routes/route";
import { container } from "@/shared/infrastructure/di/container";

export const GET = route.handler(async (req: NextRequest) => {
  const storageController = container.getStorageController();

  // Extract key from path (e.g., /api/storage/avatars/uuid-image.png -> avatars/uuid-image.png)
  const key = req.nextUrl.pathname.replace("/api/storage/", "");

  // Generate presigned download URL
  const { downloadUrl } = await storageController.generateDownloadUrl(key);

  // Redirect to presigned URL
  return Response.redirect(downloadUrl);
});
```

---

## Environment Variables

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
```

Add these to your `.env` file and Vercel environment variables.

---

## Error Handling

### File Too Large

```typescript
const result = await generateUploadUrlAction({
  fileName: "large-file.jpg",
  contentType: "image/jpeg",
  fileSize: 15 * 1024 * 1024, // 15MB (exceeds 10MB limit)
  prefix: "avatars",
});

// result.data.error.message: "File size exceeds maximum of 10MB"
```

### Invalid File Type

```typescript
const result = await generateUploadUrlAction({
  fileName: "document.pdf",
  contentType: "application/pdf", // Not in allowed types
  fileSize: 1024 * 100,
  prefix: "documents",
});

// result.data.error.message: "File type not allowed"
```

### Client-Side Validation

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 10MB";
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, GIF, and WebP images are allowed";
  }

  return null; // Valid
}

// Usage
const error = validateFile(file);
if (error) {
  toast.error(error);
  return;
}
```

---

## Prefixes (Folders)

Organize files with prefixes (virtual folders):

```typescript
// User avatars
generateUploadUrlAction({ prefix: "avatars", ... });
// Key: "avatars/uuid-image.png"

// Document uploads
generateUploadUrlAction({ prefix: "documents", ... });
// Key: "documents/uuid-file.pdf"

// Blog post images
generateUploadUrlAction({ prefix: "blog/images", ... });
// Key: "blog/images/uuid-image.png"
```

---

## Deleting Old Files

When updating a user's image, delete the old file first:

```typescript
const { mutate: updateAvatar } = useMutation({
  mutationFn: async ({ oldImage, newImage }: { oldImage: string | null; newImage: string }) => {
    // 1. Delete old image if exists
    if (oldImage) {
      await deleteFileAction({ key: oldImage });
    }

    // 2. Update user profile with new image
    const result = await updateUserProfileAction({ image: newImage });

    if (!isActionSuccessful(result)) {
      throw new Error(getActionErrorMessage(result));
    }
  },
});
```

---

## Best Practices

1. ✅ **Validate on client-side first** - Check file size and type before upload
2. ✅ **Delete old files** - Clean up replaced files to save storage
3. ✅ **Use prefixes** - Organize files with virtual folders
4. ✅ **Store keys in database** - Save storage keys, not full URLs
5. ✅ **Use getStorageFile helper** - Convert keys to URLs consistently
6. ✅ **Handle upload errors** - Show user-friendly error messages
7. ✅ **Show upload progress** - Provide feedback during upload
8. ❌ **Don't store R2 URLs directly** - URLs can change, keys are stable
9. ❌ **Don't expose R2 credentials** - Always proxy through API routes
10. ❌ **Don't skip validation** - Always validate file size and type

---

## Security Considerations

- **Presigned URLs expire** - Upload URLs are time-limited (default 1 hour)
- **Server-side validation** - Client validation is convenience, not security
- **Access control** - Download API route can enforce permissions
- **File type validation** - Prevents malicious file uploads
- **Size limits** - Prevents storage abuse

---

## Common Patterns

### Avatar Upload Component

```typescript
"use client";

import Image from "next/image";
import { getStorageFile } from "@/lib/storage";

type AvatarProps = {
  src: string | null;
  alt: string;
  size?: number;
};

export const Avatar = ({ src, alt, size = 40 }: AvatarProps) => {
  const imageUrl = src ? getStorageFile(src) : "/default-avatar.png";

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full"
    />
  );
};
```

### File Upload Form Field

```typescript
"use client";

import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

<FormField
  name="avatar"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Profile Picture</FormLabel>
      <FormControl>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              field.onChange(file);
            }
          }}
        />
      </FormControl>
    </FormItem>
  )}
/>
```
