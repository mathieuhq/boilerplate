# i18n Examples

## React Component With Translations

From `components/features/dashboard/form/profile-form.tsx`:

```typescript
import { useTranslations } from "@/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name },
  });

  return (
    <Form form={form} onSubmit={handleSubmit}>
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("name")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <Button type="submit">{tCommon("save")}</Button>
    </Form>
  );
};
```

## Server Helper With Translations

Use server translations from server functions or server-only helpers:

```typescript
import { getTranslations } from "@/i18n/server";

export async function buildEmailSubject() {
  const t = await getTranslations("auth");

  return t("welcomeSubject");
}
```

## Nested Namespace Usage

```typescript
import { useTranslations } from "@/i18n";

export const AvatarForm = ({ user }: AvatarFormProps) => {
  const t = useTranslations("settings.profile.avatar");

  return (
    <div>
      <h2>{t("title")}</h2>
      <p>{t("description")}</p>
      <Button>{t("upload")}</Button>
      <Button variant="destructive">{t("remove")}</Button>
    </div>
  );
};
```

## Provider Setup

`src/app/__root.tsx` loads messages with `getRootI18n()` and passes them to
`I18nProvider` through the app providers.

```typescript
import { I18nProvider } from "@/i18n";

<I18nProvider locale={locale} messages={messages}>
  {children}
</I18nProvider>;
```

## Adding New Translations

### Step 1: Check for existing keys

```bash
rg "\"save\"" messages/en.json messages/fr.json
```

### Step 2: Add to both language files

**messages/en.json:**

```json
{
  "settings": {
    "billing": {
      "title": "Billing",
      "description": "Manage your subscription and payment methods",
      "currentPlan": "Current Plan",
      "changePlan": "Change Plan"
    }
  }
}
```

**messages/fr.json:**

```json
{
  "settings": {
    "billing": {
      "title": "Facturation",
      "description": "Gérez votre abonnement et vos méthodes de paiement",
      "currentPlan": "Plan actuel",
      "changePlan": "Changer de plan"
    }
  }
}
```

### Step 3: Use in component

```typescript
const t = useTranslations("settings.billing");

return (
  <PageLayout title={t("title")} desc={t("description")}>
    <Card>
      <CardTitle>{t("currentPlan")}</CardTitle>
      <Button>{t("changePlan")}</Button>
    </Card>
  </PageLayout>
);
```

## Interpolation

```typescript
const t = useTranslations("organization");

t("inviteMember", { member: "Sam" });
```

Missing interpolation values keep the original `{placeholder}` text so missing
data is visible during development.
