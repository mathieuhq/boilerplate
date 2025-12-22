---
name: testing
description: "Test files in src/features with 80% coverage minimum for lines, branches, functions, and statements. Vitest for unit testing with test location patterns and coverage configuration. Use when writing tests for domain entities, value objects, use cases, or checking test coverage requirements before committing code."
---

## Overview

**IMPORTANT: All code changes MUST include tests.**

Testing is mandatory for all code in the `src/` directory. Tests ensure code quality, catch regressions, and document expected behavior.

---

## Test Scope

**Test ONLY files inside `src/` directory.**

Files outside `src/` (such as `lib/`, `app/`, `actions/`, `components/`) should NOT be tested.

```
✅ Test these:
src/features/user/domain/entities/user.entity.ts
src/features/user/domain/value-objects/email.value-object.ts
src/features/user/application/use-cases/update-user-profile.use-case.ts

❌ Don't test these:
lib/errors.ts
app/api/users/route.ts
actions/user/user.action.ts
components/ui/button.tsx
```

---

## Commands

```bash
pnpm test:run       # Run all tests (MANDATORY before commits)
pnpm test:coverage  # Run with coverage report
pnpm test:watch     # Run in watch mode during development
```

**Always run `pnpm test:run` before committing code.**

---

## Test Location

Tests are co-located with the code they test in `__tests__` directories.

```
src/features/{domain}/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── value-objects/
│   │   └── email.value-object.ts
│   └── __tests__/                    # Domain layer tests
│       ├── user.entity.test.ts
│       └── email.value-object.test.ts
├── application/
│   ├── use-cases/
│   │   └── update-user-profile.use-case.ts
│   └── __tests__/                    # Application layer tests
│       └── update-user-profile.use-case.test.ts
```

---

## File Naming Convention

Test files must follow this pattern:

```
{name}.test.ts
```

Examples:
- `user.entity.test.ts`
- `email.value-object.test.ts`
- `update-user-profile.use-case.test.ts`

---

## Coverage Requirements

**Minimum coverage: 80%** for all metrics.

| Metric     | Minimum | Description                        |
| ---------- | ------- | ---------------------------------- |
| Lines      | 80%     | Percentage of lines executed       |
| Branches   | 80%     | Percentage of branches tested      |
| Functions  | 80%     | Percentage of functions called     |
| Statements | 80%     | Percentage of statements executed  |

Run `pnpm test:coverage` to check current coverage.

---

## What to Test

### 1. Domain Layer

**Entities:**
- Business logic methods
- State transitions
- Validation rules
- Edge cases

**Value Objects:**
- Validation in factory methods
- Immutability
- Equality comparison
- Invalid input handling

### 2. Application Layer

**Use Cases:**
- Successful execution paths
- Error handling (Result.fail cases)
- Repository interactions (mocked)
- Business rule enforcement
- Edge cases and boundary conditions

---

## Basic Test Structure

```typescript
import { describe, expect, it, vi } from "vitest";

describe("FeatureName", () => {
  describe("specificMethod", () => {
    it("should do something when condition", () => {
      // Arrange: Set up test data and mocks

      // Act: Execute the code being tested

      // Assert: Verify the results
    });

    it("should handle error case when invalid input", () => {
      // Test error scenarios
    });
  });
});
```

---

## Testing Examples

### Example 1: Entity Test

```typescript
// src/features/user/domain/__tests__/user.entity.test.ts
import { describe, expect, it } from "vitest";
import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.value-object";

describe("User Entity", () => {
  describe("updateProfile", () => {
    it("should update user name successfully", () => {
      // Arrange
      const user = new User(
        {
          name: "John Doe",
          email: Email.create("john@example.com"),
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        "user-123",
      );

      // Act
      user.updateProfile("Jane Doe");

      // Assert
      expect(user.name).toBe("Jane Doe");
    });

    it("should update timestamp when profile is updated", () => {
      const user = new User(
        {
          name: "John",
          email: Email.create("john@example.com"),
          image: null,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date("2023-01-01"),
        },
        "user-123",
      );

      const oldUpdatedAt = user.updatedAt;
      user.updateProfile("Jane");

      expect(user.updatedAt).not.toEqual(oldUpdatedAt);
    });
  });

  describe("isAdmin", () => {
    it("should return true for admin role", () => {
      const admin = new User(
        {
          name: "Admin",
          email: Email.create("admin@example.com"),
          role: "ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        "admin-123",
      );

      expect(admin.isAdmin()).toBe(true);
    });

    it("should return false for user role", () => {
      const user = new User(
        {
          name: "User",
          email: Email.create("user@example.com"),
          role: "USER",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        "user-123",
      );

      expect(user.isAdmin()).toBe(false);
    });
  });
});
```

### Example 2: Value Object Test

