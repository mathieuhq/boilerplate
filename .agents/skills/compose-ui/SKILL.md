---
name: compose-ui
description: Strict UI composition and reuse workflow for this TanStack Start app. Use when creating or changing UI pages, views, layouts, templates, forms, dialogs, tables, feature components, shared components, or deciding whether to introduce a new component; requires inventorying existing primitives and wrappers first, then extracting templates for repeated layouts.
---

# Compose UI

## Workflow

Use this skill before implementing any UI change. The default rule is:
reuse first, compose second, create only with proof.

1. Inventory the existing UI surface before editing:
   - Search `components/ui`, `components/features`, `views`, and nearby
     route files.
   - Read `references/component-catalog.md` for current primitives,
     templates, wrappers, and layer boundaries.
   - Read `references/examples.md` when deciding whether a new component or
     template is justified.
2. Choose the smallest existing surface that fits:
   - Use `components/ui` primitives for controls and visual structure.
   - Use existing feature templates and wrappers before creating another shell.
   - Keep one-off layout as local JSX in the view or feature component.
   - Add a feature component only for meaningful behavior, domain composition,
     or repeated UI.
3. Gate every new component:
   - Confirm no existing primitive, wrapper, template, or small composition fits.
   - Confirm the component has a stable reason to exist beyond naming CSS.
   - Place it in the right layer before coding.
   - Keep props slot-based and minimal; avoid passing full business models when
     simple text or `ReactNode` slots are enough.

## Template Extraction

Extract a template when a layout or UI structure is used at least twice, or when
one current use clearly represents a pattern planned for multiple screens.

- Name templates `{domain-or-purpose}-template.tsx`.
- Export templates with `export const XxxTemplate = (...) => ...`.
- Put domain templates in `components/features/{domain}/{name}-template.tsx`.
- Expose simple slots such as `title`, `description`, `children`, `form`,
  `footer`, and `actions`.
- Keep templates free of fetching, mutations, toast calls, and business logic.
- Avoid `"use client"` in templates unless the template itself owns client-only
  behavior.
- For cross-domain layout, reuse an existing shared feature wrapper first. Move
  to `components/ui` only when the abstraction is truly domain-agnostic and has
  no business semantics.

## Layer Rules

- `src/app/`: route files, route head metadata, loaders, guards, server route
  handlers, and view composition.
- `views/{domain}/`: server-side page composition and layout/template usage.
- `components/features/{domain}/`: interactive or domain-specific UI,
  templates, wrappers, forms, tables, and composed sections.
- `components/ui/`: domain-agnostic primitives only; no app copy, fetches,
  mutations, toasts, server functions, or domain DTOs.

## Reuse Rules

- Prefer variants or `className` on existing primitives over new wrapper names
  such as `PrimaryButton`, `DashboardCard`, or `ModalWrapper`.
- Prefer `DialogHeader`, `DialogFooter`, `DialogTitle`, and
  `DialogDescription` over a bespoke confirmation shell unless that shell is
  reused.
- Prefer existing form primitives and `FormButton` for form actions.
- Prefer `PageLayout`, `AuthTemplate`, and `ErrorTemplate` for matching page
  structures.
- Build every list screen with `DataTable` and a `createListQuerySchema`
  route schema (see the Data Tables section of the catalog) instead of a bespoke
  table, filter form or pagination.
- If duplicate layout appears while implementing a change, extract the template
  in the same change rather than adding another copy.
