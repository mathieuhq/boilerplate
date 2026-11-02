# Storage Reference

## Architecture

```
src/features/storage/
├── domain/
│   ├── value-objects/      # FileKey, ContentType validation
│   └── errors/             # InvalidFileType, FileTooLarge
├── application/
│   ├── use-cases/          # GenerateUploadUrl, GenerateDownloadUrl, DeleteFile,
│   │                       # ProcessAndUploadFile, UploadFile, DownloadFile
│   ├── dto/                # presigned-url.dto (inputs and outputs)
│   ├── ports/              # IObjectStoragePort, IImageCompressorPort
│   └── services/           # resolveStorageImageUrl
├── infrastructure/
│   ├── adapters/           # R2Adapter (S3-compatible), UnavailableObjectStorageAdapter
│   └── services/           # ImageCompressorService (sharp, WebP)
└── interface/
    ├── controllers/        # StorageController
    └── schemas/            # processAndUploadFileSchema
```

## Controller Methods

```typescript
import { container } from "@/shared/infrastructure/di/container";

const storageController = container.getStorageController();

const { uploadUrl, key, expiresAt } = await storageController.generateUploadUrl(
  {
    fileSize: 500000,
    prefix: "uploads",
    fileName: "photo.png",
    contentType: "image/png",
  },
);

const { downloadUrl } = await storageController.generateDownloadUrl(key, {
  fileName: "photo.png",
  expiresInSeconds: 300,
});

const { key: imageKey } = await storageController.processAndUploadFile({
  buffer,
  prefix: "user-avatars",
  contentType: "image/png",
});

await storageController.uploadFile({
  key: "data-exports/user-id/export-id.zip",
  body: archive,
  contentType: "application/zip",
});

const body = await storageController.downloadFile(key);

await storageController.deleteFile(key);
```

`generateDownloadUrl` defaults to a one hour lifetime; `fileName` sets an
`attachment` content disposition. `uploadFile` and `downloadFile` validate the
key only, so callers choose the content type. `downloadFile` returns a
`Buffer` or `null`.

## Key And URL Helpers

```typescript
import { resolveStorageImageUrl } from "@/features/storage/application/services/storage-image-url-resolver";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  STORAGE_PREFIXES,
  getExternalImageUrl,
  getStorageObjectKey,
} from "@/lib/storage";

const key = getStorageObjectKey(user.image);
const external = getExternalImageUrl(user.image);
const imageUrl = await resolveStorageImageUrl(
  user.image,
  storageController.generateDownloadUrl.bind(storageController),
);
```

`getStorageObjectKey` turns a key or an R2 URL into a key, `getExternalImageUrl`
keeps non-R2 URLs such as OAuth avatars, and `resolveStorageImageUrl` returns
the external URL or a presigned download URL, or `undefined` on failure.

## Environment Variables

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ENDPOINT=
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
```

Set `R2_ENDPOINT` instead of `R2_ACCOUNT_ID` to target another S3 server, such as the
SeaweedFS bucket that `pnpm services` starts on `http://localhost:8333`. Without
a storage config the container uses `UnavailableObjectStorageAdapter`, which
throws `STORAGE_NOT_CONFIGURED`.

## Server Functions

| Function                        | Input                        | Output    |
| ------------------------------- | ---------------------------- | --------- |
| `replaceUserAvatarAction`       | `File`                       | `{ key }` |
| `replaceOrganizationLogoAction` | `File`, `{ organizationId }` | `{ key }` |

Both build `FormData`, require a session (and an organization owner or admin
for logos), upload under their prefix, update the owner and delete the previous
managed object.

## Key Prefixes

| Prefix                 | Written by                                     |
| ---------------------- | ---------------------------------------------- |
| `uploads`              | Default for `generateUploadUrl` and processing |
| `user-avatars`         | `replaceUserAvatarAction`                      |
| `organization-avatars` | `replaceOrganizationLogoAction`                |
| `data-exports`         | GDPR data export archives (`uploadFile`)       |

## Validation Constraints

| Constraint            | Value                                                   |
| --------------------- | ------------------------------------------------------- |
| Max file size         | 10 MB (`10 * 1024 * 1024` bytes)                        |
| Allowed image types   | image/jpeg, image/png, image/gif, image/webp            |
| Stored image format   | WebP, avatars and logos resized to 512 px wide          |
| Key max length        | 1024 characters                                         |
| Key format            | Managed prefix, no URL, no leading `/`, `//`, `.`, `..` |
| Upload URL expiration | 3600 seconds (1 hour)                                   |
| Download URL default  | 3600 seconds, `expiresInSeconds` overrides it           |
| Data export download  | 300 seconds, named `data-export-YYYY-MM-DD.zip`         |
