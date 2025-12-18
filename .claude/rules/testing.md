# Testing

**IMPORTANT: All code changes MUST include tests.**

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

## Example

```typescript
import { describe, expect, it, vi } from "vitest";

describe("UpdateUserProfileUseCase", () => {
  it("should update user profile successfully", async () => {
    const mockRepository = { findById: vi.fn(), save: vi.fn() };
    const useCase = new UpdateUserProfileUseCase(mockRepository);

    const result = await useCase.execute(input);

    expect(result.isSuccess).toBe(true);
  });
});
```
