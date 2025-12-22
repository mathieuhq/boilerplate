---
name: clean-architecture
description: Clean Architecture patterns and domain structure. Use when creating entities, value objects, use cases, repositories, or working with the DI container. Triggers on domain layer, application layer, infrastructure, entities, value objects, use cases, repositories, DI container, Result pattern.
---

# Clean Architecture

## Domain Structure

```
src/features/{domain}/
├── domain/
│   ├── entities/           # Rich domain objects
│   ├── value-objects/      # Immutable validated objects
│   ├── repositories/       # Repository interfaces
│   └── errors/             # Domain-specific errors
├── application/
│   ├── use-cases/          # Business operations
│   ├── dto/                # Data transfer objects
│   └── ports/              # External service interfaces
├── infrastructure/
│   ├── repositories/       # Prisma implementations
│   ├── adapters/           # External service adapters
│   └── mappers/            # Entity-persistence mappers
└── interface/
    ├── controllers/        # HTTP/Action handlers
    └── schemas/            # Zod validation schemas
```

## Key Patterns

**Entities**: Rich domain objects extending `Entity<Props>` with business methods.

**Value Objects**: Immutable objects extending `ValueObject<Props>` with validation in `create()`.

**Use Cases**: Single responsibility operations implementing `IUseCase<Input, Output>`.

**Result Pattern**: Use cases return `Result<T>` for explicit success/failure:

```typescript
const result = await useCase.execute(input);
if (result.isFailure) throw result.error;
return result.value;
```

## DI Container

```typescript
import { container } from "@/shared/infrastructure/di/container";

const userController = container.getUserController();
const adminController = container.getAdminController();
const storageController = container.getStorageController();
```

See [reference.md](reference.md) for dependency flow and interfaces.
See [examples.md](examples.md) for real entity, use case, and repository examples.
