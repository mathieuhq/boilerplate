# i18n Examples

## Client Component with Translations

From `components/features/dashboard/form/profile-form.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
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

## Server Component with Translations

From `views/settings/profile.tsx`:

```typescript
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/features/dashboard/page-layout";
import { ProfileForm } from "@/components/features/dashboard/form/profile-form";

export async function ProfileSettingsView({ user }: ProfileSettingsViewProps) {
  const t = await getTranslations("settings.profile");

  return (
    <PageLayout title={t("title")} desc={t("description")}>
      <ProfileForm user={user} />
    </PageLayout>
  );
}
```

## Nested Namespace Usage

From `components/features/dashboard/form/avatar-form.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";

export const AvatarForm = ({ user }: AvatarFormProps) => {
  // Using nested namespace: settings.profile.avatar
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

## Auth Component with Translations

From `components/features/auth/auth-dropdown-logout.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";

export const AuthDropdownLogout = () => {
  const t = useTranslations("auth");

  return (
    <DropdownMenuItem onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      {t("logOut")}
    </DropdownMenuItem>
  );
};
```

## Adding New Translations

### Step 1: Check for existing keys

```bash
# Search in en.json
grep -r "save" messages/en.json
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

## Using Helper Functions

```typescript
import {
  isValidLocale,
  getLocaleDisplayName,
  getLocaleFlag,
} from "@/lib/i18n";

export const LanguageSelector = () => {
  const locales = ["en", "fr"];

  return (
    <Select>
      {locales.map((locale) => (
        <SelectItem key={locale} value={locale}>
          {getLocaleFlag(locale)} {getLocaleDisplayName(locale)}
        </SelectItem>
      ))}
    </Select>
  );
};

// Output:
// 🇺🇸 English
// 🇫🇷 Français
```

## Form Validation Messages

```typescript
const schema = z.object({
  email: z.string().email(t("validation.invalidEmail")),
  password: z.string().min(8, t("validation.passwordTooShort")),
});
```

**messages/en.json:**
```json
{
  "auth": {
    "validation": {
      "invalidEmail": "Please enter a valid email address",
      "passwordTooShort": "Password must be at least 8 characters"
    }
  }
}
```
