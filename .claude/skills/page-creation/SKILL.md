---
name: page-creation
description: "Four-layer page architecture: UI components, feature components, views, and Next.js pages. SEO configuration with metadata. Use when creating new pages, adding routes, building page layouts, or structuring UI component hierarchy."
---

## Architecture Overview

The codebase uses a **4-layer architecture** for pages, separating concerns and promoting reusability.

```
UI Components (components/ui/)
         ↓ composed by
Feature Components (components/features/)
         ↓ composed by
Views (views/)
         ↓ composed by
Pages (app/)
```

Each layer has a specific responsibility and dependency flow.

---

## Layer 1: UI Components

**Path**: `components/ui/`

Base, reusable primitives using Radix UI and CVA variants. **Domain-agnostic**.

### Characteristics

- No business logic
- Use CVA for variants
- Radix UI for accessibility
- Export composable sub-components
- Highly reusable

### Example

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("inline-flex items-center justify-center", {
  variants: {
    variant: {
      default: "bg-primary text-white",
      outline: "border border-input",
    },
    size: {
      default: "h-10 px-4",
      sm: "h-8 px-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export const Button = ({ variant, size, children, ...props }: ButtonProps) => (
  <button className={buttonVariants({ variant, size })} {...props}>
    {children}
  </button>
);
```

---

## Layer 2: Feature Components

**Path**: `components/features/{domain}/`

Domain-specific components combining UI components into functional units.

### Characteristics

- `"use client"` directive for interactivity
- React Hook Form + Zod validation
- React Query (useMutation) for mutations
- Server Actions for API calls
- Toast notifications for feedback
- Business logic and state management

### Example

```typescript
// components/features/dashboard/form/profile-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormButton } from "@/components/features/form/form-button";
import { updateUserProfileAction } from "@/actions/user/user.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";
import { updateUserProfileSchema } from "@/features/user/interface/schemas/user.schema";
import type { AuthUser } from "@/types/auth-user";

type ProfileFormProps = {
  user: AuthUser;
};

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const form = useForm({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data) => {
      const result = await updateUserProfileAction(data);
      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))}>
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormButton loading={isPending}>Save Changes</FormButton>
      </form>
    </Form>
  );
};
```

---

## Layer 3: Views

**Path**: `views/{domain}/`

Page-level compositions that accept server-fetched data.

### Characteristics

- `export const` arrow function
- Accept typed props from page
- Use `PageLayout` wrapper for dashboard pages
- Use `AuthTemplate` wrapper for auth pages
- Compose feature components
- No data fetching (data comes from pages)

### Example

```typescript
// views/settings/profile.tsx
import { ProfileForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export const ProfileSettingsView = ({ user }: ProfileSettingsViewProps) => (
  <PageLayout
    title="Profile Settings"
    desc="Update your profile information."
  >
    <ProfileForm user={user} />
  </PageLayout>
);
```

---

## Layer 4: Pages

**Path**: `app/{route}/page.tsx`

Next.js App Router pages fetching data and rendering views.

### Characteristics

- Async Server Component
- Fetch data via DI Container
- Set metadata via `getPageMetadata()`
- Render View with server data
- No UI logic (delegate to views)

### Example

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

---

## Step-by-Step Page Creation Guide

### Step 1: Add SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  // ... existing entries
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information and preferences.",
  },
};
```

### Step 2: Create Feature Components (if needed)

```typescript
// components/features/dashboard/form/profile-form.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileFormProps = {
  user: AuthUser;
};

export const ProfileForm = ({ user }: ProfileFormProps) => {
  // Component logic with hooks, mutations, forms
  return (
    <form>
      {/* UI using components/ui */}
    </form>
  );
};
```

### Step 3: Create View

```typescript
// views/settings/profile.tsx
import { ProfileForm } from "@/components/features/dashboard/form/profile-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { AuthUser } from "@/types/auth-user";

type ProfileSettingsViewProps = {
  user: AuthUser;
};

export const ProfileSettingsView = ({ user }: ProfileSettingsViewProps) => (
  <PageLayout title="Profile Settings" desc="Update your profile.">
    <ProfileForm user={user} />
  </PageLayout>
);
```

### Step 4: Create Page

```typescript
// app/(dashboard)/settings/profile/page.tsx
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { ProfileSettingsView } from "@/views/settings/profile";

export const metadata: Metadata = getPageMetadata("settingsProfile");

export default async function ProfilePage() {
  const controller = container.getUserController();
  const user = await controller.getCurrentUserProfile();

  return <ProfileSettingsView user={user} />;
}
```

### Step 5: Add to Navigation (if needed)

```typescript
// components/features/dashboard/sidebar/sidebar.constants.tsx
export const SIDEBAR_NAV: SidebarNavGroup[] = [
  {
    title: "Settings",
    items: [
      // ... existing items
      { title: "Profile", icon: <UserIcon />, href: "/settings/profile" },
    ],
  },
];
```

---

## Naming Conventions

| Layer             | Pattern              | Example              |
| ----------------- | -------------------- | -------------------- |
| UI Component      | `{name}.tsx`         | `button.tsx`         |
| Feature Component | `{feature-name}.tsx` | `profile-form.tsx`   |
| View              | `{page-name}.tsx`    | `profile.tsx`        |
| Page              | `page.tsx`           | `app/.../page.tsx`   |
| Layout            | `layout.tsx`         | `app/.../layout.tsx` |
| SEO Key           | `camelCase`          | `settingsProfile`    |

---

## Common Wrappers

### Dashboard Pages: `PageLayout`

```typescript
import { PageLayout } from "@/components/features/dashboard/page-layout";

export const MyView = () => (
  <PageLayout
    title="Page Title"
    desc="Page description text."
    className="max-w-full" // Optional custom width
  >
    {children}
  </PageLayout>
);
```

### Auth Pages: `AuthTemplate`

```typescript
import { AuthTemplate } from "@/components/features/auth/auth-template";
import Link from "next/link";

export const SignInView = () => (
  <AuthTemplate
    title="Welcome Back"
    description={
      <>
        New here? <Link href="/signup">Create an account</Link>
      </>
    }
    form={<SignInForm />}
    footer={<>By signing in, you agree to our Terms</>}
  />
);
```

### Error Pages: `ErrorTemplate`

```typescript
import { ErrorTemplate } from "@/components/features/error/error-template";

export const NotFoundView = () => (
  <ErrorTemplate
    code={404}
    title="Page Not Found"
    description="The page you're looking for doesn't exist."
  />
);
```

---

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

**Key principle**: Data flows down, events bubble up.

---

## When to Create Each Layer

### Create UI Component When:

- Need a reusable primitive (button, input, card)
- Component is domain-agnostic
- Want to standardize design system
- **Example**: Custom dropdown, styled badge

### Create Feature Component When:

- Need domain-specific logic (form handling, data display)
- Require client-side interactivity
- Handle mutations or complex state
- **Example**: Profile form, user list table

### Create View When:

- Building a complete page layout
- Composing multiple feature components
- Need page-level structure
- **Example**: Settings page, dashboard view

### Create Page When:

- Adding a new route to the application
- Need server-side data fetching
- Setting up metadata/SEO
- **Example**: `/settings/profile`, `/admin/users`

---

## Examples by Use Case

See [examples.md](./examples.md) for complete examples including:
- Dashboard pages with forms
- Auth pages with templates
- Admin pages with tables
- Public pages with static content
- Error pages and layouts
