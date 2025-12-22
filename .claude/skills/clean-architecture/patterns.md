# Clean Architecture Patterns

Detailed implementation patterns for each layer of the clean architecture.

## Entity Pattern

Entities are rich domain objects with business logic and identity.

```typescript
import { Entity } from "@/shared/domain/entity";

interface UserProps {
  name: string;
  email: Email; // Value object
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  get name(): string {
    return this.props.name;
  }

  get email(): Email {
    return this.props.email;
  }

  get role(): UserRole {
    return this.props.role;
  }

  updateProfile(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  isAdmin(): boolean {
    return this.props.role === "ADMIN";
  }

  static create(props: Omit<UserProps, "createdAt" | "updatedAt">, id?: string): User {
    return new User(
      {
        ...props,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }
}
```

**Key points**:
- Extend `Entity<Props>`
- Use getters for properties
- Business logic methods (updateProfile, isAdmin)
- Static factory method for creation
- Validation in constructor or factory

## Value Object Pattern

Value objects are immutable and identified by their properties.

```typescript
import { ValueObject } from "@/shared/domain/value-object";

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value;
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error("Invalid email format");
    }
    return new Email({ value: email.toLowerCase() });
  }
}
```

**Key points**:
- Extend `ValueObject<Props>`
- Immutable (no setters)
- Validation in factory method
- Compared by value, not identity

## Repository Interface Pattern

Repository interfaces define data access contracts in the domain layer.

```typescript
// domain/repositories/user.repository.interface.ts
import type { User } from "../entities/user.entity";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  list(params: { skip?: number; take?: number }): Promise<{
    users: User[];
    total: number;
  }>;
}
```

**Key points**:
- Define methods using domain entities (not Prisma models)
- Return domain objects
- Place in domain layer
- No implementation details

## Repository Implementation Pattern

Repository implementations convert between domain entities and persistence models.

```typescript
// infrastructure/repositories/prisma-user.repository.ts
import { prisma } from "@/lib/generated/prisma";
import type { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { PrismaUserMapper } from "../mappers/prisma-user.mapper";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? PrismaUserMapper.toDomain(user) : null;
  }

  async save(user: User): Promise<User> {
    const persistenceModel = PrismaUserMapper.toPersistence(user);
    const saved = await prisma.user.upsert({
      where: { id: user.id },
      create: persistenceModel,
      update: persistenceModel,
    });
    return PrismaUserMapper.toDomain(saved);
  }

  // ... other methods
}
```

**Key points**:
- Implement repository interface
- Use mapper to convert between domain and persistence
- Place in infrastructure layer
- Handle Prisma-specific logic here

## Mapper Pattern

Mappers convert between domain entities and persistence models.

```typescript
// infrastructure/mappers/prisma-user.mapper.ts
import type { User as PrismaUser } from "@/lib/generated/prisma";
import { Email } from "../../domain/value-objects/email.value-object";
import { User } from "../../domain/entities/user.entity";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        name: raw.name,
        email: Email.create(raw.email),
        role: raw.role,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(user: User): Omit<PrismaUser, "id"> {
    return {
      name: user.name,
      email: user.email.value,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

**Key points**:
- Static methods for conversion
- `toDomain()`: Prisma model → Domain entity
- `toPersistence()`: Domain entity → Prisma model
- Handle value object conversion

## Use Case Pattern

Use cases encapsulate business operations with single responsibility.

```typescript
// application/use-cases/update-user-profile.use-case.ts
import type { IUseCase } from "@/shared/application/use-case.interface";
import { Result } from "@/shared/domain/result";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { UpdateUserProfileDTO } from "../dto/update-user-profile.dto";

export class UpdateUserProfileUseCase
  implements IUseCase<UpdateUserProfileDTO, void>
{
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserProfileDTO): Promise<Result<void>> {
    try {
      const user = await this.userRepository.findById(input.userId);

      if (!user) {
        return Result.fail(new Error("User not found"));
      }

      user.updateProfile(input.name);
      await this.userRepository.save(user);

      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
```

**Key points**:
- Implement `IUseCase<Input, Output>`
- Single `execute()` method
- Return `Result<T>` for explicit error handling
- Depend on interfaces (not implementations)
- Pure business logic

## Controller Pattern

Controllers handle HTTP/action requests and coordinate use cases.

```typescript
// interface/controllers/user.controller.ts
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UpdateUserProfileUseCase } from "../../application/use-cases/update-user-profile.use-case";
import type { UpdateUserProfileDTO } from "../../application/dto/update-user-profile.dto";

export class UserController {
  constructor(private readonly userRepository: IUserRepository) {}

  async updateUserProfile(userId: string, data: UpdateUserProfileDTO): Promise<void> {
    const useCase = new UpdateUserProfileUseCase(this.userRepository);
    const result = await useCase.execute({ ...data, userId });

    if (result.isFailure) {
      throw result.error;
    }
  }
}
```

**Key points**:
- Coordinate use cases
- Handle Result pattern
- Convert errors to HTTP errors
- Keep thin (no business logic)

## Port and Adapter Pattern

For external services, define ports (interfaces) and adapters (implementations).

```typescript
// application/ports/email-provider.port.ts
export interface IEmailProvider {
  sendWelcomeEmail(to: string, name: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}

// infrastructure/adapters/resend.adapter.ts
import { Resend } from "resend";
import type { IEmailProvider } from "../../application/ports/email-provider.port";

export class ResendAdapter implements IEmailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.client.emails.send({
      from: "noreply@example.com",
      to,
      subject: "Welcome!",
      html: `<p>Welcome ${name}!</p>`,
    });
  }

  // ... other methods
}
```

**Key points**:
- Port defines interface in application layer
- Adapter implements interface in infrastructure layer
- Business logic depends on port (not adapter)
- Easy to swap implementations

## DI Container Pattern

Wire up dependencies in the centralized container.

```typescript
// shared/infrastructure/di/container.ts
class Container {
  private userRepository: IUserRepository | null = null;
  private userController: UserController | null = null;

  getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new PrismaUserRepository();
    }
    return this.userRepository;
  }

  getUserController(): UserController {
    if (!this.userController) {
      this.userController = new UserController(this.getUserRepository());
    }
    return this.userController;
  }
}

export const container = new Container();
```

**Key points**:
- Singleton pattern for container
- Lazy initialization
- Manages object lifecycle
- Single source of truth for dependencies
