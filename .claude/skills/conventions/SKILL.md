---
name: conventions
description: "Naming conventions for files and exports, import ordering rules, code style (line width, indentation, quotes), path aliases, and TypeScript patterns. Use when creating new files, naming classes, organizing imports, or ensuring code style consistency."
---

## Naming Conventions

Consistent naming patterns across the codebase for all file types.

| Type                 | Pattern                          | Example                           |
| -------------------- | -------------------------------- | --------------------------------- |
| Entity               | `{name}.entity.ts`               | `user.entity.ts`                  |
| Value Object         | `{name}.value-object.ts`         | `email.value-object.ts`           |
| Repository Interface | `{name}.repository.interface.ts` | `user.repository.interface.ts`    |
| Repository Impl      | `prisma-{name}.repository.ts`    | `prisma-user.repository.ts`       |
| Use Case             | `{verb}-{noun}.use-case.ts`      | `update-user-profile.use-case.ts` |
| DTO                  | `{name}.dto.ts`                  | `user-response.dto.ts`            |
| Port                 | `{name}.port.ts`                 | `email-provider.port.ts`          |
| Adapter              | `{provider}.adapter.ts`          | `resend.adapter.ts`               |
| Controller           | `{domain}.controller.ts`         | `user.controller.ts`              |
| Mapper               | `prisma-{name}.mapper.ts`        | `prisma-user.mapper.ts`           |
| Schema               | `{domain}.schema.ts`             | `user.schema.ts`                  |
| Error                | `{name}.error.ts`                | `user-not-found.error.ts`         |
| Test File            | `{name}.test.ts`                 | `user.entity.test.ts`             |
| Component            | `{name}.tsx`                     | `button.tsx`                      |
| Hook                 | `use-{name}.ts`                  | `use-auth.ts`                     |
| Type                 | `{name}.type.ts`                 | `auth-user.type.ts`               |
| Constant             | `{name}.constants.ts`            | `sidebar.constants.tsx`           |

---

## Export Patterns

Different export patterns for components vs functions.

### TSX Components: Always `export const` with Arrow Functions

```tsx
// ✅ Correct
export const Button = ({ children }: ButtonProps) => {
  return <button>{children}</button>;
};

// ❌ Incorrect
export function Button({ children }: ButtonProps) {
  return <button>{children}</button>;
}
```

**Reasoning**: Consistency with React ecosystem and hook patterns.

### Functions: Always `function` Declaration

```typescript
// ✅ Correct
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Incorrect
export const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

**Reasoning**: Function declarations are hoisted and provide better stack traces.

### Classes: Standard Class Declaration

```typescript
// ✅ Correct
export class User extends Entity<UserProps> {
  // ...
}

// ✅ Also correct for interfaces/types
export interface IUserRepository {
  // ...
}

export type UserRole = "USER" | "ADMIN";
```

---

## Import Order

Imports are automatically organized by ESLint in this order:

1. **React imports**
2. **Next.js imports**
3. **External packages**
4. **Internal absolute imports** (`@/`)
5. **Relative imports**
6. **CSS imports**

### Example

```typescript
// 1. React
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

// 2. Next.js
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

// 3. External packages
import { z } from "zod";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

// 4. Internal absolute imports (@/)
import { Button } from "@/components/ui/button";
import { container } from "@/shared/infrastructure/di/container";
import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";

// 5. Relative imports
import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.value-object";
import type { UpdateUserProfileDTO } from "./dto/update-user-profile.dto";

// 6. CSS imports
import "./styles.css";
```

**Note**: ESLint auto-fix will sort these for you. Run `pnpm lint` to apply.

---

## Code Style

Enforced by Prettier and ESLint.

### Line Width

**Maximum 80 characters**

```typescript
// ✅ Good - within 80 characters
const user = await userRepository.findById(id);

// ❌ Bad - exceeds 80 characters, needs wrapping
const user = await userRepository.findByIdWithFullProfileIncludingSubscriptionAndPaymentHistory(id);

