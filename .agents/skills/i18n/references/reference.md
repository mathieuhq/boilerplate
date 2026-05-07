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
    "loading": "Loading...",
    "error": "An error occurred",
    "noResults": "No results found",
    "goBack": "Go back",
    "backToHome": "Back to home"
  },
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
    "billing": {}
  },
  "admin": {},
  "changelog": {},
  "theme": {},
  "command": {}
}
```

## Locale Detection Priority

1. **Authenticated users**: Language from database (`user.language`)
2. **Anonymous users**: Browser `Accept-Language` header
3. **Fallback**: Default locale (`en`)

## Helper Functions

```typescript
import {
  languageToLocale,
  localeToLanguage,
} from "@/i18n/routing";

languageToLocale("FR"); // "fr"
localeToLanguage("en"); // "EN"
```

## Configuration

```typescript
// src/i18n/routing.ts
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
| `auth.email`       | Email field labels     |
| `auth.password`    | Password field labels  |
