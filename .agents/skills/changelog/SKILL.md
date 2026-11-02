---
name: changelog
description: Changelog entries and release notes for /changelogs, read by lib/changelog.ts and shown on the /changelog page. Use when creating or modifying changelog files, release notes, version history, release documentation, frontmatter, Feature/Fix/Critical types, version ordering, or change summaries.
---

# Changelog

## Workflow

- Create changelog files in `/changelogs` using `{version}.md`; the filename without extension becomes the entry `slug`. `.mdx` is accepted but rendered as plain markdown.
- Start from `changelogs/example.md`, the shipped template.
- Include quoted YAML frontmatter with `title`, `date`, `version`, and `type` (`Feature`, `Fix`, or `Critical`, the `ChangelogType` in `lib/changelog.ts`).
- Write the body in GitHub-flavored markdown (`react-markdown` with `remark-gfm`), grouped under `###` sections such as New Features, Improvements, Bug Fixes, Infrastructure, Security, or Breaking Changes.
- Keep entries user-facing and specific; avoid internal implementation noise unless it affects operators or developers.
- Give each release a later `date` than the previous one: entries are sorted by `date`, and the newest entry's `version` drives the sidebar "new changelog" badge.

## Resources

- Read [references/reference.md](references/reference.md) for frontmatter fields and defaults, type values, headings, rendering, and version ordering.
- Read [references/examples.md](references/examples.md) for complete changelog entry examples.

## Boundaries

- Use `$conventions` for markdown style only when the changelog touches repo-wide formatting concerns.
