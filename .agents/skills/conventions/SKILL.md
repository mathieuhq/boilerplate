---
name: conventions
description: Repository naming, imports, exports, Oxfmt formatting, Oxlint rules, aliases, and TypeScript/React style conventions. Use when choosing file names, organizing imports, formatting or linting code, exporting components/functions, declaring types, or aligning code with project standards.
---

# Conventions

## Workflow

- Follow the repo's Oxfmt settings (`.oxfmtrc.json`, `pnpm format`): 2 spaces, semicolons, double quotes, 80 character print width, and Tailwind class sorting.
- Follow the type-aware Oxlint rules (`.oxlintrc.json`, `pnpm lint`): `type` over `interface`, property method signatures, `import type`, no `any`, no non-null assertions.
- Organize imports in the order Oxfmt enforces: React, TanStack, and external packages in one block, then `@/` aliases and scoped packages, then parent, sibling, CSS, and side-effect imports.
- Export feature TSX components with `export const` arrow components; leave shadcn primitives in `components/ui/` in their upstream style.
- Export non-component utilities with `function` declarations.
- Write no comments in code or config files.
- Use existing path aliases before adding relative traversal across feature boundaries.
- Match the existing file naming convention for the target layer before creating new files.

## Resources

- Read [references/reference.md](references/reference.md) for file naming, import ordering, aliases, formatter settings, and lint rules.
- Read [references/examples.md](references/examples.md) for correct and incorrect component, utility, type, import, and filename examples.

## Boundaries

- Use domain-specific skills first when conventions depend on architecture, API, page, storage, i18n, or testing context.
