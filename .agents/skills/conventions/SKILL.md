---
name: conventions
description: Repository naming, imports, exports, formatting, aliases, and TypeScript/React style conventions. Use when choosing file names, organizing imports, formatting code, exporting components/functions, or aligning code with project standards.
---

# Conventions

## Workflow

- Follow the repo's ESLint and Prettier settings: 2 spaces, semicolons, double quotes, 80 character print width, and Tailwind class sorting.
- Organize imports in the enforced order: React/Next/external, internal aliases, relative imports, CSS, then side-effect imports.
- Export TSX components with `export const` arrow components.
- Export non-component utilities with `function` declarations.
- Use existing path aliases before adding relative traversal across feature boundaries.
- Match the existing file naming convention for the target layer before creating new files.

## Resources

- Read [references/reference.md](references/reference.md) for file naming, import ordering, aliases, and style rules.
- Read [references/examples.md](references/examples.md) for correct and incorrect component, utility, import, and filename examples.

## Boundaries

- Use domain-specific skills first when conventions depend on architecture, API, page, storage, i18n, or testing context.
