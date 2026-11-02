# Component Catalog

Use this catalog as the first pass before adding UI code. Verify current files
with `rg --files` because the codebase can evolve.

## UI Primitives

`components/ui` contains domain-agnostic building blocks:

| Need           | Existing surface                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Actions        | `Button`, `buttonVariants`                                                                                  |
| Loading        | `Loader`, `Skeleton`                                                                                        |
| Text inputs    | `Input`, `PasswordInput`, `Label`                                                                           |
| Forms          | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useZodForm` |
| Selection      | `Select`, `RadioGroup`, `Switch`, `Checkbox`, `Calendar`, `Popover`, `Command`                              |
| Overlays       | `Dialog`, `Sheet`, `DropdownMenu`, `Tooltip`, `Popover`                                                     |
| Data display   | `Table`, `Badge`, `Avatar`, `Card`, `Chart`                                                                 |
| Layout helpers | `Separator`, `ScrollArea`, `Sidebar`, `Collapsible`                                                         |
| Text and brand | `Typography`, `Logo`                                                                                        |
| Feedback       | `Toaster` from `sonner`                                                                                     |

Rules for `components/ui`:

- Keep primitives domain-agnostic.
- Use Radix/shadcn style composition and CVA variants when a primitive needs
  variants.
- Do not import server functions, feature DTOs, business schemas, translations, or
  app-specific copy.

## Existing Templates And Wrappers

Reuse these before creating new shells:

| Surface                       | Location                                                 | Use for                                                                              |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `SectionTemplate`             | `components/features/dashboard/section-template.tsx`     | Dashboard section shell with page title, description, optional side nav, and content |
| `SectionNavTemplate`          | `components/features/dashboard/section-nav-template.tsx` | Section side nav (links or filters) that collapses to a select on mobile             |
| `PageLayout`                  | `components/features/dashboard/page-layout.tsx`          | Dashboard/settings pages with title, description, separator, and scrollable content  |
| `AuthTemplate`                | `components/features/auth/auth-template.tsx`             | Auth pages with title, description, form, and optional footer                        |
| `ErrorTemplate`               | `components/features/error/error-template.tsx`           | Error pages with code, title, description, and back action                           |
| `FormButton`, `LoadingButton` | `components/features/form/form-button.tsx`               | Submit buttons with loading state                                                    |
| Dashboard sidebar wrappers    | `components/features/dashboard/sidebar/*`                | Dashboard navigation and organization/user sidebar composition                       |
| Changelog components          | `components/features/changelog/*`                        | Changelog list, entry, sidebar, badge, and notification patterns                     |
| `DataTable`                   | `components/features/data-table/data-table.tsx`          | Every server-driven list: URL state, sort, filters, selection, columns, CSV export   |

## Data Tables

Every list screen uses `DataTable` instead of composing `Table`, filters and
pagination by hand. It never fetches: the route validates its search params
with a `createListQuerySchema` schema, loads `PaginatedResult<T>` in its loader
through `loadListData` and passes `query` (`Route.useSearch()`) and `result`
(`null` renders the error state with a retry).

```tsx
<DataTable
  id="admin-users"
  query={query}
  result={users}
  columns={columns}
  filters={filters}
  defaultSort="createdAt.desc"
  getRowId={(user) => user.id}
  emptyMessage={t("users.empty")}
  exportHref="/api/admin/users/export"
  searchPlaceholder={t("users.filters.search")}
  bulkActions={({ rows, clearSelection }) => <BulkButtons users={rows} />}
/>
```

- `columns`: `DataTableColumn<T>[]` with `id`, `header`, `cell`, and optional
  `sortable` (the `id` must be a schema sort field), `hideable`,
  `defaultHidden`, `align` and `cellClassName`. Memoize them with `useMemo`.
- `filters`: `select` and `multiSelect` with `options` (`string` or `boolean`
  values), `text` (debounced) and `dateRange` (the `calendar` primitive); the
  `key` must match a `listFilter` key of the schema.
- `searchPlaceholder` shows the debounced search input bound to `search`.
- `exportHref` adds an export button that sends the current search params to a
  CSV server route, so the export covers the whole filtered set.
- `bulkActions` adds the selection column and renders the caller's actions in
  the selection bar with the selected rows of the current page.
- `toolbar` is a slot for extra toolbar buttons; column visibility is stored per
  `id` in local storage.
- Pending navigations show skeleton rows, an empty `result` shows
  `emptyMessage`, and the layout stacks on mobile with a horizontal scroll.

## Placement Rules

Use the existing TanStack Start route flow:

1. `src/app/{route}.tsx` uses `createFileRoute`, `loader`, `head`, and renders
   a view.
2. `views/{domain}/{page}.tsx` composes templates and feature components.
3. `components/features/{domain}` owns domain UI, interactivity, forms,
   tables, dialogs, and templates.
4. `components/ui` owns reusable primitives only.

When the same structure appears in multiple routes or views, extract a feature
template instead of copying the layout.
