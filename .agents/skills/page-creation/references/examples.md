# Page Creation Examples

## Complete Page Implementation

### Step 1: SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information and preferences.",
  },
};
```

### Step 2: Server Function For Page Data

```typescript
// src/server-functions/page-data.functions.ts
import { createServerFn } from "@tanstack/react-start";

import { container } from "@/shared/infrastructure/di/container";

export const getProfileSettingsData = createServerFn({ method: "GET" }).handler(
  async () => {
    const userController = container.getUserController();
    const user = await userController.getCurrentUserProfile();

    return { user };
  },
);
```

### Step 3: Feature Component

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Form, FormField, FormItem } from "@/components/ui/form";
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { updateUserAction } from "@/server-functions/user.functions";

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const t = useTranslations("settings.profile");

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: FormValues) => {
      const result = await updateUserAction(data);

      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      router.refresh();
    },
  });

  return (
    <Form form={form} onSubmit={(values) => mutate(values)}>
      <FormField name="name" render={({ field }) => <Input {...field} />} />
      <FormButton loading={isPending}>{t("save")}</FormButton>
    </Form>
  );
};
```

### Step 4: View

```typescript
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { ProfileForm } from "@/components/features/dashboard/form/profile-form";
import { useTranslations } from "@/i18n";

export function ProfileSettingsView({ user }: ProfileSettingsViewProps) {
  const t = useTranslations("settings.profile");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <ProfileForm user={user} />
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
  const { user } = Route.useLoaderData();

  return <ProfileSettingsView user={user} />;
}
```

## Auth Page Example

```typescript
import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { SigninView } from "@/views/sign/signin";

export const Route = createFileRoute("/auth/signin")({
  head: () => ({
    meta: getPageMetaTags("signIn"),
  }),
  component: SignInPage,
});

function SignInPage() {
  return <SigninView />;
}
```

## Protected Layout Example

```typescript
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { requireSession } from "@/server-functions/auth.functions";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async ({ location }) => {
    const session = await requireSession();

    if (!session?.user)
      throw redirect({
        to: "/auth/signin",
        search: { callbackUrl: location.href },
      });

    return { user: session.user };
  },
  component: () => <Outlet />,
});
```

## File Upload Feature Component

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslations } from "@/i18n";
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { processAndUploadFileAction } from "@/server-functions/storage.functions";

export const AvatarUpload = ({ currentImage }: AvatarUploadProps) => {
  const router = useRouter();
  const t = useTranslations("settings.profile.avatar");

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File) => {
      const result = await processAndUploadFileAction(file, {
        contentType: file.type,
        prefix: "user-avatars",
      });

      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }

      return result.data.data.key;
    },
    onSuccess: () => {
      toast.success(t("uploadSuccess"));
      router.refresh();
    },
  });
};
```
