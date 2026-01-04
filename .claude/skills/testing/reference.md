# Testing Reference

## Test Structure

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("FeatureName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("methodName", () => {
    it("should do something when condition", async () => {
      // Arrange
      const input = { ... };

      // Act
      const result = await feature.method(input);

      // Assert
      expect(result.isSuccess).toBe(true);
    });
  });
});
```

## Mock Patterns

### Mock Repository

```typescript
const mockUserRepository = {
  findById: vi.fn(),
  findByEmail: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  isEmailTaken: vi.fn(),
};
```

### Mock Port/Adapter

```typescript
const mockEmailProvider = {
  sendEmail: vi.fn().mockResolvedValue(undefined),
};
```

## Assertion Patterns

```typescript
// Result pattern
expect(result.isSuccess).toBe(true);
expect(result.isFailure).toBe(true);
expect(result.value).toEqual(expected);
expect(result.error).toBeInstanceOf(UserNotFoundError);

// Value object
expect(email.value).toBe("test@example.com");
expect(() => Email.create("invalid")).toThrow();

// Entity
expect(user.id.value).toBe("user-123");
expect(user.email.equals(otherEmail)).toBe(true);

// Mock calls
expect(mockRepository.save).toHaveBeenCalledWith(user);
expect(mockRepository.save).toHaveBeenCalledTimes(1);
```

## Test File Locations

| Layer        | Location                                       |
| ------------ | ---------------------------------------------- |
| Entity       | `src/features/{domain}/domain/__tests__/`      |
| Value Object | `src/features/{domain}/domain/__tests__/`      |
| Use Case     | `src/features/{domain}/application/__tests__/` |

## Coverage Thresholds

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80,
  },
}
```

## What NOT to Test

- Files in `lib/`, `app/`, `actions/`, `components/`
- Third-party library internals
- Prisma queries (integration tests if needed)
- Configuration files
