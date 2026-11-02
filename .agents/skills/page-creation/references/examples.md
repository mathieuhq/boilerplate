# Page Creation Examples

## Complete Page Implementation

### Step 1: SEO Configuration

Add the page key to `SEO_CONFIG` in `lib/seo.ts`:

```typescript
export const SEO_CONFIG: SEOConfig = {
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information and preferences.",
  },
};
```

### Step 2: Server Function For Page Data

In `src/server-functions/page-data.functions.ts`:

```typescript
import { createServerFn } from "@tanstack/react-start";

import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";

export const getProfileSettingsData = createServerFn({
  method: "GET",
}).handler(async () => {
  await getRequiredActionUser();

  const user = await container.getUserController().getCurrentUserProfile();
  const dataExport = await container
    .getDataExportController()
    .getStatus(user.id);

  return { user, dataExport };
});
```

### Step 3: Feature Component

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormButton } from "@/components/features/form/form-button";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { updateUserAction } from "@/server-functions/user.functions";

export const ProfilForm = ({ user }: ProfilFormProps) => {
  const router = useRouter();
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AccountFormValues) =>
      unwrapActionData(await updateUserAction(data)),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("updateError")),
  });

  return (
    <Form form={form} disabled={isPending} onSubmit={async (v) => mutate(v)}>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <Input {...field} />
          </FormItem>
        )}
      />
      <FormButton loading={isPending} type="submit">
        {tCommon("updateAccount")}
      </FormButton>
    </Form>
  );
};
```

### Step 4: View

```typescript
import { DataExportForm } from "@/components/features/dashboard/form/data-export-form";
import { ProfilForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { useTranslations } from "@/i18n";

export function ProfileSettingsView({
  user,
  dataExport,
}: ProfileSettingsViewProps) {
  const t = useTranslations("settings.profile");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <div className="space-y-8">
        <ProfilForm user={user} />
        <DataExportForm status={dataExport} />
      </div>
    </PageLayout>
  );
}
```

### Step 5: Route

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getProfileSettingsData } from "@/server-functions/page-data.functions";
import { ProfileSettingsView } from "@/views/settings/profile";

export const Route = createFileRoute("/_dashboard/settings/profile")({
  head: () => ({
    meta: getPageMetaTags("settingsProfile"),
  }),
  loader: async () => getProfileSettingsData(),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, dataExport } = Route.useLoaderData();

  return <ProfileSettingsView user={user} dataExport={dataExport} />;
}
```

## Auth Page Example

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { getSafeCallbackUrl } from "@/lib/auth-callback";
import { getPageMetaTags } from "@/lib/seo";
import { SignInView } from "@/views/sign/signin";

export const Route = createFileRoute("/auth/signin")({
  head: () => ({
    meta: getPageMetaTags("signin"),
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    callbackUrl:
      typeof search.callbackUrl === "string" ? search.callbackUrl : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const { callbackUrl } = Route.useSearch();

  return <SignInView callbackUrl={getSafeCallbackUrl(callbackUrl)} />;
}
```

## Protected Layout Example

`src/app/_dashboard.tsx` puts the session, access grants and impersonation
state in the route context for every dashboard page:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";

import { requireSession } from "@/server-functions/auth.functions";
import { getDashboardLayoutData } from "@/server-functions/page-data.functions";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async ({ location }) => {
    const session = await requireSession();

    if (!session?.user)
      throw redirect({
        to: "/auth/signin",
        search: { callbackUrl: location.href },
      });

    return {
      user: session.user,
      access: session.access,
      impersonation: session.impersonation,
    };
  },
  loader: async () => getDashboardLayoutData(),
  component: DashboardLayout,
});
```

A child route that needs a feature asserts it in `beforeLoad`:

```typescript
import { assertAccess } from "@/lib/access";

export const Route = createFileRoute("/_dashboard/reports")({
  beforeLoad: ({ context }) => {
    assertAccess(context.access, "reports", "read");
  },
  component: ReportsPage,
});
```

## Admin Page Example

Register the page in `ADMIN_PAGES` (`lib/admin-access.ts`) with an
`ACCESS_FEATURES` key and a `navigation` title key, then add its icon to
`ADMIN_PAGE_ICONS` in `src/app/_dashboard/admin.tsx`. The `/admin` layout then
asserts read access, adds it to the side nav and to `NAVIGATION_PAGES`.

```typescript
export const ADMIN_PAGES = [
  { href: "/admin/overview", feature: "overview", titleKey: "overview" },
  { href: "/admin/users", feature: "users", titleKey: "users" },
  { href: "/admin/reports", feature: "reports", titleKey: "reports" },
] as const satisfies readonly {
  href: string;
  feature: AccessFeature;
  titleKey: string;
}[];
```

## List Page Example

```typescript
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { listOrganizationAuditLogsSchema } from "@/features/organization/interface/schemas/organization.schema";
import { loadListData } from "@/lib/list-loader";
import { getPageMetaTags } from "@/lib/seo";
import { getOrganizationActivityData } from "@/server-functions/organization-activity.functions";
import { DEFAULT_PAGE_SIZE } from "@/shared/domain/list-query";
import { OrganizationActivityView } from "@/views/settings/organization-activity";

export const Route = createFileRoute(
  "/_dashboard/settings/organization-activity",
)({
  head: () => ({
    meta: getPageMetaTags("settingsOrganizationActivity"),
  }),
  validateSearch: listOrganizationAuditLogsSchema,
  search: {
    middlewares: [stripSearchParams({ page: 1, pageSize: DEFAULT_PAGE_SIZE })],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) =>
    loadListData(async () => getOrganizationActivityData({ data: deps })),
  component: OrganizationActivityPage,
});

function OrganizationActivityPage() {
  const query = Route.useSearch();
  const data = Route.useLoaderData();

  return (
    <OrganizationActivityView
      query={query}
      organization={data?.organization ?? null}
      auditLogs={data?.auditLogs ?? null}
    />
  );
}
```

The view wraps `OrganizationActivityTable`, which renders `DataTable` with
`query`, `result={auditLogs}`, memoized columns and filters.

## File Upload Feature Component

From `components/features/dashboard/form/avatar-form.tsx`:

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { replaceUserAvatarAction } from "@/server-functions/storage.functions";

import { useImageFileInput } from "./use-image-file-input";

export const AvatarForm = ({
  user,
  onUploadSuccessAction,
}: AvatarFormProps) => {
  const t = useTranslations("settings.profile.avatar");

  const { resetInput, resetPreview } = useImageFileInput({
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
};
```
