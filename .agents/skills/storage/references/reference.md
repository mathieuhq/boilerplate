# Storage Reference

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

## Controller Methods

```typescript
import { container } from "@/shared/infrastructure/di/container";

const storageController = container.getStorageController();

// Generate presigned upload URL
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

## File URL Helper

```typescript
import { getStorageFile } from "@/lib/storage";

// Converts R2 URLs or keys to internal API route
const imageUrl = getStorageFile(user.image);
// Returns: "/api/storage/user-avatars/uuid-avatar.png"
```

## Environment Variables

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
```

## Server Actions

| Action                    | Input                                    | Output             |
| ------------------------- | ---------------------------------------- | ------------------ |
| `generateUploadUrlAction` | fileName, contentType, fileSize, prefix? | { uploadUrl, key } |
| `deleteFileAction`        | key                                      | { success: true }  |

## Validation Constraints

| Constraint          | Value                                        |
| ------------------- | -------------------------------------------- |
| Max file size       | 10 MB (10 _ 1024 _ 1024 bytes)               |
| Allowed image types | image/jpeg, image/png, image/gif, image/webp |
| Key max length      | 1024 characters                              |
| URL expiration      | 3600 seconds (1 hour)                        |
