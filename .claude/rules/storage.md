# Storage (Cloudflare R2)

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

## Provider

Cloudflare R2 with S3-compatible API using `@aws-sdk/client-s3`.

## Operations

| Operation  | Pattern       | Location                             |
| ---------- | ------------- | ------------------------------------ |
| Upload URL | Server Action | `actions/storage/storage.action.ts`  |
| Download   | API Route     | `app/api/storage/[...path]/route.ts` |
| Delete     | Server Action | `actions/storage/storage.action.ts`  |

## Server Actions

```typescript
import {
  generateUploadUrlAction,
  deleteFileAction,
} from "@/actions/storage/storage.action";

// Generate presigned upload URL
const result = await generateUploadUrlAction({
  fileName: "avatar.png",
  contentType: "image/png",
  fileSize: 1024 * 100, // 100KB
  prefix: "avatars", // optional folder prefix
});

// Delete file
await deleteFileAction({ key: "avatars/uuid-avatar.png" });
```

## File URL Helper

```typescript
import { getStorageFile } from "@/lib/storage";

// Converts R2 URLs or keys to internal API route
const imageUrl = getStorageFile(user.image);
// Returns: "/api/storage/avatars/uuid-avatar.png"
```

## Validation Constraints

| Constraint     | Value                                        |
| -------------- | -------------------------------------------- |
| Max file size  | 10 MB                                        |
| Allowed types  | image/jpeg, image/png, image/gif, image/webp |
| Key max length | 1024 characters                              |

## Upload Flow

1. Client requests presigned URL via `generateUploadUrlAction`
2. Client uploads directly to R2 using presigned URL (PUT request)
3. Store returned `key` in database
4. Display using `getStorageFile(key)` which proxies through API route

## Controller Access

```typescript
import { container } from "@/shared/infrastructure/di/container";

const storageController = container.getStorageController();

// Generate upload URL
const { uploadUrl, key } = await storageController.generateUploadUrl({
  fileSize: 5000000,
  prefix: "documents",
  fileName: "document.pdf",
  contentType: "application/pdf",
});

// Generate download URL
const { downloadUrl } = await storageController.generateDownloadUrl(key);

// Delete file
await storageController.deleteFile(key);
```

## Environment Variables

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
```
