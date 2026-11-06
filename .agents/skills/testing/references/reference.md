# Testing Reference

## Test Runner Setup

`vitest.config.ts` runs with `globals: true`, `environment: "node"`, `mockReset`, `clearMocks` and `restoreMocks` enabled, resolves the tsconfig `@/*` aliases, and only collects `src/**/__tests__/**/*.test.ts`. `vitest.setup.ts` clears mocks before each test and mocks `@/lib/env` (`NODE_ENV: "test"`, every provider config getter returns `null`).

Because `mockReset` wipes `mockResolvedValue` implementations between tests, build mocks and their default behavior inside `beforeEach`, not at module scope.

## Test Structure

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import { createMockUserRepository } from "@/test/utils/mock-factories";

import { UpdateUserProfileUseCase } from "../use-cases/update-user-profile.use-case";

describe("UpdateUserProfileUseCase", () => {
  let useCase: UpdateUserProfileUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new UpdateUserProfileUseCase(mockUserRepository);
  });

  it("should update the profile when the user exists", async () => {
    const user = buildUser();
    vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
    vi.mocked(mockUserRepository.save).mockResolvedValue(user);

    const result = await useCase.execute({ userId: "user-123", name: "New" });

    expect(result.isSuccess).toBe(true);
  });
});
```

## Mock Patterns

### Shared Factories

`src/test/utils/mock-factories.ts` exports typed doubles: `createMockUserRepository`, `createMockCache`, `createMemoryCacheStore`, `createMockEmailProvider`, `createMockAuthProvider`, `createMockUserAuthProvider`, `createMockEmailNotifier`, `createMockOrganizationRepository`, `createMockOrganizationManagement`. `src/test/utils/entity-builders.ts` exports `buildUser(overrides)` and `buildOrganization(overrides)`.

```typescript
export function createMockUserRepository(): IUserRepository {
  return {
    save: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    isEmailTaken: vi.fn(),
  };
}
```

### Feature-Local Mocks

Feature-specific doubles live next to the tests as `__tests__/*.mock.ts` or `__tests__/*.mocks.ts` (for example `session-management.mock.ts`, `admin-repository.mock.ts`, `data-export.mocks.ts`) and are typed with the port they replace:

```typescript
export function createMockAuditLog(): IAuditLogPort {
  return { record: vi.fn() };
}
```

### Inline Port Doubles

```typescript
const jobQueue: IJobQueuePort<Pick<UserJobs, "user.export-data">> = {
  enqueue: vi.fn().mockResolvedValue(undefined),
};
```

## Assertion Patterns

```typescript
expect(result.isSuccess).toBe(true);
expect(result.isFailure).toBe(true);
expect(result.value).toEqual(expected);
expect(result.error).toBeInstanceOf(UserNotFoundError);
expect((result.error as SessionOperationError).code).toBe("SESSION_NOT_FOUND");

expect(email.value).toBe("test@example.com");
expect(() => Email.create("invalid")).toThrow(DomainError);

expect(user.id.value).toBe("user-123");
expect(user.email.equals(otherEmail)).toBe(true);

expect(mockUserRepository.save).toHaveBeenCalledWith(user);
expect(auditLog.record).toHaveBeenCalledWith(
  expect.objectContaining({ action: "auth.session.revoked" }),
);
expect(auditLog.record).not.toHaveBeenCalled();
```

## Test File Locations

Name tests after the file under test: `update-user-profile.use-case.test.ts`, `email.value-object.test.ts`.

| Layer                    | Location                                          |
| ------------------------ | ------------------------------------------------- |
| Entity, VO, Policy       | `src/features/{domain}/domain/__tests__/`         |
| Use Case, App Service    | `src/features/{domain}/application/__tests__/`    |
| Repository, Adapter      | `src/features/{domain}/infrastructure/__tests__/` |
| Controller, Error mapper | `src/features/{domain}/interface/__tests__/`      |
| Shared code              | `src/shared/{layer}/**/__tests__/`                |
| MCP tools                | `src/mcp/__tests__/`                              |

## Coverage Thresholds

`pnpm test:coverage` (v8) enforces 100% on:

```typescript
coverage: {
  include: [
    "src/shared/domain/**/*.ts",
    "src/features/**/domain/**/*.ts",
    "src/shared/application/**/*.ts",
    "src/features/**/application/use-cases/**/*.ts",
  ],
  exclude: [
    "**/*.d.ts",
    "**/index.ts",
    "**/*.dto.ts",
    "**/*.port.ts",
    "**/*.types.ts",
    "**/__tests__/**",
    "**/*.interface.ts",
  ],
  thresholds: {
    lines: 100,
    branches: 100,
    functions: 100,
    statements: 100,
  },
}
```

Infrastructure and interface tests are collected and run but are not part of the coverage gate.

## What NOT to Test

- Files outside `src/` (`lib/`, `components/`, `views/`, `hooks/`): they are not collected
- `src/app/` routes and `src/server-functions/` wrappers
- Third-party library internals
- Real database or Redis access: run Drizzle repositories against `createTestDatabase()` (`@/test/utils/test-database`, an in-memory PGlite with every migration applied) instead of mocking query builders, and use `createMemoryCacheStore` for the cache
- Configuration files
