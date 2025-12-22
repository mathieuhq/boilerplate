---
name: testing
description: Test requirements and conventions with Vitest. Use when writing tests, checking coverage, or implementing test cases. Triggers on testing, writing tests, test coverage, vitest, unit tests, test files.
---

# Testing

**CRITICAL: All code changes MUST include tests.**

## Scope

**Test ONLY files inside `src/` directory.** Files outside `src/` (such as `lib/`, `app/`, `actions/`, `components/`) should NOT be tested.

## Commands

```bash
pnpm test:run       # Run all tests
pnpm test:coverage  # Run with coverage
```

## Test Location

```
src/features/{domain}/
├── domain/__tests__/        # Entity and value object tests
├── application/__tests__/   # Use case tests
```

## Coverage Requirements (minimum 80%)

- Lines: 80%
- Branches: 80%
- Functions: 80%
- Statements: 80%

## File Naming

`{name}.test.ts`

## What to Test

1. **Domain Layer**: Entity behavior, value object validation
2. **Application Layer**: Use case logic with mocked repositories
3. **Edge cases**: Error handling, boundary conditions

See [reference.md](reference.md) for test patterns.
See [examples.md](examples.md) for real test implementations.
