---
name: changelog
description: Changelog entries and release notes for /changelogs. Use when creating or modifying changelog files, release notes, version history, release documentation, frontmatter, version ordering, or change summaries.
---

# Changelog

## Workflow

- Create changelog files in `/changelogs` using `{version}.md` or `{version}.mdx`.
- Include YAML frontmatter with title, date, version, and type.
- Group release content with concise markdown sections such as features, fixes, infrastructure, security, or breaking changes.
- Keep entries user-facing and specific; avoid internal implementation noise unless it affects operators or developers.
- Preserve chronological and semantic version ordering conventions already used by the repo.

## Resources

- Read [references/reference.md](references/reference.md) for frontmatter fields, type values, headings, and version ordering.
- Read [references/examples.md](references/examples.md) for complete changelog entry examples.

## Boundaries

- Use `$conventions` for markdown style only when the changelog touches repo-wide formatting concerns.
