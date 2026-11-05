# i18n Examples

## React Component With Translations

From `components/features/dashboard/form/profile-form.tsx`:

```typescript
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { useTranslations } from "@/i18n";
import { zodResolver } from "@hookform/resolvers/zod";

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");

  const accountFormSchema = useMemo(() => createAccountFormSchema(t), [t]);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  return (
    <Form form={form} onSubmit={async (v) => mutate(v)}>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("name")}</FormLabel>
            <FormControl>
              <Input placeholder={t("namePlaceholder")} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormButton loading={isSaving} type="submit">
        {tCommon("updateAccount")}
      </FormButton>
    </Form>
  );
};
```

## Validation Messages

Build the Zod schema from the translator so messages follow the user's locale:

```typescript
const createAccountFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z
      .string()
      .min(2, { message: t("validation.nameMinLength") })
      .max(30, { message: t("validation.nameMaxLength") }),
    email: z.email({ message: t("validation.emailRequired") }),
  });
```

## Server Route With Translations

From `src/app/api/v1/private/admin/users/export.ts`, translating CSV headers for the
current request:

```typescript
import { getTranslations } from "@/i18n/server";

const [batches, t] = await Promise.all([
  container
    .getAdminController()
    .exportUsers({ actorUserId: ctx.user.id, query }),
  getTranslations("admin.export.users"),
]);

return csvResponse(
  createCsvStream(getAdminUserCsvColumns(t), batches),
  "users",
);
```

## Translations Outside A Request

Jobs and adapters have no request to resolve a locale from, so they build a
translator from the user's language, as
`src/features/user/infrastructure/adapters/data-export-i18n.ts` does:

```typescript
import { getMessages } from "@/i18n/messages";
import { languageToLocale } from "@/i18n/routing";
import { createTranslator } from "@/i18n/translator";

const locale = languageToLocale(user.language);
const t = createTranslator(getMessages(locale), "dataExport.email");

t("subject");
```

## Nested Namespace Usage

```typescript
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { replaceUserAvatarAction } from "@/server-functions/storage.functions";

export const AvatarForm = ({
  user,
  onUploadSuccessAction,
}: AvatarFormProps) => {
  const t = useTranslations("settings.profile.avatar");

  const { mutate } = useMutation({
    mutationFn: async (file: File) =>
      unwrapActionData(await replaceUserAvatarAction(file)).key,
    onSuccess: (key) => {
      toast.success(t("updated"));
      onUploadSuccessAction?.(key);
    },
    onError: (error: Error) => toast.error(error.message || t("uploadError")),
  });
};
```

## Provider Setup

`src/app/__root.tsx` loads messages with `getRootI18n()` and passes them to
`I18nProvider` through `src/app/-providers.tsx`.

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
const t = useTranslations("organization.activity");

t("description", { organization: organization.name });
```

Missing interpolation values keep the original `{placeholder}` text so missing
data is visible during development.
