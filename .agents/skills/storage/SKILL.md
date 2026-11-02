---
name: storage
description: Cloudflare R2 storage uploads, downloads, deletes, presigned URLs, file keys, object storage validation, and storage server functions/routes. Use when implementing image uploads, server-generated files, presigned download redirects, deletes, replaceUserAvatarAction, replaceOrganizationLogoAction, resolveStorageImageUrl, uploadFile/downloadFile, data-exports keys, or R2 adapters.
---

# Storage (Cloudflare R2)

## Workflow

- Upload user images through TanStack server functions in
  `src/server-functions/storage.functions.ts` (`replaceUserAvatarAction`,
  `replaceOrganizationLogoAction`), which post `FormData`, compress to WebP with
  `processAndUploadFile`, save the key and delete the replaced object.
- Resolve stored keys to short-lived presigned URLs on the server with
  `resolveStorageImageUrl` (see `src/server-functions/page-data.functions.ts`);
  there is no storage proxy route.
- Store server-generated files with `uploadFile`/`downloadFile` under an explicit
  key with a managed prefix, such as `data-exports/{userId}/{exportId}.zip`, and
  serve them from an authenticated route that redirects to
  `generateDownloadUrl(key, { fileName, expiresInSeconds })`.
- Keep R2/S3 provider details in infrastructure adapters and services, not UI components.
- Validate file size, content type, key length, and prefixes before issuing storage operations;
  `FileKey` only accepts the managed prefixes.
- Store returned object keys in persistence; do not store presigned URLs as durable data.
- Delete replaced files when the owning workflow supports cleanup.

## Resources

- Read [references/reference.md](references/reference.md) for architecture, controller methods, key and URL helpers, environment variables, actions, and constraints.
- Read [references/examples.md](references/examples.md) for image upload server functions, presigned image URLs, server-generated files, download redirects, and avatar upload UI.

## Boundaries

- Use `$api-patterns` for route/action wrapper rules.
- Use `$clean-architecture` for storage use cases, ports, adapters, and DI wiring.
- Use `$page-creation` when storage work is part of UI/page composition.
