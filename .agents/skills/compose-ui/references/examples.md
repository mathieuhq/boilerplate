# Compose UI Examples

## Good Patterns

### Reuse a page template

Use `PageLayout` for dashboard settings pages that share the same title,
description, separator, and scrollable content structure.

```tsx
<PageLayout title={t("title")} desc={t("description")}>
  <ProfileForm user={user} />
</PageLayout>
```

### Extract a template for repeated layout

When two settings sections share title, description, optional actions, and
content spacing, extract a domain template.

```tsx
type SettingsSectionTemplateProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export const SettingsSectionTemplate = ({
  title,
  description,
  actions,
  children,
}: SettingsSectionTemplateProps) => (
  <section className="space-y-4 border-t pt-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h4 className="text-base font-medium">{title}</h4>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
    {children}
  </section>
);
```

### Reuse dialog primitives

Use the existing dialog parts for confirmations.

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant="destructive" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Keep one-off composition local

If a layout appears once and has no clear reuse path, keep it in the view or
feature component instead of naming a wrapper around CSS.

## Bad Patterns

### Do not wrap a variant with a new name

Avoid this:

```tsx
export const PrimaryButton = (props: ButtonProps) => (
  <Button variant="default" {...props} />
);
```

Use this:

```tsx
<Button variant="default">Save</Button>
```

### Do not create generic shells for one use

Avoid components such as `DashboardCard`, `CenteredPage`, `ModalWrapper`, or
`ProfileCard` when they only name a small set of Tailwind classes.

### Do not put domain behavior in `components/ui`

Avoid importing actions, DTOs, translations, toast calls, or feature schemas
from a UI primitive. Move that code to `components/features/{domain}`.

### Do not duplicate repeated page structure

If two auth, settings, or error screens share the same shell, use the existing
template or extract a new template with slot props.
