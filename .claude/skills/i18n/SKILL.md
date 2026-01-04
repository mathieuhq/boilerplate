---
name: i18n
description: Internationalization with next-intl. Use when adding translations, working with locales, implementing multilingual features, or managing translation keys. Triggers on i18n, translations, locales, next-intl, useTranslations, getTranslations.
---

# Internationalization (i18n)

## Stack

- **Library**: `next-intl`
- **Locales**: `en` (English), `fr` (French)
- **Default locale**: `en`

## File Structure

```
messages/
├── en.json         # English translations
└── fr.json         # French translations
```

## Usage

**Client Components** (`"use client"`):

```typescript
import { useTranslations } from "next-intl";

const t = useTranslations("settings.profile");
return <h1>{t("title")}</h1>;
```

**Server Components**:

```typescript
import { getTranslations } from "next-intl/server";

const t = await getTranslations("settings.profile");
return <h1>{t("title")}</h1>;
```

## Key Naming

| Pattern                     | Example                        |
| --------------------------- | ------------------------------ |
| `{domain}.{key}`            | `common.save`                  |
| `{domain}.{section}.{key}`  | `settings.profile.name`        |
| `{domain}.validation.{key}` | `auth.validation.invalidEmail` |

## Critical: Avoid Duplicates

Before adding a new key, check `common` namespace first:

- `common.save`, `common.cancel`, `common.delete`, `common.edit`
- `common.loading`, `common.error`, `common.noResults`

See [reference.md](reference.md) for message structure and helpers.
See [examples.md](examples.md) for component usage patterns.
