# API Patterns Examples

## Server Route: Admin Stats

From `src/app/api/admin/stats/registrations.ts`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { accessRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export const Route = createFileRoute("/api/admin/stats/registrations")({
  server: {
    handlers: {
      GET: accessRoute("overview", "read").handler(async () => {
        const adminController = container.getAdminController();
        const stats = await adminController.getRegistrationStats(30);

        return ApiResponse.success({ stats });
      }),
    },
  },
});
```

## Server Route: CSV Export

From `src/app/api/admin/users/export.ts`:

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { getAdminUserCsvColumns } from "@/features/admin/interface/csv/admin-csv-columns";
import { listAdminUsersSchema } from "@/features/admin/interface/schemas/admin.schema";
import { getTranslations } from "@/i18n/server";
import { accessRoute } from "@/lib/zod-route";
import { createCsvStream, csvResponse } from "@/shared/infrastructure/csv/csv";
import { container } from "@/shared/infrastructure/di/container";
import { parseListQueryRequest } from "@/shared/infrastructure/http/list-query-request";

export const Route = createFileRoute("/api/admin/users/export")({
  server: {
    handlers: {
      GET: accessRoute("users", "read").handler(async ({ request, ctx }) => {
        const query = parseListQueryRequest(request, listAdminUsersSchema);
        const [batches, t] = await Promise.all([
          container
            .getAdminController()
            .exportUsers({ actorUserId: ctx.user.id, query }),
          getTranslations("admin.export.users"),
        ]);

        return csvResponse(
          createCsvStream(getAdminUserCsvColumns(t), batches),
          "users",
        );
      }),
    },
  },
});
```

The export use case records an audit log, then returns
`iterateListPages((page, pageSize) => repository.list({ ...query, page, pageSize }), { pageSize: EXPORT_BATCH_SIZE, maxRows: MAX_EXPORT_ROWS })`
as `batches`. The table passes the route as `exportHref`.

## Server Route: Authenticated Download With Params

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

## Server Function: User Profile Update

From `src/server-functions/user.functions.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";

import { updateUserProfileSchema } from "@/features/user/interface/schemas/user.schema";
import { userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";

const updateUserServerFn = createServerFn({ method: "POST" })
  .validator(updateUserProfileSchema)
  .handler(({ data }) =>
    userAction((user) =>
      container.getUserController().updateUserProfile(user.id, data),
    ),
  );

export async function updateUserAction(data: UpdateUserInput) {
  return updateUserServerFn({ data }) as Promise<
    ActionResponseType<UserResponseDTO>
  >;
}
```

## Server Function: Feature Access

Condensed from `src/server-functions/admin.functions.ts`:

```typescript
import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import { accessAction } from "@/lib/actions/safe-actions";

const setAdminUserRoleServerFn = createServerFn({ method: "POST" })
  .validator(setAdminUserRoleSchema)
  .handler(({ data }) =>
    accessAction(
      "users",
      "write",
      (actor) =>
        container.getAdminController().setUserRole({
          ...data,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );
```

Pass `actor.access` to use cases that grant or assign access so nobody can
grant more than they hold.

## Server Function: File Upload FormData

Condensed from `src/server-functions/storage.functions.ts`:

```typescript
function getRequiredFormDataFile(data: unknown) {
  if (!(data instanceof FormData))
    throw ActionError.validationError("Expected FormData");

  const file = data.get("file");

  if (!(file instanceof File))
    throw ActionError.validationError("A file is required");

  if (file.size > MAX_FILE_SIZE_BYTES)
    throw ActionError.validationError("File size cannot exceed 10 MB");

  return { data, file };
}

const replaceUserAvatarServerFn = createServerFn({ method: "POST" })
  .validator((data) =>
    parseImageUploadInput(data, STORAGE_PREFIXES.userAvatars),
  )
  .handler(({ data }) => userAction(() => processImageUpload(data)));

export async function replaceUserAvatarAction(file: File) {
  const formData = new FormData();

  formData.set("file", file);

  return replaceUserAvatarServerFn({ data: formData }) as Promise<
    ActionResponseType<ReplaceImageOutput>
  >;
}
```

## Client Component: Calling A Server Function

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { unwrapActionData } from "@/lib/actions/actions-utils";
import { updateUserAction } from "@/server-functions/user.functions";

const { mutate, isPending } = useMutation({
  mutationFn: async (data: FormValues) =>
    unwrapActionData(await updateUserAction(data)),
  onSuccess: () => toast.success(t("updateSuccess")),
  onError: (error) => toast.error(error.message),
});
```

## MCP Tool

Condensed from `src/mcp/tools/admin.tools.ts`:

```typescript
import { z } from "zod";

import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import { container } from "@/shared/infrastructure/di/container";

import { defineMcpTool } from "../tool";

const mapError = toAdminActionError;

export const adminTools = [
  defineMcpTool({
    name: "admin_set_user_role",
    title: "Set user role",
    description:
      "Assigns a role to a user: admin, user or a custom role key from admin_list_roles.",
    inputSchema: z.object({
      userId: z.string().min(1),
      role: roleKeyInputSchema,
    }),
    annotations: { idempotentHint: true },
    access: { feature: "users", level: "write" },
    mapError,
    handler: async (input, { user }) =>
      container.getAdminController().setUserRole({
        ...input,
        actorUserId: user.id,
        actorAccess: user.access,
      }),
  }),
];
```

Spread the array into `mcpTools` in `src/mcp/server.ts`. Tools whose `access`
the user lacks are not registered. The handler result is returned as JSON text,
and thrown errors become `isError` results through `mapError` and
`actionErrorResponse`.