// ✅ Good - properly wrapped
const user =
  await userRepository.findByIdWithFullProfileIncludingSubscriptionAndPaymentHistory(
    id,
  );
```

### Indentation

**2 spaces** (no tabs)

```typescript
// ✅ Correct
export class User {
  updateProfile(name: string): void {
    this.props.name = name;
  }
}

// ❌ Incorrect (4 spaces or tabs)
export class User {
    updateProfile(name: string): void {
        this.props.name = name;
    }
}
```

### Quotes

**Double quotes** for strings

```typescript
// ✅ Correct
const message = "Hello, world!";
const error = "User not found";

// ❌ Incorrect
const message = 'Hello, world!';
const error = 'User not found';
```

**Exception**: Single quotes within JSX to avoid escaping

```tsx
// ✅ Correct
<div className="text-lg">User's profile</div>

// ❌ Incorrect (requires escaping)
<div className="text-lg">User\'s profile</div>
```

### Semicolons

**Required** at end of statements

```typescript
// ✅ Correct
const user = await repository.findById(id);
return user;

// ❌ Incorrect
const user = await repository.findById(id)
return user
```

### Trailing Commas

**Always** use trailing commas in multiline structures

```typescript
// ✅ Correct
const obj = {
  name: "John",
  age: 30,
  email: "john@example.com", // Trailing comma
};

