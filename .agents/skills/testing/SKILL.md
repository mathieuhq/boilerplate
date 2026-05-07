---
name: testing
description: Vitest domain and application tests, src-only test scope, coverage thresholds, mocks, assertions, and test file placement. Use when writing, updating, or reviewing unit tests, coverage, mock repositories, use case tests, entity tests, or value object tests.
---

# Testing

## Workflow

- Add or update tests for code changes in `src/` domain and application layers.
- Place tests under `src/**/__tests__/**/*.test.ts`, matching `vitest.config.ts`.
- Test entities, value objects, use cases, Result success/failure paths, and boundary conditions.
- Mock repositories and ports with explicit typed test doubles.
- Keep tests outside `src/app/`, `src/server-functions/`, `components/`, and
  `lib/` unless the test configuration changes.
- Run `pnpm test:run` before commits; use `pnpm test:coverage` when coverage risk is relevant.

## Resources

- Read [references/reference.md](references/reference.md) for test structure, mocks, assertions, locations, coverage thresholds, and exclusions.
- Read [references/examples.md](references/examples.md) for value object, entity, use case, and error handling tests.

## Boundaries

- Use `$clean-architecture` to understand the layer under test.
- Use `$error-handling` for expected failure semantics and assertions.
