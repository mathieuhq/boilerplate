# Clean Architecture Reference

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

## Layer Responsibilities

| Layer          | Contains                          | Depends On       |
| -------------- | --------------------------------- | ---------------- |
| Domain         | Entities, VOs, Repository IFs     | Nothing          |
| Application    | Use Cases, DTOs, Ports            | Domain           |
| Infrastructure | Prisma repos, Adapters, Mappers   | Domain, App      |
| Interface      | Controllers, Schemas              | Application      |

## Base Classes

```typescript
// Entity base
import { Entity } from "@/shared/domain/entity";

// Value Object base
import { ValueObject } from "@/shared/domain/value-object";

// Use Case interface
import { IUseCase } from "@/shared/application/use-case.interface";

// Result type
import { Result } from "@/shared/domain/result";
```

## DI Container Methods

| Method                    | Returns           |
| ------------------------- | ----------------- |
| `getUserController()`     | UserController    |
| `getAuthController()`     | AuthController    |
| `getAdminController()`    | AdminController   |
| `getEmailController()`    | EmailController   |
| `getStorageController()`  | StorageController |
| `getPaymentController()`  | PaymentController |

## Repository Interface Pattern

```typescript
interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(user: User): Promise<void>;
  isEmailTaken(email: Email, excludeId?: UserId): Promise<boolean>;
}
```

## Mapper Pattern

```typescript
// Bidirectional mapping
toDomain(prismaModel: PrismaUser): User
toPersistence(entity: User): PrismaUserCreateInput
```
