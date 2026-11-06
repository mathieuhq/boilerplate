# Component Catalog

Use this catalog as the first pass before adding UI code. Verify current files
with `rg --files` because the codebase can evolve.

## UI Primitives

`components/ui` contains domain-agnostic building blocks:

| Need           | Existing surface                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Actions        | `Button`, `buttonVariants`                                                                                  |
| Loading        | `Loader`, `Skeleton`                                                                                        |
| Text inputs    | `Input`, `Label`                                                                                            |
| Forms          | `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useZodForm` |
| Selection      | `Select`, `RadioGroup`, `Switch`, `Checkbox`, `Calendar`, `Command`                                         |
| Overlays       | `Dialog`, `Sheet`, `DropdownMenu`, `Tooltip`, `Popover`, `CommandDialog`                                    |
| Navigation     | `Tabs`, `Sidebar` (with `SidebarProvider` and `useSidebar`)                                                 |
| Data display   | `Table`, `Badge`, `Avatar`, `Card`, `ChartContainer`, `ChartTooltip`, `ChartLegend`                         |
| Layout helpers | `Separator`, `ScrollArea`, `Collapsible`                                                                    |
| Text and brand | `Typography`, `Logo`                                                                                        |
| Feedback       | `Toaster` (`components/ui/sonner`, mounted once in `src/app/-providers.tsx`), `toast` from `sonner`         |

Rules for `components/ui`:

- Keep primitives domain-agnostic.
- Use Radix/shadcn style composition and CVA variants when a primitive needs
  variants.
- Do not import server functions, feature DTOs, business schemas, translations, or
  app-specific copy.

## Existing Templates And Wrappers

Reuse these before creating new shells:

| Surface                        | Location                                                                | Use for                                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `SectionTemplate`              | `components/features/dashboard/section-template.tsx`                    | Dashboard section shell with page title, description, optional side nav, and content                                            |
| `SectionNavTemplate`           | `components/features/dashboard/section-nav-template.tsx`                | Section side nav (links or filters) that collapses to a select on mobile                                                        |
| `SidebarLayout`                | `components/features/dashboard/sidebar/sidebar-layout.tsx`              | `SectionNavTemplate` bound to the pathname, used as `nav` by the settings and admin layouts                                     |
| `PageLayout`                   | `components/features/dashboard/page-layout.tsx`                         | Dashboard/settings pages with title, description, separator, and scrollable content                                             |
| `ConfirmDialogTemplate`        | `components/features/dashboard/confirm-dialog-template.tsx`             | Confirm/cancel dialog with `pending` and `destructive` states; the caller owns the mutation                                     |
| `AuthTemplate`                 | `components/features/auth/auth-template.tsx`                            | Auth pages with title, description, form, and optional footer                                                                   |
| `ErrorTemplate`                | `components/features/error/error-template.tsx`                          | Error pages with code, title, description, and back action                                                                      |
| `FormButton`, `LoadingButton`  | `components/features/form/form-button.tsx`                              | Submit and action buttons with loading state                                                                                    |
| `DataTable`                    | `components/features/data-table/data-table.tsx`                         | Every server-driven list: URL state, sort, filters, selection, columns, CSV export                                              |
| Dashboard sidebar and header   | `components/features/dashboard/sidebar/*`                               | `DashboardSidebar`, `SidebarHeader`, organization switcher, user menu, `useSidebarItems`                                        |
| `CommandMenu`, `CommandSearch` | `components/features/dashboard/command/*`                               | Global search dialog (mounted by `SearchProvider`, opened with Cmd/Ctrl+K) and its trigger                                      |
| `SearchHighlight`              | `components/features/dashboard/command/search-highlight.tsx`            | Accent and case insensitive match highlighting for a `text` and `term`                                                          |
| `NotificationBell`             | `components/features/notification/notification-bell.tsx`                | In-app notifications popover in the dashboard header, fed by `useNotifications` over SSE                                        |
| `ImpersonationBanner`          | `components/features/dashboard/impersonation-banner.tsx`                | Sticky banner with stop action, rendered by the `_dashboard` layout while impersonating                                         |
| `AdminImpersonateUserButton`   | `components/features/dashboard/admin/admin-impersonate-user-button.tsx` | Row action that confirms and starts impersonation, hidden without `impersonation` write access                                  |
| Admin tables and cards         | `components/features/dashboard/admin/*`                                 | `AdminUsersTable`, `AdminOrganizationsTable`, `AdminAuditLogsTable`, `AdminRolesTable`, metrics and registrations chart         |
| `OrganizationActivityTable`    | `components/features/dashboard/organization/*`                          | Organization audit log `DataTable`; `OrganizationMembersTable` lists members and invitations                                    |
| Settings forms                 | `components/features/dashboard/form/*`                                  | `ProfileForm`, `AvatarForm`, `DataExportForm`, `SessionsForm`, `PasskeysForm`, `NotificationsForm`, organization and role forms |
| Changelog components           | `components/features/changelog/*`                                       | Changelog list, entry, sidebar, badge, and notification patterns                                                                |

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
  exportHref="/api/v1/private/admin/users/export"
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
- `onRetry` overrides the error state retry, which invalidates the router by
  default.
- Pending navigations show skeleton rows, an empty `result` shows
  `emptyMessage`, and the layout stacks on mobile with a horizontal scroll.
- Its parts (`DataTableToolbar`, `DataTablePagination`, `DataTableFilterControl`,
  `DataTableSearchInput`, `useDataTableNavigation`) are internal; extend
  `DataTable` rather than composing them in a feature.

## Placement Rules

Use the existing TanStack Start route flow:

1. `src/app/{route}.tsx` uses `createFileRoute`, `head`, `beforeLoad` guards,
   `validateSearch` and `loaderDeps` for list pages, `loader`, and renders a
   view.
2. `views/{domain}/{page}.tsx` composes templates and feature components.
3. `components/features/{domain}` owns domain UI, interactivity, forms,
   tables, dialogs, and templates.
4. `components/ui` owns reusable primitives only.

When the same structure appears in multiple routes or views, extract a feature
template instead of copying the layout.
