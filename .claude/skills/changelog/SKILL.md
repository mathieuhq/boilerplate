---
name: changelog
description: Changelog file format and structure. Use when creating or modifying changelog entries, writing release notes, or documenting version changes. Triggers on changelog, release notes, version history, release documentation.
---

# Changelog

## Location

All changelog files are stored in `/changelogs` directory.

## File Format

- Extension: `.md` or `.mdx`
- Naming: `{version}.md` (e.g., `1.0.0.md`, `1.2.3.md`)

## Required Frontmatter

Every changelog file MUST have YAML frontmatter:

```yaml
---
title: "Release Title"
date: "YYYY-MM-DD"
version: "X.Y.Z"
type: "Feature" | "Fix" | "Critical"
---
```

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

See [reference.md](reference.md) for field specifications.
See [examples.md](examples.md) for complete changelog example.
