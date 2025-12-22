---
name: clean-architecture
description: "Domain structure with entities, value objects, repositories, and use cases. Dependency injection setup using DI container. Use when designing new domain features, organizing application and infrastructure layers, setting up repository patterns, or implementing clean architecture for new modules."
---

## Overview

This codebase uses Clean Architecture with clear separation of concerns across four layers. Each feature is organized as an independent domain module with well-defined boundaries and dependencies flowing inward.

## Domain Structure

```
src/features/{domain}/
├── domain/
│   ├── entities/           # Domain entities
│   ├── value-objects/      # Immutable value objects
│   ├── repositories/       # Repository interfaces
│   └── errors/             # Domain-specific errors
├── application/
│   ├── use-cases/          # Business operations
│   ├── dto/                # Data transfer objects
│   └── ports/              # External service interfaces
├── infrastructure/
│   ├── repositories/       # Repository implementations
│   ├── adapters/           # External service adapters
│   └── mappers/            # Entity-persistence mappers
└── interface/
    ├── controllers/        # HTTP/Action handlers
    └── schemas/            # Zod validation schemas
```

## Dependency Flow

```
FRAMEWORKS & DRIVERS (Next.js, Prisma)
         ↓
INTERFACE ADAPTERS (Controllers, Schemas)
         ↓
APPLICATION LAYER (Use Cases, DTOs, Ports)
         ↓
DOMAIN LAYER (Entities, Value Objects, Repository interfaces)

INFRASTRUCTURE (Repository impls, Adapters) → implements Domain/Application interfaces
```

**Key principle**: Dependencies always point inward. The domain layer has no external dependencies.

## DI Container

Access controllers through the centralized dependency injection container:

```typescript
import { container } from "@/shared/infrastructure/di/container";

const userController = container.getUserController();
const emailController = container.getEmailController();
const authController = container.getAuthController();
const adminController = container.getAdminController();
const storageController = container.getStorageController();
```

The container manages all dependencies and wiring between layers.

## Core Patterns

### Entities

Rich domain objects with business logic extending `Entity<Props>`. Entities have:
- Identity (unique ID)
- Business logic methods
- Validation rules
- State management

### Value Objects

Immutable objects with validation extending `ValueObject<Props>`. Value objects:
- Are identified by their properties (not ID)
- Validate on construction
- Are immutable
- Can be compared by value

### Use Cases

Single responsibility operations implementing `IUseCase<Input, Output>`. Each use case:
- Represents one business operation
- Has a single `execute()` method
- Returns `Result<T>` for explicit success/failure handling
- Depends on repository interfaces (not implementations)

### Result Pattern

Use cases return `Result<T>` to handle success/failure explicitly:

```typescript
const result = await useCase.execute(input);
if (result.isFailure) {
  throw result.error;
}
return result.value;
```

This pattern eliminates the need for try-catch blocks in controllers and makes error handling explicit.

## Repository Pattern

Repositories abstract data access with:
- **Interface** in domain layer (e.g., `IUserRepository`)
- **Implementation** in infrastructure layer (e.g., `PrismaUserRepository`)
- **Mapper** to convert between domain entities and persistence models

This separation allows changing persistence mechanisms without affecting business logic.

## Ports and Adapters

For external services (email, payment, storage):
- **Port** (interface) in application layer defines what the application needs
- **Adapter** (implementation) in infrastructure layer provides the actual service
- Examples: `IEmailProvider` port, `ResendAdapter` implementation

## When to Use Each Layer

| Layer | Use For | Examples |
|-------|---------|----------|
| **Domain** | Business rules, entities, core logic | User entity, Email value object, IUserRepository interface |
| **Application** | Use cases, orchestration | UpdateUserProfileUseCase, SendWelcomeEmailUseCase |
| **Infrastructure** | Technical implementations | PrismaUserRepository, ResendAdapter, R2StorageAdapter |
| **Interface** | HTTP/API handling, validation | UserController, user.schema.ts |

## Creating a New Feature

Follow this order:

1. **Domain Layer**: Create entities, value objects, repository interfaces
2. **Application Layer**: Create use cases, DTOs, ports (if external services needed)
3. **Infrastructure Layer**: Implement repositories, adapters, mappers
4. **Interface Layer**: Create controllers, Zod schemas
5. **DI Container**: Wire up dependencies in `container.ts`
6. **Routes/Actions**: Create API routes or server actions that use controllers

See [patterns.md](./patterns.md) for detailed implementation patterns and [examples.md](./examples.md) for complete code samples.