```typescript
// src/features/user/domain/__tests__/email.value-object.test.ts
import { describe, expect, it } from "vitest";
import { Email } from "../value-objects/email.value-object";

describe("Email Value Object", () => {
  describe("create", () => {
    it("should create email with valid format", () => {
      const email = Email.create("john@example.com");

      expect(email.value).toBe("john@example.com");
    });

    it("should normalize email to lowercase", () => {
      const email = Email.create("John@Example.COM");

      expect(email.value).toBe("john@example.com");
    });

    it("should throw error for invalid email format", () => {
      expect(() => Email.create("invalid-email")).toThrow("Invalid email format");
    });

    it("should throw error for empty email", () => {
      expect(() => Email.create("")).toThrow("Invalid email format");
    });

    it("should throw error for email without domain", () => {
      expect(() => Email.create("john@")).toThrow("Invalid email format");
    });
  });
});
```

### Example 3: Use Case Test with Mocks

```typescript
// src/features/user/application/__tests__/update-user-profile.use-case.test.ts
import { describe, expect, it, vi } from "vitest";
import { UpdateUserProfileUseCase } from "../use-cases/update-user-profile.use-case";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";
import { HttpError } from "@/shared/domain/errors";

describe("UpdateUserProfileUseCase", () => {
  const createMockUser = () =>
    new User(
      {
        name: "John Doe",
        email: Email.create("john@example.com"),
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      "user-123",
    );

  describe("execute", () => {
    it("should update user profile successfully", async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockRepository: IUserRepository = {
        findById: vi.fn().mockResolvedValue(mockUser),
        save: vi.fn().mockResolvedValue(mockUser),
      };

      const useCase = new UpdateUserProfileUseCase(mockRepository);

      // Act
      const result = await useCase.execute({
        userId: "user-123",
        name: "Jane Doe",
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.findById).toHaveBeenCalledWith("user-123");
      expect(mockRepository.save).toHaveBeenCalledWith(mockUser);
    });

    it("should fail when user not found", async () => {
      // Arrange
      const mockRepository: IUserRepository = {
        findById: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      };

      const useCase = new UpdateUserProfileUseCase(mockRepository);

      // Act
      const result = await useCase.execute({
        userId: "invalid-id",
        name: "Jane Doe",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(HttpError);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockRepository: IUserRepository = {
        findById: vi.fn().mockRejectedValue(new Error("Database error")),
        save: vi.fn(),
      };

      const useCase = new UpdateUserProfileUseCase(mockRepository);

      // Act
      const result = await useCase.execute({
        userId: "user-123",
        name: "Jane Doe",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe("Database error");
    });
  });
});
```

---

## Mocking with Vitest

### Mock Repository

```typescript
const mockRepository: IUserRepository = {
  findById: vi.fn().mockResolvedValue(mockUser),
  findByEmail: vi.fn().mockResolvedValue(null),
  save: vi.fn().mockResolvedValue(mockUser),
  delete: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue({ users: [], total: 0 }),
};
```

### Mock External Service (Port)

```typescript
const mockEmailProvider: IEmailProvider = {
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
};
```

### Verify Mock Calls

```typescript
// Called once
expect(mockRepository.findById).toHaveBeenCalledTimes(1);

// Called with specific arguments
expect(mockRepository.findById).toHaveBeenCalledWith("user-123");

// Never called
expect(mockRepository.save).not.toHaveBeenCalled();
```

---

## Testing Edge Cases

Always test:

1. **Success path** - Happy path with valid input
2. **Not found** - Entity doesn't exist
3. **Validation errors** - Invalid input
4. **Permission errors** - Unauthorized access
5. **State errors** - Invalid state transitions
6. **Boundary conditions** - Min/max values, empty lists
7. **Error handling** - Repository/service failures

---

## Best Practices

1. **Use descriptive test names** - `it("should do X when Y")`
2. **Follow Arrange-Act-Assert** - Clear test structure
3. **Test one thing per test** - Single assertion focus
4. **Mock external dependencies** - Repositories, services
5. **Test edge cases** - Not just happy path
6. **Keep tests simple** - Easy to read and maintain
7. **Don't test implementation details** - Test behavior
8. **Run tests before committing** - Use `pnpm test:run`

---

## Running Tests

```bash
# Run all tests
pnpm test:run

# Run specific test file
pnpm test:run user.entity.test.ts

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run tests for specific feature
pnpm test:run src/features/user
```

---

## When Tests Should Pass

Tests must pass in these scenarios:

- ✅ Before creating a commit
- ✅ Before creating a pull request
- ✅ In CI/CD pipeline
- ✅ After refactoring code
- ✅ After adding new features

**Never commit failing tests.**

---

See [examples.md](./examples.md) for more comprehensive test examples and [coverage.md](./coverage.md) for coverage configuration details.