// ❌ Incorrect
const obj = {
  name: "John",
  age: 30,
  email: "john@example.com" // Missing trailing comma
};
```

---

## Path Aliases

Use path aliases for cleaner imports.

### Available Aliases

| Alias            | Resolves To                 | Use For                        |
| ---------------- | --------------------------- | ------------------------------ |
| `@/*`            | Root directory              | General imports                |
| `@/features/*`   | `src/features`              | Feature modules                |
| `@/shared/*`     | `src/shared`                | Shared domain/infrastructure   |
| `@/components/*` | `components`                | React components               |
| `@/lib/*`        | `lib`                       | Utilities and helpers          |
| `@/actions/*`    | `actions`                   | Server actions                 |

### Example Usage

```typescript
// ✅ Use aliases for absolute imports
import { Button } from "@/components/ui/button";
import { User } from "@/features/user/domain/entities/user.entity";
import { container } from "@/shared/infrastructure/di/container";

// ✅ Use relative imports within same feature
import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.value-object";

// ❌ Don't use long relative paths
import { Button } from "../../../../../components/ui/button";
```

---

## TypeScript Patterns

### Type vs Interface

**Use `type` for:**
- Primitives and unions
- Mapped types
- Function types

```typescript
// ✅ Types
export type UserRole = "USER" | "ADMIN";
export type UserId = string;
export type Handler = (req: Request) => Promise<Response>;
```

**Use `interface` for:**
- Object shapes
- Repository contracts
- API contracts
- Extending other interfaces

```typescript
// ✅ Interfaces
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export interface UserProps {
  name: string;
  email: Email;
  role: UserRole;
}
```

### Type Annotations

**Always annotate function return types**

```typescript
// ✅ Correct
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Incorrect (missing return type)
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Exception**: React components can omit explicit return type

```tsx
// ✅ Acceptable
export const Button = ({ children }: ButtonProps) => {
  return <button>{children}</button>;
};

// ✅ Also acceptable
export const Button = ({ children }: ButtonProps): JSX.Element => {
  return <button>{children}</button>;
};
```

### Async/Await

**Always use async/await** (avoid raw promises)

```typescript
// ✅ Correct
export async function getUser(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw HttpError.notFound("User");
  }
  return user;
}

// ❌ Incorrect (promise chains)
export function getUser(id: string): Promise<User> {
  return userRepository.findById(id).then((user) => {
    if (!user) {
      throw HttpError.notFound("User");
    }
    return user;
  });
}
```

---

## Class and Variable Naming

### Classes

**PascalCase** for classes, interfaces, types

```typescript
// ✅ Correct
export class User extends Entity<UserProps> {}
export interface IUserRepository {}
export type UserRole = "USER" | "ADMIN";

// ❌ Incorrect
export class user extends Entity<UserProps> {}
export interface iUserRepository {}
export type userRole = "USER" | "ADMIN";
```

### Variables and Functions

**camelCase** for variables, functions, and methods

```typescript
// ✅ Correct
const userName = "John";
function getUserById(id: string) {}
const userRepository = container.getUserRepository();

// ❌ Incorrect
const UserName = "John";
function GetUserById(id: string) {}
const UserRepository = container.getUserRepository();
```

### Constants

**UPPER_SNAKE_CASE** for true constants

```typescript
// ✅ Correct
export const MAX_FILE_SIZE = 1024 * 1024 * 10; // 10MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

// ❌ Incorrect
export const maxFileSize = 1024 * 1024 * 10;
export const allowedFileTypes = ["image/jpeg", "image/png"];
```

### Booleans

**Prefix with is/has/should/can**

```typescript
// ✅ Correct
const isAuthenticated = true;
const hasPermission = user.isAdmin();
const shouldRedirect = !session;
const canDelete = user.role === "ADMIN";

// ❌ Incorrect
const authenticated = true;
const permission = user.isAdmin();
const redirect = !session;
const deleteAllowed = user.role === "ADMIN";
```

---

## Tailwind Class Sorting

Tailwind classes are automatically sorted by Prettier plugin.

```tsx
// Before (unsorted)
<div className="text-white p-4 bg-blue-500 rounded-lg mt-2">
  Content
</div>

// After (auto-sorted by Prettier)
<div className="mt-2 rounded-lg bg-blue-500 p-4 text-white">
  Content
</div>
```

Run `pnpm format` to apply Tailwind sorting.

---

## Comments

### When to Comment

**Do comment:**
- Complex business logic
- Non-obvious algorithms
- Workarounds for known issues
- Public API documentation (JSDoc)

```typescript
/**
 * Calculates the compound interest for a subscription
 * @param principal - Initial amount
 * @param rate - Interest rate (as decimal, e.g., 0.05 for 5%)
 * @param time - Time period in years
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
): number {
  // Use compound interest formula: A = P(1 + r)^t
  return principal * Math.pow(1 + rate, time);
}
```

**Don't comment:**
- Self-explanatory code
- What the code does (code should be self-documenting)
- Commented-out code (delete it)

```typescript
// ❌ Bad - comment restates the code
// Get user by ID
const user = await userRepository.findById(id);

// ❌ Bad - commented-out code
// const oldImplementation = await fetchUser(id);

// ✅ Good - no comment needed, code is clear
const user = await userRepository.findById(id);
```

---

## File Organization

### Single Responsibility

Each file should have a single, clear purpose.

```typescript
// ✅ Good - user.entity.ts contains only User entity
export class User extends Entity<UserProps> {
  // User-specific logic
}

// ❌ Bad - user.entity.ts contains User AND unrelated logic
export class User extends Entity<UserProps> {}
export class Subscription extends Entity<SubscriptionProps> {}
export function formatDate(date: Date) {}
```

### Index Files

**Avoid index.ts files** for re-exports (causes circular dependencies).

```typescript
// ❌ Avoid
// features/user/domain/entities/index.ts
export * from "./user.entity";
export * from "./profile.entity";

// ✅ Import directly
import { User } from "@/features/user/domain/entities/user.entity";
```

---

## Linting and Formatting

### Commands

```bash
pnpm lint         # Run ESLint with auto-fix
pnpm format       # Run Prettier
```

### Pre-commit Hooks

Linting and formatting run automatically before commits via Husky.

**Don't skip these checks** - they ensure code quality and consistency.

---

## Best Practices Summary

1. ✅ Follow naming conventions strictly
2. ✅ Use `export const` for components, `function` for utilities
3. ✅ Let ESLint sort imports automatically
4. ✅ Keep lines under 80 characters
5. ✅ Use double quotes for strings
6. ✅ Always include semicolons
7. ✅ Use path aliases for absolute imports
8. ✅ Annotate return types on functions
9. ✅ Use async/await over promise chains
10. ✅ Run `pnpm lint` and `pnpm format` before committing
