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

### Step 2: Feature Component

From `components/features/dashboard/form/profile-form.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormButton } from "@/components/features/form/form-button";
import { updateUserAction } from "@/actions/user/user.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";
import { updateUserProfileSchema } from "@/features/user/interface/schemas/user.schema";

import type { AuthUser } from "@/types/auth-user";

type ProfileFormProps = {
  user: AuthUser;
};

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const t = useTranslations("settings.profile");

  const form = useForm({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  });

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
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form form={form} onSubmit={(values) => mutate(values)}>
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("name")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("email")}</FormLabel>
            <FormControl>
              <Input type="email" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormButton loading={isPending}>{t("save")}</FormButton>
    </Form>
  );
};
```

### Step 3: View

From `views/settings/profile.tsx`:

```typescript
import { getTranslations } from "next-intl/server";

import { PageLayout } from "@/components/features/dashboard/page-layout";
import { ProfileForm } from "@/components/features/dashboard/form/profile-form";

import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export async function ProfileSettingsView({ user }: ProfileSettingsViewProps) {
  const t = await getTranslations("settings.profile");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <ProfileForm user={user} />
    </PageLayout>
  );
}
```

### Step 4: Page

From `app/(dashboard)/settings/profile/page.tsx`:

```typescript
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { ProfileSettingsView } from "@/views/settings/profile";

export const metadata: Metadata = getPageMetadata("settingsProfile");

export default async function ProfilePage() {
  const userController = container.getUserController();
  const user = await userController.getCurrentUserProfile();

  return <ProfileSettingsView user={user} />;
}
```

### Step 5: Navigation (Optional)

```typescript
// components/features/dashboard/sidebar/sidebar.constants.tsx
export const SIDEBAR_NAV: SidebarNavGroup[] = [
  {
    title: "Settings",
    items: [
      {
        title: "Profile",
        icon: <User className="h-4 w-4" />,
        href: "/settings/profile",
      },
      // Add new items here
    ],
  },
];
```

## Auth Page Example

```typescript
// app/(auth)/sign-in/page.tsx
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignInForm } from "@/components/features/auth/sign-in-form";

export const metadata: Metadata = getPageMetadata("signIn");

export default function SignInPage() {
  return (
    <AuthTemplate
      title="Welcome back"
      description={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
      form={<SignInForm />}
      footer={
        <>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </>
      }
    />
  );
}
```

## Error Page Example

```typescript
// app/not-found.tsx
import { ErrorTemplate } from "@/components/features/error/error-template";

export default function NotFoundPage() {
  return (
    <ErrorTemplate
      code={404}
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
    />
  );
}
```

## File Upload Feature Component

```typescript
"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateUploadUrlAction } from "@/actions/storage/storage.action";
import { updateUserAction } from "@/actions/user/user.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";

export const AvatarUpload = ({ userId }: { userId: string }) => {
  const t = useTranslations("settings.profile.avatar");

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File) => {
      // Get presigned URL
      const urlResult = await generateUploadUrlAction({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        prefix: "user-avatars",
      });

      if (!isActionSuccessful(urlResult)) {
        throw new Error(getActionErrorMessage(urlResult));
      }

      // Upload to R2
      await fetch(urlResult.data.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // Update user with new avatar key
      const updateResult = await updateUserAction({
        image: urlResult.data.data.key,
      });

      if (!isActionSuccessful(updateResult)) {
        throw new Error(getActionErrorMessage(updateResult));
      }

      return updateResult.data;
    },
    onSuccess: () => {
      toast.success(t("uploadSuccess"));
    },
  });

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && mutate(e.target.files[0])}
      />
      <Button disabled={isPending}>
        {isPending ? t("uploading") : t("upload")}
      </Button>
    </div>
  );
};
```
