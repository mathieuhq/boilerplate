# Changelog Reference

## Frontmatter Fields

Parsed with `gray-matter` in `getChangelogs()` (`lib/changelog.ts`). Quote every value so YAML keeps dates as strings.

| Field     | Type   | Required | Description                          | Fallback when missing |
| --------- | ------ | -------- | ------------------------------------ | --------------------- |
| `title`   | string | Yes      | Human-readable release title         | `"Untitled"`          |
| `date`    | string | Yes      | ISO date format (YYYY-MM-DD)         | Current timestamp     |
| `version` | string | Yes      | Semantic version (X.Y.Z)             | `"0.0.0"`             |
| `type`    | enum   | Yes      | One of: `Feature`, `Fix`, `Critical` | `"Feature"`           |

## Type Definitions

`ChangelogType` drives the colored badge (`ChangelogTypeBadge`) and the type filter in `ChangelogSidebar`.

| Type       | Use Case                                         | Label key (`changelog`) |
| ---------- | ------------------------------------------------ | ----------------------- |
| `Feature`  | New features, enhancements, improvements         | `newFeatures`           |
| `Fix`      | Bug fixes, patches, corrections                  | `fixes`                 |
| `Critical` | Security fixes, breaking changes, urgent updates | `critical`              |

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

## Rendering

- `/changelog` (`src/app/_dashboard/changelog.tsx`) loads entries through `getChangelogData()` in `src/server-functions/page-data.functions.ts`.
- Each body is rendered by `ChangelogEntry` with `react-markdown` and `remark-gfm`: GitHub-flavored markdown works, JSX and MDX components do not.
- The entry header already shows `v{version}`, the type badge, the formatted date, and the title, so do not repeat them in the body.

## Version Ordering

Entries are sorted by `date`, newest first; `version` is never compared. `getLatestVersion()` returns the `version` of the newest-dated entry, which the sidebar compares with the `last_seen_changelog_version` value in `localStorage` to show the new changelog indicator. Keep dates increasing with versions, and keep or replace `changelogs/example.md` (version `0.0.0`) deliberately because it is rendered like any other entry.

## Semantic Versioning

- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible
