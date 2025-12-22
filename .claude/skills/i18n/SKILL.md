---
name: i18n
description: "Internationalization with next-intl for English and French locales. Translation file structure, useTranslations hook for client components, getTranslations for server components, locale detection, and helper functions. Use when adding translations, internationalizing components, or handling multi-language content."
---

## Overview

The application supports internationalization using `next-intl` with English (en) and French (fr) locales.

**Stack:**
- Library: `next-intl`
- Locales: `en` (English), `fr` (French)
- Default locale: `en`
- Locale detection: Database preference (authenticated) → Browser header (anonymous) → Default

---

## File Structure

```
messages/
├── en.json         # English translations
└── fr.json         # French translations

i18n/
├── routing.ts      # Locale configuration
├── request.ts      # Server-side locale detection
└── navigation.ts   # Localized navigation utilities

lib/
└── i18n.ts         # Helper functions and re-exports
```

---

## Message File Structure

Organize translations by domain using nested objects:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create"
  },
  "auth": {
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "email": "Email",
    "password": "Password",
    "validation": {
      "invalidEmail": "Invalid email format",
      "passwordTooShort": "Password must be at least 8 characters"
    }
  },
  "navigation": {
    "home": "Home",
    "dashboard": "Dashboard",
    "settings": "Settings"
  },
  "errors": {
    "notFound": "Not found",
    "unauthorized": "Unauthorized",
    "serverError": "Server error"
  },
  "settings": {
    "profile": {
      "title": "Profile Settings",
      "description": "Update your profile information",
      "name": "Name",
      "email": "Email"
    },
    "notifications": {
      "title": "Notifications",
      "emailNotifications": "Email Notifications",
      "pushNotifications": "Push Notifications"
    },
    "billing": {
      "title": "Billing",
      "plan": "Plan",
      "subscription": "Subscription"
    }
  }
}
```

---

## Key Naming Conventions

| Pattern                     | Example                        | Use Case            |
| --------------------------- | ------------------------------ | ------------------- |
| `{domain}.{key}`            | `common.save`                  | Simple keys         |
| `{domain}.{section}.{key}`  | `settings.profile.name`        | Nested sections     |
| `{domain}.validation.{key}` | `auth.validation.invalidEmail` | Validation messages |

---

## Usage in Components

### Client Components (`"use client"`)

```typescript
"use client";

import { useTranslations } from "next-intl";

export const ProfileForm = () => {
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");

  return (
    <form>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <label>{t("name")}</label>
      <input type="text" />
      <button>{tCommon("save")}</button>
    </form>
  );
};
```

### Server Components

```typescript
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const t = await getTranslations("settings.profile");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### Multiple Namespaces

```typescript
"use client";

import { useTranslations } from "next-intl";

export const SettingsPage = () => {
  const tProfile = useTranslations("settings.profile");
  const tNotifications = useTranslations("settings.notifications");
  const tCommon = useTranslations("common");

  return (
    <div>
      <section>
        <h2>{tProfile("title")}</h2>
        <p>{tProfile("description")}</p>
      </section>
      <section>
        <h2>{tNotifications("title")}</h2>
        <p>{tNotifications("emailNotifications")}</p>
      </section>
      <button>{tCommon("save")}</button>
    </div>
  );
};
```

---

## Avoiding Duplicates

**CRITICAL**: Before adding a new translation key, check if it already exists.

### Common Reusable Keys (Always check these first)

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "update": "Update",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "noResults": "No results found",
    "search": "Search",
    "filter": "Filter",
    "goBack": "Go Back",
    "backToHome": "Back to Home"
  },
  "auth": {
    "email": "Email",
    "password": "Password",
    "name": "Name"
  }
}
```

### When to Create Domain-Specific Keys

- Context-specific wording (e.g., `settings.billing.plan` vs generic "plan")
- Validation messages tied to specific forms
- Section titles that match navigation labels
- Business-specific terminology

### Example: Reusing vs Creating

```typescript
// ❌ Don't create duplicate keys
{
  "settings": {
    "profile": {
      "saveButton": "Save",  // Duplicate of common.save
      "cancelButton": "Cancel"  // Duplicate of common.cancel
    }
  }
}

// ✅ Reuse existing keys
const t = useTranslations("settings.profile");
const tCommon = useTranslations("common");

<button>{tCommon("save")}</button>
<button>{tCommon("cancel")}</button>
```

---

## Locale Detection Priority

1. **Authenticated users**: Language preference from database (`user.language`)
2. **Anonymous users**: Browser `Accept-Language` header
3. **Fallback**: Default locale (`en`)

```typescript
// i18n/request.ts
export default getRequestConfig(async () => {
  const session = await auth();

  // 1. Check user preference
  if (session?.user?.language) {
    return {
      locale: languageToLocale(session.user.language),
      messages: (await import(`../messages/${locale}.json`)).default,
    };
  }

  // 2. Check browser header
  const headerLocale = getLocaleFromHeaders();
  if (isValidLocale(headerLocale)) {
    return {
      locale: headerLocale,
      messages: (await import(`../messages/${locale}.json`)).default,
    };
  }

  // 3. Fallback to default
  return {
    locale: "en",
    messages: (await import("../messages/en.json")).default,
  };
});
```

---

## Adding New Translations

### Step 1: Add to English (en.json)

```json
{
  "settings": {
    "security": {
      "title": "Security Settings",
      "twoFactor": "Two-Factor Authentication",
      "changePassword": "Change Password"
    }
  }
}
```

### Step 2: Add to French (fr.json)

```json
{
  "settings": {
    "security": {
      "title": "Paramètres de sécurité",
      "twoFactor": "Authentification à deux facteurs",
      "changePassword": "Changer le mot de passe"
    }
  }
}
```

### Step 3: Use in Component

```typescript
"use client";

import { useTranslations } from "next-intl";

export const SecuritySettings = () => {
  const t = useTranslations("settings.security");

  return (
    <div>
      <h1>{t("title")}</h1>
      <label>{t("twoFactor")}</label>
      <button>{t("changePassword")}</button>
    </div>
  );
};
```

**Important**: Keep structure identical in both files.

---

## Helper Functions

```typescript
import {
  isValidLocale,
  getLocaleDisplayName,
  getLocaleFlag,
  languageToLocale,
  localeToLanguage,
} from "@/lib/i18n";

// Validate locale
isValidLocale("en"); // true
isValidLocale("es"); // false

// Get display name
getLocaleDisplayName("en"); // "English"
getLocaleDisplayName("fr"); // "Français"

// Get flag emoji
getLocaleFlag("en"); // "🇺🇸"
getLocaleFlag("fr"); // "🇫🇷"

// Convert between Prisma Language enum and locale
languageToLocale("EN"); // "en"
languageToLocale("FR"); // "fr"

localeToLanguage("en"); // "EN"
localeToLanguage("fr"); // "FR"
```

---

## Configuration

```typescript
// i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "never", // Don't add /en or /fr to URLs
  localeDetection: false, // Manual detection via request.ts
});
```

---

## Dynamic Content

### Pluralization

```json
{
  "items": {
    "count": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
  }
}
```

```typescript
const t = useTranslations("items");

<p>{t("count", { count: 0 })}</p>  // "No items"
<p>{t("count", { count: 1 })}</p>  // "1 item"
<p>{t("count", { count: 5 })}</p>  // "5 items"
```

### Interpolation

```json
{
  "greeting": "Hello, {name}!"
}
```

```typescript
const t = useTranslations();

<p>{t("greeting", { name: "John" })}</p>  // "Hello, John!"
```

### Rich Text

```json
{
  "terms": "By signing up, you agree to our <terms>Terms of Service</terms>"
}
```

```typescript
import Link from "next/link";

const t = useTranslations();

<p>
  {t.rich("terms", {
    terms: (chunks) => <Link href="/terms">{chunks}</Link>
  })}
</p>
```

---

## Language Switcher Component

```typescript
// components/features/i18n/language-switcher.tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";
import { updateLanguageAction } from "@/actions/user/user.action";
import { getLocaleDisplayName, getLocaleFlag } from "@/lib/i18n";

type LanguageSwitcherProps = {
  currentLocale: "en" | "fr";
};

export const LanguageSwitcher = ({ currentLocale }: LanguageSwitcherProps) => {
  const router = useRouter();

  const { mutate } = useMutation({
    mutationFn: async (locale: "en" | "fr") => {
      await updateLanguageAction({ language: localeToLanguage(locale) });
    },
    onSuccess: () => {
      router.refresh(); // Reload with new locale
    },
  });

  return (
    <Select
      value={currentLocale}
      onValueChange={(value) => mutate(value as "en" | "fr")}
    >
      <option value="en">
        {getLocaleFlag("en")} {getLocaleDisplayName("en")}
      </option>
      <option value="fr">
        {getLocaleFlag("fr")} {getLocaleDisplayName("fr")}
      </option>
    </Select>
  );
};
```

---

## Best Practices

1. ✅ **Keep structure identical** in en.json and fr.json
2. ✅ **Check for existing keys** before adding new ones
3. ✅ **Use namespaces** to organize translations logically
4. ✅ **Reuse common keys** from `common` namespace
5. ✅ **Use descriptive key names** (e.g., `emailNotifications` not `setting1`)
6. ✅ **Test both locales** when adding new features
7. ✅ **Use interpolation** for dynamic content instead of string concatenation
8. ❌ **Don't hardcode strings** - always use translation keys
9. ❌ **Don't create duplicate keys** - search existing translations first
10. ❌ **Don't nest too deeply** - max 3 levels (e.g., `settings.profile.name`)

---

## Translation Checklist

When adding a new translatable feature:

- [ ] Added keys to `en.json`
- [ ] Added corresponding keys to `fr.json`
- [ ] Kept structure identical in both files
- [ ] Checked for existing reusable keys (common, auth)
- [ ] Used `useTranslations()` in client components
- [ ] Used `getTranslations()` in server components
- [ ] Tested with both locales
- [ ] Used interpolation for dynamic content

---

## Common Patterns

### Form with Validation Messages

```json
{
  "auth": {
    "signUp": "Sign Up",
    "email": "Email",
    "password": "Password",
    "name": "Name",
    "validation": {
      "emailRequired": "Email is required",
      "emailInvalid": "Invalid email format",
      "passwordTooShort": "Password must be at least 8 characters",
      "nameRequired": "Name is required"
    }
  }
}
```

```typescript
const t = useTranslations("auth");
const tValidation = useTranslations("auth.validation");

const schema = z.object({
  email: z.string().email(tValidation("emailInvalid")),
  password: z.string().min(8, tValidation("passwordTooShort")),
  name: z.string().min(1, tValidation("nameRequired")),
});
```

### Navigation with Translations

```typescript
import { useTranslations } from "next-intl";

export const Sidebar = () => {
  const t = useTranslations("navigation");

  return (
    <nav>
      <Link href="/dashboard">{t("dashboard")}</Link>
      <Link href="/settings">{t("settings")}</Link>
      <Link href="/profile">{t("profile")}</Link>
    </nav>
  );
};
```
