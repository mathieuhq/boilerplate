---
name: i18n
description: Local i18n facade, locales, message keys, useTranslations, getTranslations, and multilingual UI. Use when adding or updating English/French messages, locale-aware components, validation text, translation namespaces, or i18n helpers.
---

# Internationalization (i18n)

## Workflow

- Update both `messages/en.json` and `messages/fr.json` for every user-facing key.
- Search the `common` namespace before adding new duplicated labels or states.
- Use `useTranslations` from `@/i18n` in React components.
- Use `getTranslations` from `@/i18n/server` in server functions or server-side helpers.
- Keep keys namespaced by domain and section; avoid one-off deeply nested keys unless the UI needs them.
- Keep validation and form copy near the feature namespace that owns the workflow.

## Resources

- Read [references/reference.md](references/reference.md) for message structure, locale detection, helpers, config, and common keys.
- Read [references/examples.md](references/examples.md) for client/server component usage, nested namespaces, helper functions, and validation messages.

## Boundaries

- Use `$page-creation` when translation changes are part of a new page flow.
- Use `$conventions` for formatting and import ordering.
