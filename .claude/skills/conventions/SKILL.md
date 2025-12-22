---
name: conventions
description: Code style, naming conventions, and import organization. Use when naming files, organizing imports, formatting code, or following project standards. Triggers on naming conventions, file naming, import order, code style, export patterns.
---

# Conventions

## Import Order (ESLint enforced)

1. React imports
2. Next.js imports
3. External packages
4. Internal absolute imports (`@/`)
5. Relative imports
6. CSS imports

## Code Style

- 80 character line width
- 2 space indentation
- Semicolons required
- Double quotes
- Tailwind class sorting (Prettier plugin)

## Export Patterns

**TSX Components**: Always use `export const` with arrow functions

```tsx
export const Button = ({ children }: ButtonProps) => {
  return <button>{children}</button>;
};
```

**Functions**: Always use `function` declaration

```typescript
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

## Path Aliases

- `@/*` → root
- `@/features/*` → src/features
- `@/shared/*` → src/shared

See [reference.md](reference.md) for complete naming conventions table.
See [examples.md](examples.md) for correct vs incorrect patterns.
