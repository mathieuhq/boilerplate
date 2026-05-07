---
name: page-creation
description: TanStack Start routes, views, feature components, UI components, route head SEO, loaders, PageLayout, AuthTemplate, and route composition. Use when creating or changing pages, views, component hierarchy, navigation, or page-level data flow.
---

# Page Creation

## Workflow

- Add SEO metadata in `lib/seo.ts` and expose it from the route with `Route.head`.
- Keep TanStack Start routes in `src/app/` with `createFileRoute`.
- Load page data in route `loader` functions, usually through server functions.
- Put view composition in `views/{domain}/`.
- Put interactive feature UI in `components/features/{domain}/`.
- Reuse `components/ui/` primitives and existing wrappers such as `PageLayout`, `AuthTemplate`, and `ErrorTemplate`.
- Add navigation only when the route should be discoverable from existing menus.

## Resources

- Read [references/reference.md](references/reference.md) for layer naming, SEO setup, wrappers, and page data flow.
- Read [references/examples.md](references/examples.md) for complete page, auth page, error page, and upload component examples.

## Boundaries

- Use `$i18n` for translated UI copy.
- Use `$api-patterns` for server functions or server routes used by the page.
- Use `$storage` when page work includes upload/download flows.
