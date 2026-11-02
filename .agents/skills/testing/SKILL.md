---
name: testing
description: Vitest domain, application, infrastructure, and interface tests, src-only test scope, 100% coverage thresholds, shared mock factories, assertions, and test file placement. Use when writing, updating, or reviewing unit tests, coverage, mock repositories or ports, use case tests, entity tests, value object tests, adapter tests, or controller tests.
---

# Testing

## Workflow

- Add or update tests for code changes in `src/`; domain code, `src/shared/application`, and feature use cases must stay at 100% lines, branches, functions, and statements.
- Place tests under `src/**/__tests__/**/*.test.ts`, matching `vitest.config.ts`, and name them after the file under test (`update-user-profile.use-case.test.ts`).
- Test entities, value objects, policies, use cases, Result success/failure paths, audit log calls, job enqueues, and boundary conditions; add adapter, repository, and controller tests in `infrastructure/__tests__` and `interface/__tests__` when they hold logic.
- Mock repositories and ports with typed test doubles from `@/test/utils/mock-factories`, `@/test/utils/entity-builders`, or a feature-local `__tests__/*.mock.ts`, created in `beforeEach` because `mockReset` is on.
- Keep tests outside `src/app/`, `src/server-functions/`, `components/`, and
  `lib/` unless the test configuration changes.
- Run `pnpm test:run` before commits; use `pnpm test:coverage` when coverage risk is relevant.

## Resources

- Read [references/reference.md](references/reference.md) for runner setup, test structure, mock factories, assertions, locations, coverage scope and thresholds, and exclusions.
- Read [references/examples.md](references/examples.md) for value object, entity, use case, audit log, and error handling tests.

## Boundaries

- Use `$clean-architecture` to understand the layer under test.
- Use `$error-handling` for expected failure semantics and assertions.
