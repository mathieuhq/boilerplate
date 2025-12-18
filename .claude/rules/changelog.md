# Changelog

## Location

All changelog files are stored in `/changelogs` directory.

## File Format

- Extension: `.md` or `.mdx`
- Naming: `{version}.md` (e.g., `1.0.0.md`, `1.2.3.md`)

## Frontmatter (Required)

Every changelog file MUST have YAML frontmatter with these fields:

```yaml
---
title: "Release Title"
date: "YYYY-MM-DD"
version: "X.Y.Z"
type: "Feature" | "Fix" | "Critical"
---
```

| Field     | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| `title`   | string | Yes      | Human-readable release title                 |
| `date`    | string | Yes      | ISO date format (YYYY-MM-DD)                 |
| `version` | string | Yes      | Semantic version (X.Y.Z)                     |
| `type`    | enum   | Yes      | One of: `Feature`, `Fix`, `Critical`         |

## Type Definitions

| Type       | Use Case                                           |
| ---------- | -------------------------------------------------- |
| `Feature`  | New features, enhancements, improvements           |
| `Fix`      | Bug fixes, patches, corrections                    |
| `Critical` | Security fixes, breaking changes, urgent updates   |

## Content Structure

Use markdown headings to organize changes:

```markdown
### New Features

- **Feature name**: Description of the feature.

### Bug Fixes

- Fixed issue with X when Y.

### Infrastructure

- Updated dependency Z to version N.
```

## Example

```markdown
---
title: "Dashboard Improvements"
date: "2025-01-15"
version: "1.1.0"
type: "Feature"
---

### New Features

- **Analytics dashboard**: Real-time metrics visualization.
- **Export functionality**: Download reports as CSV or PDF.

### Bug Fixes

- Fixed pagination not working on mobile devices.
```

## Version Ordering

Changelogs are automatically sorted by date (newest first). Use consistent date formatting to ensure correct ordering.
