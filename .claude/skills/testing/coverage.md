# Test Coverage Requirements

Detailed coverage requirements and configuration.

## Coverage Thresholds

The project enforces minimum coverage thresholds across all metrics.

```json
{
  "coverage": {
    "lines": 80,
    "branches": 80,
    "functions": 80,
    "statements": 80
  }
}
```

All four metrics must meet or exceed 80% for the build to pass.

---

## Understanding Coverage Metrics

### Lines Coverage

Percentage of executable lines that were run during tests.

```typescript
export class User {
  updateProfile(name: string): void {
    this.props.name = name;              // Line 1 ✓ Covered
    this.props.updatedAt = new Date();   // Line 2 ✓ Covered
  }
}

// Test executes both lines = 100% line coverage
```

### Branch Coverage

Percentage of conditional branches (if/else, switch, ternary) that were tested.

```typescript
export class User {
  canDelete(): boolean {
    if (this.role === "ADMIN") {
      return false;  // Branch A ✓ Covered
    }
    return true;     // Branch B ✓ Covered
  }
}

// Need tests for both ADMIN and non-ADMIN cases
// Both branches tested = 100% branch coverage
```

### Function Coverage

Percentage of functions that were called during tests.

```typescript
export class User {
  getName(): string {       // Function A ✓ Covered
    return this.props.name;
  }

  getEmail(): string {      // Function B ✗ Not covered
    return this.props.email.value;
  }
}

// Only getName() tested = 50% function coverage
```

### Statement Coverage

Percentage of statements that were executed.

```typescript
export class User {
  updateProfile(name: string, image?: string): void {
    this.props.name = name;                          // Statement 1 ✓
    if (image !== undefined) {                       // Statement 2 ✓
      this.props.image = image;                      // Statement 3 ✓
    }
    this.props.updatedAt = new Date();              // Statement 4 ✓
  }
}

// All statements executed = 100% statement coverage
```

---

## What Counts Toward Coverage

### ✅ Included in Coverage

- Domain entities (`src/features/*/domain/entities/`)
- Value objects (`src/features/*/domain/value-objects/`)
- Use cases (`src/features/*/application/use-cases/`)
- Repository implementations (`src/features/*/infrastructure/repositories/`)
- Adapters (`src/features/*/infrastructure/adapters/`)
- Controllers (`src/features/*/interface/controllers/`)

### ❌ Excluded from Coverage

- Files outside `src/` directory
- Test files (`*.test.ts`)
- Type definitions (`*.d.ts`)
- Configuration files

---

## Running Coverage Reports

### Basic Coverage Report

```bash
pnpm test:coverage
```

Generates coverage report in terminal and HTML report in `coverage/` directory.

### View HTML Report

```bash
pnpm test:coverage
open coverage/index.html
```

HTML report shows:
- Overall coverage percentages
- File-by-file breakdown
- Line-by-line coverage visualization
- Uncovered lines highlighted

### Coverage for Specific Files

```bash
pnpm test:coverage src/features/user
```

---

## Improving Coverage

### Identify Uncovered Code

```bash
pnpm test:coverage
```

Look for:
- Red highlighted lines (uncovered)
- Yellow highlighted lines (partially covered branches)
- Coverage percentages below 80%

### Example: Improving Branch Coverage

**Before (50% branch coverage):**

```typescript
export class User {
  isAdmin(): boolean {
    if (this.role === "ADMIN") {
      return true;
    }
    return false;
  }
}

// Test only checks ADMIN case
describe("isAdmin", () => {
  it("should return true for admin", () => {
    const admin = createUser({ role: "ADMIN" });
    expect(admin.isAdmin()).toBe(true);
  });
});
```

**After (100% branch coverage):**

```typescript
describe("isAdmin", () => {
  it("should return true for admin", () => {
    const admin = createUser({ role: "ADMIN" });
    expect(admin.isAdmin()).toBe(true);
  });

  it("should return false for regular user", () => {
    const user = createUser({ role: "USER" });
    expect(user.isAdmin()).toBe(false);
  });
});
```

### Example: Improving Function Coverage

**Before (67% function coverage):**

```typescript
export class User {
  getName(): string {
    return this.props.name;
  }

  getEmail(): string {
    return this.props.email.value;
  }

  getRole(): string {
    return this.props.role;
  }
}

// Only 2 of 3 functions tested
describe("User", () => {
  it("should get name", () => {
    expect(user.getName()).toBe("John");
  });

  it("should get email", () => {
    expect(user.getEmail()).toBe("john@example.com");
  });
});
```

**After (100% function coverage):**

