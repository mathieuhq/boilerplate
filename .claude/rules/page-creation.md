# Page Creation

## Architecture Overview

```
UI Components (components/ui/)
         ↓ composed by
Feature Components (components/features/)
         ↓ composed by
Views (views/)
         ↓ composed by
Pages (app/)
```

## Layer 1: UI Components

**Path**: `components/ui/`

Base, reusable primitives using Radix UI and CVA variants. Domain-agnostic.

```typescript
// components/ui/button.tsx
export const Button = ({ variant, size, children, ...props }) => (
  <button className={buttonVariants({ variant, size })} {...props}>
    {children}
  </button>
);
```

**Characteristics**:

- No business logic
- Use CVA for variants
- Radix UI for accessibility
- Export composable sub-components

## Layer 2: Feature Components

**Path**: `components/features/{domain}/`

Domain-specific components combining UI components into functional units.

```typescript
// components/features/dashboard/form/profile-form.tsx
"use client";

import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormButton } from "../../form/form-button";

export const ProfilForm = ({ user }: ProfilFormProps) => {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const result = await updateUserAction(data);
      if (!isActionSuccessful(result)) throw new Error(getActionErrorMessage(result));
      return result.data;
    },
    onSuccess: () => toast.success("Updated!"),
  });

  return (
    <Form form={form} onSubmit={(v) => mutate(v)}>
      <FormField name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl><Input {...field} /></FormControl>
        </FormItem>
      )} />
      <FormButton loading={isPending}>Submit</FormButton>
    </Form>
  );
};
```

**Characteristics**:

- `"use client"` directive for interactivity
- React Hook Form + Zod validation
- React Query (useMutation) for mutations
- Server Actions for API calls
- Toast notifications for feedback

## Layer 3: Views

**Path**: `views/{domain}/`

Page-level compositions that accept server-fetched data.

```typescript
// views/settings/profile.tsx
import { ProfilForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export const ProfileSettingsView = ({ user }: ProfileSettingsViewProps) => (
  <PageLayout title="Profile" desc="Update your profile settings.">
    <ProfilForm user={user} />
  </PageLayout>
);
```

**Characteristics**:

- `export const` arrow function
- Accept typed props from page
- Use `PageLayout` wrapper for dashboard pages
- Use `AuthTemplate` wrapper for auth pages
- Compose feature components

## Layer 4: Pages

**Path**: `app/{route}/page.tsx`

Next.js App Router pages fetching data and rendering views.

```typescript
// app/(dashboard)/settings/profile/page.tsx
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

**Characteristics**:

- Async Server Component
- Fetch data via DI Container
- Set metadata via `getPageMetadata()`
- Render View with server data

## Step-by-Step Guide

### 1. Add SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  // ... existing entries
  myNewPage: {
    title: "My New Page",
    description: "Description for SEO.",
  },
};
```

### 2. Create Feature Components (if needed)

```typescript
// components/features/{domain}/{feature-name}.tsx
"use client";

import { Button } from "@/components/ui/button";

type MyFeatureProps = { data: SomeType };

export const MyFeature = ({ data }: MyFeatureProps) => {
  // Component logic with hooks, mutations, etc.
  return <div>{/* UI using components/ui */}</div>;
};
```

### 3. Create View

```typescript
// views/{domain}/{page-name}.tsx
import { MyFeature } from "@/components/features/{domain}/{feature-name}";
import { PageLayout } from "@/components/features/dashboard/page-layout";

type MyPageViewProps = { data: SomeType };

export const MyPageView = ({ data }: MyPageViewProps) => (
  <PageLayout title="My Page" desc="Page description.">
    <MyFeature data={data} />
  </PageLayout>
);
```

### 4. Create Page

```typescript
// app/(dashboard)/{route}/page.tsx
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { MyPageView } from "@/views/{domain}/{page-name}";

export const metadata: Metadata = getPageMetadata("myNewPage");

export default async function MyPage() {
  const controller = container.getSomeController();
  const data = await controller.getData();

  return <MyPageView data={data} />;
}
```

### 5. Add to Navigation (if needed)

```typescript
// components/features/dashboard/sidebar/sidebar.constants.tsx
export const SIDEBAR_NAV: SidebarNavGroup[] = [
  {
    title: "Section",
    items: [
      // ... existing items
      { title: "My Page", icon: <Icon />, href: "/my-page" },
    ],
  },
];
```

## Naming Conventions

| Layer             | Pattern              | Example              |
| ----------------- | -------------------- | -------------------- |
| UI Component      | `{name}.tsx`         | `button.tsx`         |
| Feature Component | `{feature-name}.tsx` | `profile-form.tsx`   |
| View              | `{page-name}.tsx`    | `profile.tsx`        |
| Page              | `page.tsx`           | `app/.../page.tsx`   |
| Layout            | `layout.tsx`         | `app/.../layout.tsx` |
| SEO Key           | `camelCase`          | `settingsProfile`    |

## Common Wrappers

**Dashboard pages**: Use `PageLayout`

```typescript
import { PageLayout } from "@/components/features/dashboard/page-layout";

<PageLayout title="Title" desc="Description." className="max-w-full">
  {children}
</PageLayout>
```

**Auth pages**: Use `AuthTemplate`

```typescript
import { AuthTemplate } from "@/components/features/auth/auth-template";

<AuthTemplate
  title="Welcome"
  description={<>Description with <Link href="/signup">link</Link></>}
  form={<SignInForm />}
  footer={<>Terms text</>}
/>
```

**Error pages**: Use `ErrorTemplate`

```typescript
import { ErrorTemplate } from "@/components/features/error/error-template";

<ErrorTemplate
  code={404}
  title="Not Found"
  description="The page doesn't exist."
/>
```

## Data Flow Summary

```
Page (async Server Component)
  ↓ fetches via DI Container (controller)
  ↓ passes data as props
View (export const)
  ↓ composes layout + feature components
Feature Component ("use client")
  ↓ handles interactivity, mutations, forms
UI Component
  ↓ renders primitives
```
