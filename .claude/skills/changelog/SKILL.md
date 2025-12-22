---
name: changelog
description: "Changelog file format with YAML frontmatter (title, date, version, type), markdown content structure, version ordering, and type definitions. Use when creating changelog entries, documenting releases, or formatting version history."
---

## Overview

Changelogs document all notable changes to the project in a structured format.

**Location**: `/changelogs` directory
**Format**: Markdown (`.md`) or MDX (`.mdx`)
**Naming**: `{version}.md` (e.g., `1.0.0.md`, `1.2.3.md`)

---

## File Format

### Naming Convention

```
changelogs/
├── 1.0.0.md
├── 1.1.0.md
├── 1.2.0.md
└── 2.0.0.md
```

Use semantic versioning: `MAJOR.MINOR.PATCH`

---

## Frontmatter (Required)

Every changelog file **MUST** have YAML frontmatter with these fields:

```yaml
---
title: "Release Title"
date: "YYYY-MM-DD"
version: "X.Y.Z"
type: "Feature" | "Fix" | "Critical"
---
```

### Frontmatter Fields

| Field     | Type   | Required | Format     | Description                          |
| --------- | ------ | -------- | ---------- | ------------------------------------ |
| `title`   | string | Yes      | Free text  | Human-readable release title         |
| `date`    | string | Yes      | YYYY-MM-DD | ISO date format (2025-01-15)         |
| `version` | string | Yes      | X.Y.Z      | Semantic version (1.2.3)             |
| `type`    | enum   | Yes      | See below  | One of: Feature, Fix, Critical       |

---

## Type Definitions

| Type       | Use Case                                         | Examples                            |
| ---------- | ------------------------------------------------ | ----------------------------------- |
| `Feature`  | New features, enhancements, improvements         | New dashboard, API improvements     |
| `Fix`      | Bug fixes, patches, corrections                  | Fixed login bug, patched form error |
| `Critical` | Security fixes, breaking changes, urgent updates | Security patch, breaking API change |

---

## Content Structure

After the frontmatter, organize changes using markdown headings:

```markdown
---
title: "Dashboard Improvements"
date: "2025-01-15"
version: "1.1.0"
type: "Feature"
---

## New Features

- **Analytics dashboard**: Real-time metrics visualization with interactive charts.
- **Export functionality**: Download reports as CSV or PDF formats.
- **User search**: Advanced search and filtering for user management.

## Bug Fixes

- Fixed pagination not working on mobile devices.
- Resolved issue with form validation on signup page.
- Fixed memory leak in settings page.

## Infrastructure

- Updated dependency Z to version 3.0.0.
- Improved build performance by 40%.
- Added automated testing for API routes.

## Breaking Changes

> **Note**: This release contains breaking changes. Please review the migration guide.

- Changed authentication API response format.
- Removed deprecated `getUserById` function.
```

---

## Common Sections

### Suggested Section Headings

```markdown
## New Features
- New functionality or capabilities

## Enhancements
- Improvements to existing features

## Bug Fixes
- Fixes for reported issues

## Performance
- Speed or efficiency improvements

## Infrastructure
- Technical improvements, dependencies

## Breaking Changes
- Changes that require migration

## Deprecations
- Features marked for future removal

## Security
- Security-related fixes or improvements

## Documentation
- Documentation updates or additions
```

---

## Complete Example

```markdown
---
title: "Authentication System Overhaul"
date: "2025-01-20"
version: "2.0.0"
type: "Critical"
---

## New Features

- **Two-factor authentication**: Added support for TOTP-based 2FA using authenticator apps.
- **Social login**: Integrated OAuth providers (Google, GitHub) for seamless sign-in.
- **Session management**: New dashboard to view and revoke active sessions.

## Security

- **Password hashing**: Migrated from bcrypt to Argon2 for improved security.
- **Rate limiting**: Added rate limiting to prevent brute force attacks on auth endpoints.
- **Session tokens**: Implemented rotating refresh tokens with automatic expiration.

## Breaking Changes

> **⚠️ Important**: This release contains breaking changes to the authentication API.

- Changed authentication token format from JWT to opaque tokens.
- Removed `POST /api/auth/login` in favor of `POST /api/auth/signin`.
- Updated session cookie names from `session` to `auth_session`.

**Migration guide**: See [MIGRATION.md](./MIGRATION.md) for detailed steps.

## Bug Fixes

- Fixed issue where sessions weren't properly invalidated on sign out.
- Resolved race condition in concurrent authentication requests.
- Fixed password reset tokens expiring prematurely.

## Infrastructure

- Updated Better Auth to v1.5.0.
- Added automated testing for authentication flows.
- Improved error handling in auth middleware.

## Deprecations

- `getUserById()` is deprecated and will be removed in v3.0.0. Use `findUserById()` instead.
```

---

## Version Ordering

Changelogs are automatically sorted by **date** (newest first).

**Important**: Use consistent date formatting (YYYY-MM-DD) to ensure correct ordering.

