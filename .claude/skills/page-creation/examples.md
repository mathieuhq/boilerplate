---

# Page Creation Examples

Complete examples for different types of pages.

## Example 1: Dashboard Page with Form

Complete implementation of a settings page with form.

### 1. SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  // ... existing
  settingsNotifications: {
    title: "Notification Settings",
    description: "Manage your notification preferences and alerts.",
  },
};
```

### 2. Feature Component (Form)

```typescript
// components/features/dashboard/form/notifications-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { FormButton } from "@/components/features/form/form-button";
import { updateNotificationSettingsAction } from "@/actions/user/user.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";

const schema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
});

type NotificationsFormProps = {
  initialSettings: z.infer<typeof schema>;
};

export const NotificationsForm = ({ initialSettings }: NotificationsFormProps) => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialSettings,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      const result = await updateNotificationSettingsAction(data);
      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Notification settings updated!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-6">
        <FormField
          name="emailNotifications"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div>
                <FormLabel>Email Notifications</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="pushNotifications"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div>
                <FormLabel>Push Notifications</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in browser
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="weeklyDigest"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div>
                <FormLabel>Weekly Digest</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary email
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
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

### 3. View

```typescript
// views/settings/notifications.tsx
import { NotificationsForm } from "@/components/features/dashboard/form/notifications-form";
import { PageLayout } from "@/components/features/dashboard/page-layout";

type NotificationSettingsViewProps = {
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
  };
};

export const NotificationSettingsView = ({
  settings,
}: NotificationSettingsViewProps) => (
  <PageLayout
    title="Notification Settings"
    desc="Manage how you receive notifications and updates."
  >
    <NotificationsForm initialSettings={settings} />
  </PageLayout>
);
```

### 4. Page

```typescript
// app/(dashboard)/settings/notifications/page.tsx
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { NotificationSettingsView } from "@/views/settings/notifications";

export const metadata: Metadata = getPageMetadata("settingsNotifications");

export default async function NotificationsPage() {
  const userController = container.getUserController();
  const settings = await userController.getNotificationSettings();

  return <NotificationSettingsView settings={settings} />;
}
```

---

## Example 2: Auth Page

Complete sign-in page implementation.

### 1. SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  signIn: {
    title: "Sign In",
    description: "Sign in to your account to access your dashboard.",
  },
};
```

### 2. Feature Component (Form)

```typescript
// components/features/auth/form/sign-in-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormButton } from "@/components/features/form/form-button";
import { signInAction } from "@/actions/auth/auth.action";
import { signInSchema } from "@/features/auth/interface/schemas/auth.schema";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";
import type { z } from "zod";

export const SignInForm = () => {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof signInSchema>) => {
      const result = await signInAction(data);
      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Signed in successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormButton loading={isPending} className="w-full">
          Sign In
        </FormButton>
      </form>
    </Form>
  );
};
```

### 3. View

```typescript
// views/auth/sign-in.tsx
import Link from "next/link";

import { AuthTemplate } from "@/components/features/auth/auth-template";
import { SignInForm } from "@/components/features/auth/form/sign-in-form";

export const SignInView = () => (
  <AuthTemplate
    title="Welcome Back"
    description={
      <>
        New to our platform?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </>
    }
    form={<SignInForm />}
    footer={
      <>
        By signing in, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
      </>
    }
  />
);
```

### 4. Page

```typescript
// app/(auth)/signin/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPageMetadata } from "@/lib/seo";
import { auth } from "@/lib/auth";
import { SignInView } from "@/views/auth/sign-in";

export const metadata: Metadata = getPageMetadata("signIn");

export default async function SignInPage() {
  const session = await auth();

  // Redirect if already signed in
  if (session) {
    redirect("/dashboard");
  }

  return <SignInView />;
}
```

---

## Example 3: Admin Page with Table

Admin users list with data table.

### 1. SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  adminUsers: {
    title: "Manage Users",
    description: "View and manage all users in the system.",
  },
};
```

### 2. Feature Component (Table)

