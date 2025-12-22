---
name: storage
description: Cloudflare R2 file storage patterns. Use when implementing file uploads, downloads, presigned URLs, or working with object storage. Triggers on file upload, file storage, R2, presigned URL, generateUploadUrlAction, deleteFileAction.
---

# Storage (Cloudflare R2)

## Provider

Cloudflare R2 with S3-compatible API using `@aws-sdk/client-s3`.

## Operations

| Operation  | Pattern       | Location                             |
| ---------- | ------------- | ------------------------------------ |
| Upload URL | Server Action | `actions/storage/storage.action.ts`  |
| Download   | API Route     | `app/api/storage/[...path]/route.ts` |
| Delete     | Server Action | `actions/storage/storage.action.ts`  |

## Upload Flow

1. Client requests presigned URL via `generateUploadUrlAction`
2. Client uploads directly to R2 using presigned URL (PUT request)
3. Store returned `key` in database
4. Display using `getStorageFile(key)` which proxies through API route

## Quick Usage

```typescript
// Generate upload URL
const result = await generateUploadUrlAction({
  fileName: "avatar.png",
  contentType: "image/png",
  fileSize: 1024 * 100,
  prefix: "avatars",
});

// Delete file
await deleteFileAction({ key: "avatars/uuid-avatar.png" });

// Get file URL for display
const imageUrl = getStorageFile(user.image);
```

## Validation

| Constraint     | Value                                        |
| -------------- | -------------------------------------------- |
| Max file size  | 10 MB                                        |
| Allowed types  | image/jpeg, image/png, image/gif, image/webp |
| Key max length | 1024 characters                              |

See [reference.md](reference.md) for architecture and environment variables.
See [examples.md](examples.md) for complete upload implementation.
