---
name: page-creation
description: TanStack Start routes, views, feature components, UI components, route head SEO, loaders, access guards, list pages with DataTable, PageLayout, SectionTemplate, AuthTemplate, and route composition. Use when creating or changing pages, views, component hierarchy, navigation, admin pages, or page-level data flow.
---

# Page Creation

## Workflow

- Add SEO metadata in `lib/seo.ts` and expose it from the route with `Route.head`.
- Keep TanStack Start routes in `src/app/` with `createFileRoute`.
- Load page data in route `loader` functions, usually through server functions.
- Guard dashboard pages through the `_dashboard` layout (`requireSession` returns `user`, `access` and `impersonation` in the route context) and call `assertAccess(context.access, feature, level)` in `beforeLoad` when a page needs a feature.
- List admin pages with their feature in `ADMIN_PAGES` (`lib/admin-access.ts`); the `/admin` layout enforces read access and builds its side nav from it.
- Build list pages with a `createListQuerySchema` schema as `validateSearch`, `loaderDeps: ({ search }) => search`, `loader: ({ deps }) => loadListData(() => fn(deps))`, and a feature `DataTable`.
- Put view composition in `views/{domain}/`.
- Put interactive feature UI in `components/features/{domain}/`.
- Reuse `components/ui/` primitives and existing wrappers such as `SectionTemplate`, `PageLayout`, `AuthTemplate`, and `ErrorTemplate` (see `$compose-ui`).
- Add navigation only when the route should be discoverable from existing menus, and add it to `NAVIGATION_PAGES` (`lib/navigation.tsx`) so the command menu finds it.

## Resources

- Read [references/reference.md](references/reference.md) for layer naming, SEO setup, wrappers, and page data flow.
- Read [references/examples.md](references/examples.md) for complete page, auth page, protected layout, list page, and upload component examples.

## Boundaries

- Use `$compose-ui` before adding or changing UI components.
- Use `$i18n` for translated UI copy.
- Use `$api-patterns` for server functions or server routes used by the page.
- Use `$storage` when page work includes upload/download flows.
