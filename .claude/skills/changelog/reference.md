# Changelog Reference

## Frontmatter Fields

| Field     | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| `title`   | string | Yes      | Human-readable release title         |
| `date`    | string | Yes      | ISO date format (YYYY-MM-DD)         |
| `version` | string | Yes      | Semantic version (X.Y.Z)             |
| `type`    | enum   | Yes      | One of: `Feature`, `Fix`, `Critical` |

## Type Definitions

| Type       | Use Case                                         |
| ---------- | ------------------------------------------------ |
| `Feature`  | New features, enhancements, improvements         |
| `Fix`      | Bug fixes, patches, corrections                  |
| `Critical` | Security fixes, breaking changes, urgent updates |

## Content Section Headings

Use these standard headings for consistency:

```markdown
### New Features
### Bug Fixes
### Improvements
### Infrastructure
### Breaking Changes
### Security
### Deprecations
```

## Version Ordering

Changelogs are automatically sorted by date (newest first). Use consistent date formatting to ensure correct ordering.

## Semantic Versioning

- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible
