---
name: page-creation
description: Next.js App Router pages, views, feature components, UI components, metadata, SEO, PageLayout, AuthTemplate, and route composition. Use when creating or changing pages, views, component hierarchy, navigation, or page-level data flow.
---

# Page Creation

## Workflow

- Add SEO metadata in `lib/seo.ts` and use `getPageMetadata()` from the page.
- Keep App Router pages in `app/` as server components that load data and compose views.
- Put view composition in `views/{domain}/`.
- Put interactive feature UI in `components/features/{domain}/` with `"use client"` only where needed.
- Reuse `components/ui/` primitives and existing wrappers such as `PageLayout`, `AuthTemplate`, and `ErrorTemplate`.
- Add navigation only when the route should be discoverable from existing menus.

## Resources

- Read [references/reference.md](references/reference.md) for layer naming, SEO setup, wrappers, and page data flow.
- Read [references/examples.md](references/examples.md) for complete page, auth page, error page, and upload component examples.

## Boundaries

- Use `$i18n` for translated UI copy.
- Use `$api-patterns` for server actions or API routes used by the page.
- Use `$storage` when page work includes upload/download flows.
