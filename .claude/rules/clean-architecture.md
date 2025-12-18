# Clean Architecture

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

## DI Container

```typescript
import { container } from "@/shared/infrastructure/di/container";

const userController = container.getUserController();
const emailController = container.getEmailController();
const authController = container.getAuthController();
const adminController = container.getAdminController();
```

## Key Patterns

**Entities**: Rich domain objects with business logic extending `Entity<Props>`

**Value Objects**: Immutable objects with validation extending `ValueObject<Props>`

**Use Cases**: Single responsibility operations implementing `IUseCase<Input, Output>`

**Result Pattern**: Use cases return `Result<T>` for explicit success/failure handling

```typescript
const result = await useCase.execute(input);
if (result.isFailure) throw result.error;
return result.value;
```
