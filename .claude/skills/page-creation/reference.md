# Page Creation Reference

## Naming Conventions

| Layer             | Pattern              | Example              |
| ----------------- | -------------------- | -------------------- |
| UI Component      | `{name}.tsx`         | `button.tsx`         |
| Feature Component | `{feature-name}.tsx` | `profile-form.tsx`   |
| View              | `{page-name}.tsx`    | `profile.tsx`        |
| Page              | `page.tsx`           | `app/.../page.tsx`   |
| Layout            | `layout.tsx`         | `app/.../layout.tsx` |
| SEO Key           | `camelCase`          | `settingsProfile`    |

## Layer Characteristics

### UI Components (`components/ui/`)

- Domain-agnostic primitives
- Uses Radix UI and CVA variants
- No business logic

### Feature Components (`components/features/{domain}/`)

- `"use client"` directive required
- React Hook Form + Zod for forms
- React Query (`useMutation`) for mutations
- Toast notifications for feedback
- Calls server actions

### Views (`views/{domain}/`)

- Accepts server-fetched data as props
- Composes feature components
- Uses layout wrappers (PageLayout, etc.)
- Can use `getTranslations()` for server i18n

### Pages (`app/{route}/page.tsx`)

- Async server component
- Fetches data via DI Container
- Sets metadata via `getPageMetadata()`
- Renders view with data props

## SEO Configuration

```typescript
// lib/seo.ts
export const SEO_CONFIG: SEOConfig = {
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information.",
  },
  // Add new pages here
};
```

## Common Wrappers

### PageLayout (Dashboard)

```typescript
import { PageLayout } from "@/components/features/dashboard/page-layout";

<PageLayout
  title="Title"
  desc="Description."
  className="max-w-full"
>
  {children}
</PageLayout>
```

### AuthTemplate (Auth pages)

```typescript
import { AuthTemplate } from "@/components/features/auth/auth-template";

<AuthTemplate
  title="Welcome"
  description={<>Description with <Link href="/signup">link</Link></>}
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
Page (async Server Component)
  ↓ fetches via DI Container (controller)
  ↓ passes data as props
View (export const / async function)
  ↓ composes layout + feature components
Feature Component ("use client")
  ↓ handles interactivity, mutations, forms
UI Component
  ↓ renders primitives
```
