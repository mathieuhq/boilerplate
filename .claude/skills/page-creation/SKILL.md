---
name: page-creation
description: Page architecture and component hierarchy. Use when creating new pages, views, feature components, or working with the 4-layer component architecture. Triggers on creating pages, page creation, views, feature components, PageLayout, AuthTemplate.
---

# Page Creation

## 4-Layer Architecture

```
UI Components (components/ui/)
         ↓ composed by
Feature Components (components/features/)
         ↓ composed by
Views (views/)
         ↓ composed by
Pages (app/)
```

## Quick Start: Create a New Page

1. **Add SEO config** in `lib/seo.ts`
2. **Create Feature Components** in `components/features/{domain}/` with `"use client"`
3. **Create View** in `views/{domain}/` accepting server data as props
4. **Create Page** in `app/` as async server component with metadata
5. **Add to Navigation** if needed in sidebar constants

## Layer Overview

| Layer             | Path                          | Directive       | Data Source     |
| ----------------- | ----------------------------- | --------------- | --------------- |
| UI Components     | `components/ui/`              | -               | Props           |
| Feature Components| `components/features/{domain}/`| `"use client"` | Mutations, forms|
| Views             | `views/{domain}/`             | -               | Props from page |
| Pages             | `app/{route}/page.tsx`        | async           | DI Container    |

## Common Wrappers

```typescript
// Dashboard pages
<PageLayout title="Title" desc="Description.">{children}</PageLayout>

// Auth pages
<AuthTemplate title="Welcome" form={<SignInForm />} />

// Error pages
<ErrorTemplate code={404} title="Not Found" />
```

See [reference.md](reference.md) for naming conventions.
See [examples.md](examples.md) for complete page implementation.
