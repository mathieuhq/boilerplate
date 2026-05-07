# Page Creation Reference

## Naming Conventions

| Layer             | Pattern              | Example                         |
| ----------------- | -------------------- | ------------------------------- |
| UI Component      | `{name}.tsx`         | `button.tsx`                    |
| Feature Component | `{feature-name}.tsx` | `profile-form.tsx`              |
| View              | `{page-name}.tsx`    | `profile.tsx`                   |
| Root Route        | `__root.tsx`         | `src/app/__root.tsx`            |
| Index Route       | `index.tsx`          | `src/app/index.tsx`             |
| Layout Route      | `_name.tsx`          | `src/app/_dashboard.tsx`        |
| Dynamic Route     | `$param.tsx`         | `src/app/auth/$invitationId.tsx` |
| Splat Route       | `$.ts`               | `src/app/api/storage/$.ts`      |
| SEO Key           | `camelCase`          | `settingsProfile`               |

## Layer Characteristics

### UI Components (`components/ui/`)

- Domain-agnostic primitives.
- Uses Radix UI and CVA variants.
- No business logic.

### Feature Components (`components/features/{domain}/`)

- React Hook Form + Zod for forms.
- React Query (`useMutation`) for mutations.
- Toast notifications for feedback.
- Calls server functions from `src/server-functions/**`.

### Views (`views/{domain}/`)

- Accept route-loaded data as props.
- Compose layout wrappers and feature components.
- Use `useTranslations()` from `@/i18n`.

### Routes (`src/app/**`)

- Export `Route = createFileRoute(...)` or `createRootRoute(...)`.
- Use `Route.head` for SEO tags from `lib/seo.ts`.
- Use `Route.loader` for page data.
- Use `Route.beforeLoad` for auth redirects and route guards.
- Render views from route components.

## SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information.",
  },
};
```

Route usage:

```typescript
export const Route = createFileRoute("/_dashboard/settings/profile")({
  head: () => ({
    meta: getPageMetaTags("settingsProfile"),
  }),
  component: ProfilePage,
});
```

## Common Wrappers

### PageLayout (Dashboard)

```typescript
import { PageLayout } from "@/components/features/dashboard/page-layout";

<PageLayout title="Title" desc="Description." className="max-w-full">
  {children}
</PageLayout>
```

### AuthTemplate (Auth pages)

```typescript
import { AuthTemplate } from "@/components/features/auth/auth-template";

<AuthTemplate
  title="Welcome"
  description={<>Description with <Link href="/auth/signup">link</Link></>}
  form={<SignInForm />}
  footer={<>Terms text</>}
/>
```

### ErrorTemplate (Error pages)

```typescript
import { ErrorTemplate } from "@/components/features/error/error-template";

<ErrorTemplate
  code={404}
  title="Not Found"
  description="The page doesn't exist."
/>
```

## Data Flow

```
TanStack route
  ↓ guards with beforeLoad when needed
  ↓ loads data with loader/server functions
View
  ↓ composes layout + feature components
Feature component
  ↓ handles interactivity, mutations, forms
UI component
  ↓ renders primitives
```