```typescript
// components/features/admin/users-table.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "@/actions/admin/admin.action";
import { isActionSuccessful, getActionErrorMessage } from "@/lib/actions/actions-utils";
import type { User } from "@/features/user/domain/entities/user.entity";

type UsersTableProps = {
  users: User[];
};

export const UsersTable = ({ users }: UsersTableProps) => {
  const router = useRouter();

  const { mutate: deleteUser } = useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUserAction({ userId });
      if (!isActionSuccessful(result)) {
        throw new Error(getActionErrorMessage(result));
      }
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      router.refresh(); // Refresh server data
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email.value}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteUser(user.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

### 3. View

```typescript
// views/admin/users.tsx
import { UsersTable } from "@/components/features/admin/users-table";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import type { User } from "@/features/user/domain/entities/user.entity";

type AdminUsersViewProps = {
  users: User[];
  total: number;
};

export const AdminUsersView = ({ users, total }: AdminUsersViewProps) => (
  <PageLayout
    title="Manage Users"
    desc={`${total} users in the system`}
    className="max-w-full"
  >
    <UsersTable users={users} />
  </PageLayout>
);
```

### 4. Page

```typescript
// app/(dashboard)/admin/users/page.tsx
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { container } from "@/shared/infrastructure/di/container";
import { AdminUsersView } from "@/views/admin/users";

export const metadata: Metadata = getPageMetadata("adminUsers");

export default async function AdminUsersPage() {
  const adminController = container.getAdminController();
  const { users, total } = await adminController.listUsers({
    skip: 0,
    take: 50,
  });

  return <AdminUsersView users={users} total={total} />;
}
```

---

## Example 4: Public Page (Marketing)

Simple public landing page.

### 1. SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  home: {
    title: "Welcome to Our Platform",
    description: "The best platform for managing your projects and teams.",
  },
};
```

### 2. Feature Components

```typescript
// components/features/marketing/hero.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const Hero = () => (
  <section className="flex flex-col items-center justify-center py-24 text-center">
    <h1 className="text-5xl font-bold">Welcome to Our Platform</h1>
    <p className="mt-4 text-xl text-muted-foreground">
      The best way to manage your projects
    </p>
    <div className="mt-8 flex gap-4">
      <Button asChild size="lg">
        <Link href="/signup">Get Started</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href="/signin">Sign In</Link>
      </Button>
    </div>
  </section>
);
```

```typescript
// components/features/marketing/features.tsx
export const Features = () => (
  <section className="grid gap-8 py-16 md:grid-cols-3">
    <FeatureCard
      title="Fast"
      description="Lightning-fast performance"
      icon={<ZapIcon />}
    />
    <FeatureCard
      title="Secure"
      description="Enterprise-grade security"
      icon={<LockIcon />}
    />
    <FeatureCard
      title="Scalable"
      description="Grows with your business"
      icon={<TrendingUpIcon />}
    />
  </section>
);
```

### 3. View

```typescript
// views/marketing/home.tsx
import { Hero } from "@/components/features/marketing/hero";
import { Features } from "@/components/features/marketing/features";

export const HomeView = () => (
  <div className="container mx-auto px-4">
    <Hero />
    <Features />
  </div>
);
```

### 4. Page

```typescript
// app/page.tsx
import type { Metadata } from "next";

import { getPageMetadata } from "@/lib/seo";
import { HomeView } from "@/views/marketing/home";

export const metadata: Metadata = getPageMetadata("home");

export default function HomePage() {
  return <HomeView />;
}
```

---

## Example 5: Error Page

Custom 404 error page.

### 1. Feature Component

```typescript
// app/not-found.tsx
import Link from "next/link";
import type { Metadata } from "next";

import { ErrorTemplate } from "@/components/features/error/error-template";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
};

export default function NotFound() {
  return (
    <ErrorTemplate
      code={404}
      title="Page Not Found"
      description="Sorry, we couldn't find the page you're looking for."
      action={
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      }
    />
  );
}
```

---

## Pattern Summary

### Dashboard Page

1. SEO config
2. Form component (with React Hook Form + React Query)
3. View (PageLayout wrapper)
4. Page (fetch via controller)

### Auth Page

1. SEO config
2. Form component (with navigation on success)
3. View (AuthTemplate wrapper)
4. Page (check session, redirect if authenticated)

### Admin Page

1. SEO config
2. Table component (with mutations)
3. View (PageLayout with full width)
4. Page (fetch via admin controller)

### Public Page

1. SEO config
2. Marketing components (hero, features, etc.)
3. View (simple composition)
4. Page (no auth required)

### Error Page

1. Use ErrorTemplate
2. Provide error code, title, description
3. Optional action button
