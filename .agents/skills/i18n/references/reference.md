# i18n Reference

## Message File Structure

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "loading": "Loading...",
    "error": "An error occurred",
    "noResults": "No results found",
    "goBack": "Go Back",
    "backToHome": "Back to Home"
  },
  "dataTable": {},
  "auth": {
    "email": "Email",
    "password": "Password",
    "signIn": "Sign in",
    "signUp": "Sign up",
    "logOut": "Log out"
  },
  "navigation": {},
  "errors": {},
  "settings": {
    "profile": {
      "title": "Profile",
      "description": "Update your profile settings"
    },
    "notifications": {},
    "security": {}
  },
  "admin": {},
  "changelog": {},
  "theme": {},
  "command": {},
  "organization": {},
  "mcp": {},
  "notifications": {},
  "dataExport": {},
  "impersonation": {}
}
```

## Locale Detection Priority

`resolveRequestLocale` in `src/i18n/server.ts`:

1. **Authenticated users**: Language from database (`user.language`)
2. **Anonymous users**: Browser `Accept-Language` header
3. **Fallback**: Default locale (`en`)

`src/app/__root.tsx` loads `{ locale, messages }` through `getRootI18n()`
(`getI18nData()`), and its error and not-found components fall back to the
default locale.

## Helper Functions

| Helper                                   | Module              | Use                                                         |
| ---------------------------------------- | ------------------- | ----------------------------------------------------------- |
| `useTranslations(namespace?)`            | `@/i18n`            | Translator in React components                              |
| `useLocale()`, `useMessages()`           | `@/i18n`            | Current locale (date formatting) and raw messages           |
| `I18nProvider`                           | `@/i18n`            | Provider mounted by `src/app/-providers.tsx`                |
| `getTranslations(namespace?)`            | `@/i18n/server`     | Translator for the current request on the server            |
| `getI18nData()`                          | `@/i18n/server`     | Locale and messages for the current request                 |
| `createTranslator(messages, namespace?)` | `@/i18n/translator` | Translator without a request (jobs, emails, adapters)       |
| `getMessages(locale)`                    | `@/i18n/messages`   | Messages for a locale                                       |
| `languageToLocale(language)`             | `@/i18n/routing`    | Prisma `Language` (`"FR"`) to locale (`"fr"`), default `en` |
| `isLocale(value)`                        | `@/i18n/routing`    | Type guard for supported locales                            |

A missing key returns its full path (`settings.profile.title`) so gaps are
visible in the UI.

## Configuration

Locales are declared in `src/i18n/routing.ts`; adding one also needs a
`messages/{locale}.json` file registered in `src/i18n/messages.ts`. Prisma
`Language` values without a locale (such as `DE`) fall back to `en` through
`languageToLocale`.

```typescript
export const routing = {
  defaultLocale: "en",
  locales: ["en", "fr"],
} as const;
```

## Common Reusable Keys

Always check these before creating new keys:

| Key                | Usage                  |
| ------------------ | ---------------------- |
| `common.save`      | Save buttons           |
| `common.cancel`    | Cancel buttons         |
| `common.delete`    | Delete actions         |
| `common.edit`      | Edit buttons           |
| `common.create`    | Create buttons         |
| `common.loading`   | Loading states         |
| `common.error`     | Generic error messages |
| `common.noResults` | Empty state messages   |
| `common.search`    | Search labels          |
| `auth.email`       | Email field labels     |
| `auth.password`    | Password field labels  |

`DataTable` owns its copy under `dataTable`; feature tables only pass their
column headers, filter labels, `emptyMessage` and `searchPlaceholder`.

## Registry Labels

| Registry                                  | Messages                                |
| ----------------------------------------- | --------------------------------------- |
| `NAVIGATION_PAGES`, `ADMIN_PAGES`         | `navigation.{titleKey}`                 |
| `ACCESS_FEATURES`                         | `admin.access.features`                 |
| `NotificationPayloads`                    | `notifications.types` (`title`, `body`) |
| Search providers (`getSearchProviders()`) | `command.groups`                        |
