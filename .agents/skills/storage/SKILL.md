---
name: storage
description: Cloudflare R2 storage uploads, downloads, deletes, presigned URLs, file keys, object storage validation, and storage server functions/routes. Use when implementing file upload, download proxy, delete, generateUploadUrlAction, deleteFileAction, getStorageFile, or R2 adapters.
---

# Storage (Cloudflare R2)

## Workflow

- Generate upload and delete operations through TanStack server functions in
  `src/server-functions/storage.functions.ts`.
- Serve downloads through the storage API route and expose display URLs with `getStorageFile(key)`.
- Keep R2/S3 provider details in infrastructure adapters and services, not UI components.
- Validate file size, content type, key length, and prefixes before issuing storage operations.
- Store returned object keys in persistence; do not store presigned URLs as durable data.
- Delete replaced files when the owning workflow supports cleanup.

## Resources

- Read [references/reference.md](references/reference.md) for architecture, controller methods, file URL helpers, environment variables, actions, and constraints.
- Read [references/examples.md](references/examples.md) for server functions, download proxy routes, avatar upload UI, and upload use cases.

## Boundaries

- Use `$api-patterns` for route/action wrapper rules.
- Use `$clean-architecture` for storage use cases, ports, adapters, and DI wiring.
- Use `$page-creation` when storage work is part of UI/page composition.