```markdown
# Correct ordering (by date)
2.0.0.md (2025-02-01)
1.2.0.md (2025-01-20)
1.1.0.md (2025-01-15)
1.0.0.md (2025-01-01)
```

---

## Semantic Versioning Guide

Follow semantic versioning principles:

| Version Type | When to Use                       | Example           |
| ------------ | --------------------------------- | ----------------- |
| **MAJOR**    | Breaking changes, incompatible API| 1.0.0 → 2.0.0     |
| **MINOR**    | New features, backward-compatible | 1.0.0 → 1.1.0     |
| **PATCH**    | Bug fixes, backward-compatible    | 1.0.0 → 1.0.1     |

### Examples

```markdown
# MAJOR version bump
1.5.2 → 2.0.0 (Removed deprecated API endpoints)

# MINOR version bump
1.5.2 → 1.6.0 (Added new dashboard feature)

# PATCH version bump
1.5.2 → 1.5.3 (Fixed login bug)
```

---

## Creating a New Changelog

### Step 1: Create File

```bash
touch changelogs/1.2.0.md
```

### Step 2: Add Frontmatter

```markdown
---
title: "Performance Improvements"
date: "2025-01-25"
version: "1.2.0"
type: "Feature"
---
```

### Step 3: Add Content

```markdown
## New Features

- **Caching layer**: Implemented Redis caching for API responses.

## Performance

- Reduced average page load time by 60%.
- Optimized database queries in user dashboard.

## Bug Fixes

- Fixed slow loading on admin users page.
```

### Step 4: Validate

Check that:
- [ ] Frontmatter has all required fields
- [ ] Date is in YYYY-MM-DD format
- [ ] Version follows semantic versioning
- [ ] Type is one of: Feature, Fix, Critical
- [ ] Content is organized with headings

---

## Best Practices

1. ✅ **Be specific** - "Fixed login bug" is better than "Bug fixes"
2. ✅ **Use bullet points** - Easy to scan and read
3. ✅ **Bold key terms** - Highlight feature names or components
4. ✅ **Include context** - Explain why changes were made
5. ✅ **Link to docs** - Reference migration guides or documentation
6. ✅ **Call out breaking changes** - Use warnings or notes
7. ✅ **Group related changes** - Use sections to organize
8. ✅ **Write for users** - Focus on impact, not implementation
9. ❌ **Don't include internal details** - Skip internal refactors unless user-facing
10. ❌ **Don't use jargon** - Keep language accessible

---

## MDX Support

For richer content, use `.mdx` files:

```mdx
---
title: "New Dashboard"
date: "2025-01-30"
version: "1.3.0"
type: "Feature"
---

import { Alert } from "@/components/ui/alert";

## New Features

<Alert variant="info">
  The new dashboard is available to all users starting today!
</Alert>

- **Interactive charts**: Visualize your data with Chart.js integration.
- **Real-time updates**: Live data updates using WebSockets.

## Screenshots

![Dashboard Overview](./screenshots/dashboard-1.3.0.png)
```

---

## Template

Use this template for new changelogs:

```markdown
---
title: ""
date: "YYYY-MM-DD"
version: "X.Y.Z"
type: "Feature"
---

## New Features

- **Feature name**: Description of the feature and its benefits.

## Bug Fixes

- Fixed issue where...

## Infrastructure

- Updated dependencies.

## Breaking Changes

> **Note**: This release contains breaking changes.

- Changed...
```

---

## Checklist for New Changelog

Before publishing a changelog, verify:

- [ ] File named correctly (`{version}.md`)
- [ ] Frontmatter includes all required fields (title, date, version, type)
- [ ] Date is in YYYY-MM-DD format
- [ ] Version follows semantic versioning (X.Y.Z)
- [ ] Type is valid (Feature, Fix, or Critical)
- [ ] Content is organized with markdown headings
- [ ] Changes are described clearly and specifically
- [ ] Breaking changes are highlighted (if any)
- [ ] Links to migration guides (if needed)

---

## Displaying Changelogs

Changelogs are typically displayed on a `/changelog` page:

```typescript
// app/changelog/page.tsx
import { getChangelogs } from "@/lib/changelogs";

export default async function ChangelogPage() {
  const changelogs = await getChangelogs(); // Sorted by date

  return (
    <div>
      {changelogs.map((changelog) => (
        <article key={changelog.version}>
          <h2>{changelog.title}</h2>
          <p>{changelog.date} - v{changelog.version}</p>
          <div>{changelog.content}</div>
        </article>
      ))}
    </div>
  );
}
```

---

## Common Mistakes

### ❌ Incorrect

```markdown
---
title: Update
date: 01/15/2025  # Wrong date format
version: 1.2      # Missing patch version
type: update      # Invalid type
---

# New Features    # Wrong - should use ##
Fixed bugs        # Missing bullet points
```

### ✅ Correct

```markdown
---
title: "Performance Update"
date: "2025-01-15"
version: "1.2.0"
type: "Feature"
---

## New Features

- **Caching**: Implemented Redis caching for faster load times.

## Bug Fixes

- Fixed memory leak in dashboard component.
```
