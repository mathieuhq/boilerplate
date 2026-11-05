# Page Creation Reference

## Naming Conventions

| Layer             | Pattern               | Example                                             |
| ----------------- | --------------------- | --------------------------------------------------- |
| UI Component      | `{name}.tsx`          | `button.tsx`                                        |
| Feature Component | `{feature-name}.tsx`  | `profile-form.tsx`                                  |
| Template          | `{name}-template.tsx` | `confirm-dialog-template.tsx`                       |
| View              | `{page-name}.tsx`     | `views/settings/profile.tsx`                        |
| Root Route        | `__root.tsx`          | `src/app/__root.tsx`                                |
| Index Route       | `index.tsx`           | `src/app/_dashboard/index.tsx`                      |
| Layout Route      | `_name.tsx`           | `src/app/_dashboard.tsx`                            |
| Section Layout    | `{section}.tsx`       | `src/app/_dashboard/admin.tsx`                      |
| Dynamic Route     | `$param.tsx`          | `src/app/auth/accept-invitation/$invitationId.tsx`  |
| Splat Route       | `$.tsx` / `$.ts`      | `src/app/$.tsx`, `src/app/api/v1/private/auth/$.ts` |
| Server Route      | `{name}.ts`           | `src/app/api/v1/private/admin/users/export.ts`      |
| Route-private     | `-{name}.tsx`         | `src/app/-providers.tsx`                            |
| SEO Key           | `camelCase`           | `settingsProfile`                                   |

## Layer Characteristics

### UI Components (`components/ui/`)

- Domain-agnostic primitives.
- Uses Radix UI and CVA variants.
- No business logic.

### Feature Components (`components/features/{domain}/`)

- React Hook Form + Zod for forms.
- React Query (`useMutation`) for mutations, unwrapping action results with
  `unwrapActionData` (`@/lib/actions/actions-utils`).
- Toast notifications for feedback, `useRouter().refresh()` from
  `@/lib/navigation` to reload route data.
- Calls server functions from `src/server-functions/**`.
- Gates actions with `useAccess().can(feature, level)` or the `access` prop.

### Views (`views/{domain}/`)

- Accept route-loaded data as props (`null` for a list result that failed to
  load).
- Compose layout wrappers and feature components.
- Use `useTranslations()` from `@/i18n`.

### Routes (`src/app/**`)

- Export `Route = createFileRoute(...)` or `createRootRoute(...)`.
- Use `Route.head` for SEO tags from `lib/seo.ts`.
- Use `Route.loader` for page data.
- Use `Route.beforeLoad` for auth redirects and route guards: `_dashboard.tsx`
  calls `requireSession()` and returns `user`, `access` and `impersonation` to
  the route context; child routes call `assertAccess(context.access, feature,
  level)` from `@/lib/access`, which throws a forbidden `HttpError`.
- Use `validateSearch`, `loaderDeps` and `loadListData` for list pages.
- Read the context with `Route.useRouteContext()` and render views from route
  components.

## SEO Configuration

Add a key to `SEO_CONFIG` in `lib/seo.ts`:

```typescript
export const SEO_CONFIG: SEOConfig = {
  settingsProfile: {
    title: "Profile Settings",
    description: "Update your profile information and preferences.",
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

## Access And Navigation

- `ADMIN_PAGES` (`lib/admin-access.ts`) lists each admin page with its `href`,
  access `feature` and navigation `titleKey`. The `/admin` layout throws
  forbidden when no admin page is readable, asserts read access for the current
  page, renders `ForbiddenView` on forbidden errors, and builds its
  `SidebarLayout` from `getAdminPages(access)`; add the page icon to
  `ADMIN_PAGE_ICONS` in `src/app/_dashboard/admin.tsx`.
- `/admin` redirects to `getFirstAdminPage(access)`.
- `NAVIGATION_PAGES` (`lib/navigation.tsx`) feeds the command menu page search;
  it already includes `ADMIN_PAGES`, and entries can require a `feature` or
  `organizationRoles`.
- Settings pages are listed in the `sidebarItems` of
  `src/app/_dashboard/settings.tsx`; the main sidebar comes from
  `useSidebarItems()` in `components/features/dashboard/sidebar/sidebar.constants.tsx`.
- Navigation titles live under the `navigation` message namespace.

## List Pages

```typescript
export const Route = createFileRoute("/_dashboard/admin/users")({
  head: () => ({
    meta: getPageMetaTags("adminUsers"),
  }),
  validateSearch: listAdminUsersSchema,
  search: {
    middlewares: [stripSearchParams({ page: 1, pageSize: DEFAULT_PAGE_SIZE })],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => loadListData(async () => getAdminUsersData(deps)),
  component: AdminUsersPage,
});
```

`loadListData` (`lib/list-loader.ts`) rethrows redirects, not-found,
`UNAUTHORIZED` and `FORBIDDEN` errors and returns `null` for anything else, so
the `DataTable` shows its error state with a retry.

## Common Wrappers

### SectionTemplate (Section layouts)

```typescript
import { SectionTemplate } from "@/components/features/dashboard/section-template";

<SectionTemplate
  title={t("settings")}
  description={t("settingsDescription")}
  nav={<SidebarLayout items={sidebarItems} />}
>
  <Outlet />
</SectionTemplate>
```

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
  title={t("welcomeBack")}
  description={<Link href="/auth/signup">{t("signUp")}</Link>}
  form={<SignInForm callbackUrl={callbackUrl} />}
  footer={t("termsAgreement")}
/>
```

### ErrorTemplate (Error pages)

```typescript
import { ErrorTemplate } from "@/components/features/error/error-template";

<ErrorTemplate
  code={404}
  title={t("notFoundTitle")}
  description={t("notFoundDescription")}
/>
```

## Data Flow

```
TanStack route
  ↓ guards with beforeLoad (requireSession, assertAccess)
  ↓ validates search params with validateSearch for lists
  ↓ loads data with loader/server functions (loadListData for lists)
View
  ↓ composes layout + feature components
Feature component
  ↓ handles interactivity, mutations, forms
UI component
  ↓ renders primitives
```