```typescript
describe("User", () => {
  it("should get name", () => {
    expect(user.getName()).toBe("John");
  });

  it("should get email", () => {
    expect(user.getEmail()).toBe("john@example.com");
  });

  it("should get role", () => {
    expect(user.getRole()).toBe("USER");
  });
});
```

---

## Common Coverage Issues

### Issue 1: Untested Error Paths

```typescript
export class UpdateUserUseCase {
  async execute(input: UpdateUserDTO): Promise<Result<void>> {
    try {
      const user = await this.repository.findById(input.userId);

      if (!user) {
        return Result.fail(HttpError.notFound("User")); // ❌ Not tested
      }

      user.updateProfile(input.name);
      await this.repository.save(user);

      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error); // ❌ Not tested
    }
  }
}
```

**Fix:** Add tests for error cases:

```typescript
it("should fail when user not found", async () => {
  mockRepository.findById = vi.fn().mockResolvedValue(null);
  const result = await useCase.execute({ userId: "invalid", name: "John" });
  expect(result.isFailure).toBe(true);
});

it("should handle repository errors", async () => {
  mockRepository.findById = vi.fn().mockRejectedValue(new Error("DB error"));
  const result = await useCase.execute({ userId: "user-123", name: "John" });
  expect(result.isFailure).toBe(true);
});
```

### Issue 2: Missing Branch Tests

```typescript
export class Subscription {
  canUpgrade(): boolean {
    if (this.status === "ACTIVE" && this.plan === "FREE") {
      return true; // ❌ Only this branch tested
    }
    return false; // ❌ Other branches not tested
  }
}
```

**Fix:** Test all branches:

```typescript
it("should allow upgrade for active free plan", () => {
  const sub = createSubscription({ status: "ACTIVE", plan: "FREE" });
  expect(sub.canUpgrade()).toBe(true);
});

it("should not allow upgrade for cancelled subscription", () => {
  const sub = createSubscription({ status: "CANCELLED", plan: "FREE" });
  expect(sub.canUpgrade()).toBe(false);
});

it("should not allow upgrade for pro plan", () => {
  const sub = createSubscription({ status: "ACTIVE", plan: "PRO" });
  expect(sub.canUpgrade()).toBe(false);
});
```

### Issue 3: Uncovered Optional Parameters

```typescript
export class User {
  updateProfile(name: string, image?: string): void {
    this.props.name = name;
    if (image !== undefined) {
      this.props.image = image; // ❌ Optional path not tested
    }
    this.props.updatedAt = new Date();
  }
}
```

**Fix:** Test both with and without optional parameter:

```typescript
it("should update name only", () => {
  user.updateProfile("Jane");
  expect(user.name).toBe("Jane");
  expect(user.image).toBeNull();
});

it("should update name and image", () => {
  user.updateProfile("Jane", "avatar.png");
  expect(user.name).toBe("Jane");
  expect(user.image).toBe("avatar.png");
});
```

---

## Coverage Best Practices

1. **Aim for 100% where practical** - 80% is the minimum, not the target
2. **Focus on meaningful tests** - Don't write tests just to hit coverage numbers
3. **Test behavior, not implementation** - Coverage should come naturally from good tests
4. **Check coverage regularly** - Run `pnpm test:coverage` before committing
5. **Review HTML reports** - Visual inspection helps identify gaps
6. **Test edge cases** - null/undefined, empty arrays, boundary values
7. **Don't skip error paths** - Error handling is critical to test
8. **Test all branches** - Every if/else and switch case

---

## CI/CD Integration

Coverage checks run automatically in CI/CD pipeline:

```yaml
- name: Run tests with coverage
  run: pnpm test:coverage

- name: Check coverage thresholds
  run: |
    # Build fails if any metric below 80%
```

**Pull requests will be blocked if coverage drops below 80%.**

---

## Coverage Exceptions

In rare cases, certain code may be difficult to test (e.g., complex third-party integrations). Document exceptions:

```typescript
/* istanbul ignore next */
export function legacyIntegration() {
  // Complex third-party code that's hard to mock
}
```

**Use sparingly** - Most code should be testable with proper mocking.

---

## Troubleshooting

### Coverage Not Updating

```bash
# Clear coverage cache
rm -rf coverage/
pnpm test:coverage
```

### Incorrect Coverage Numbers

```bash
# Ensure all tests are running
pnpm test:run

# Check for skipped tests (it.skip, describe.skip)
```

### HTML Report Not Generating

```bash
# Verify vitest config includes coverage reporter
pnpm test:coverage --reporter=html
```
