# Clean Architecture Examples

Complete examples of implementing features using clean architecture.

## Example 1: User Profile Update Feature

Complete implementation from domain to interface layer.

### 1. Domain Layer

**Entity: User**

```typescript
// src/features/user/domain/entities/user.entity.ts
import { Entity } from "@/shared/domain/entity";
import { Email } from "../value-objects/email.value-object";

interface UserProps {
  name: string;
  email: Email;
  image: string | null;
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

  get image(): string | null {
    return this.props.image;
  }

  updateProfile(name: string, image?: string): void {
    this.props.name = name;
    if (image !== undefined) {
      this.props.image = image;
    }
    this.props.updatedAt = new Date();
  }
}
```

**Repository Interface**

```typescript
// src/features/user/domain/repositories/user.repository.interface.ts
import type { User } from "../entities/user.entity";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
```

### 2. Application Layer

**DTO**

```typescript
// src/features/user/application/dto/update-user-profile.dto.ts
export interface UpdateUserProfileDTO {
  userId: string;
  name: string;
  image?: string;
}
```

**Use Case**

```typescript
// src/features/user/application/use-cases/update-user-profile.use-case.ts
import type { IUseCase } from "@/shared/application/use-case.interface";
import { Result } from "@/shared/domain/result";
import { HttpError } from "@/shared/domain/errors";
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
        return Result.fail(HttpError.notFound("User"));
      }

      user.updateProfile(input.name, input.image);
      await this.userRepository.save(user);

      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
```

### 3. Infrastructure Layer

**Mapper**

```typescript
// src/features/user/infrastructure/mappers/prisma-user.mapper.ts
import type { User as PrismaUser } from "@/lib/generated/prisma";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User(
      {
        name: raw.name,
        email: Email.create(raw.email),
        image: raw.image,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }

  static toPersistence(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      image: user.image,
      updatedAt: user.updatedAt,
    };
  }
}
```

**Repository Implementation**

```typescript
// src/features/user/infrastructure/repositories/prisma-user.repository.ts
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
    const data = PrismaUserMapper.toPersistence(user);
    const saved = await prisma.user.update({
      where: { id: user.id },
      data,
    });
    return PrismaUserMapper.toDomain(saved);
  }
}
```

### 4. Interface Layer

**Schema**

```typescript
// src/features/user/interface/schemas/user.schema.ts
import { z } from "zod";

export const updateUserProfileSchema = z.object({
  name: z.string().min(1).max(100),
  image: z.string().url().optional(),
});
```

**Controller**

```typescript
// src/features/user/interface/controllers/user.controller.ts
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

### 5. DI Container

```typescript
// src/shared/infrastructure/di/container.ts
import { UserController } from "@/features/user/interface/controllers/user.controller";
import { PrismaUserRepository } from "@/features/user/infrastructure/repositories/prisma-user.repository";

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

### 6. Server Action

```typescript
// actions/user/user.action.ts
"use server";

import { authAction } from "@/lib/actions/safe-action";
import { ActionResponse } from "@/shared/infrastructure/http";
import { container } from "@/shared/infrastructure/di/container";
import { updateUserProfileSchema } from "@/features/user/interface/schemas/user.schema";

export const updateUserProfileAction = authAction
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userController = container.getUserController();
    await userController.updateUserProfile(ctx.user.id, parsedInput);
    return ActionResponse.success({ message: "Profile updated" });
  });
```

---

## Example 2: Email Service with Port/Adapter

Complete implementation of external service integration.

### 1. Application Layer - Port

```typescript
// src/features/email/application/ports/email-provider.port.ts
export interface IEmailProvider {
  sendWelcomeEmail(to: string, name: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}
```

### 2. Infrastructure Layer - Adapter

```typescript
// src/features/email/infrastructure/adapters/resend.adapter.ts
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
      html: `<p>Hello ${name}, welcome to our platform!</p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `https://example.com/reset-password?token=${token}`;
    await this.client.emails.send({
      from: "noreply@example.com",
      to,
      subject: "Reset Your Password",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });
  }
}
```

### 3. Use Case Using Email Port

```typescript
// src/features/auth/application/use-cases/request-password-reset.use-case.ts
import type { IUseCase } from "@/shared/application/use-case.interface";
import { Result } from "@/shared/domain/result";
import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import type { IEmailProvider } from "@/features/email/application/ports/email-provider.port";

interface RequestPasswordResetInput {
  email: string;
}

export class RequestPasswordResetUseCase
  implements IUseCase<RequestPasswordResetInput, void>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailProvider: IEmailProvider,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<Result<void>> {
    try {
      const user = await this.userRepository.findByEmail(input.email);

      if (!user) {
        // Don't reveal if user exists
        return Result.ok();
      }

      const token = generateResetToken();
      await this.emailProvider.sendPasswordResetEmail(user.email.value, token);

      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
```

### 4. DI Container Wiring

```typescript
// src/shared/infrastructure/di/container.ts
import { ResendAdapter } from "@/features/email/infrastructure/adapters/resend.adapter";
import { env } from "@/lib/env";

class Container {
  private emailProvider: IEmailProvider | null = null;

  getEmailProvider(): IEmailProvider {
    if (!this.emailProvider) {
      this.emailProvider = new ResendAdapter(env.RESEND_API_KEY);
    }
    return this.emailProvider;
  }

  getAuthController(): AuthController {
    return new AuthController(
      this.getUserRepository(),
      this.getEmailProvider(),
    );
  }
}
```

---

## Example 3: Admin Feature with Multiple Use Cases

Complete feature with list, create, and delete operations.

### Repository Interface

```typescript
// src/features/admin/domain/repositories/admin.repository.interface.ts
import type { User } from "@/features/user/domain/entities/user.entity";

export interface IAdminRepository {
  listUsers(params: {
    skip: number;
    take: number;
  }): Promise<{ users: User[]; total: number }>;
  deleteUser(id: string): Promise<void>;
}
```

### Use Cases

```typescript
// src/features/admin/application/use-cases/list-users.use-case.ts
export class ListUsersUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(input: { skip: number; take: number }): Promise<Result<{
    users: User[];
    total: number;
  }>> {
    try {
      const result = await this.adminRepository.listUsers(input);
      return Result.ok(result);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

// src/features/admin/application/use-cases/delete-user.use-case.ts
export class DeleteUserUseCase {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(userId: string): Promise<Result<void>> {
    try {
      await this.adminRepository.deleteUser(userId);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
```

### Controller

```typescript
// src/features/admin/interface/controllers/admin.controller.ts
export class AdminController {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async listUsers(params: { skip: number; take: number }) {
    const useCase = new ListUsersUseCase(this.adminRepository);
    const result = await useCase.execute(params);

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }

  async deleteUser(userId: string): Promise<void> {
    const useCase = new DeleteUserUseCase(this.adminRepository);
    const result = await useCase.execute(userId);

    if (result.isFailure) {
      throw result.error;
    }
  }
}
```

### API Route (GET only)

```typescript
// app/api/admin/users/route.ts
import { adminRoute } from "@/lib/routes/admin-route";
import { ApiResponse } from "@/shared/infrastructure/http";
import { container } from "@/shared/infrastructure/di/container";
import { listUsersSchema } from "@/features/admin/interface/schemas/admin.schema";

export const GET = adminRoute
  .query(listUsersSchema)
  .handler(async (_req, { query }) => {
    const adminController = container.getAdminController();
    const result = await adminController.listUsers(query);
    return ApiResponse.paginated(result.users, { total: result.total });
  });
```

---

## Testing Example

```typescript
// src/features/user/application/__tests__/update-user-profile.use-case.test.ts
import { describe, expect, it, vi } from "vitest";
import { UpdateUserProfileUseCase } from "../use-cases/update-user-profile.use-case";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";

describe("UpdateUserProfileUseCase", () => {
  it("should update user profile successfully", async () => {
    // Arrange
    const mockUser = new User(
      {
        name: "John",
        email: Email.create("john@example.com"),
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      "user-123",
    );

    const mockRepository: IUserRepository = {
      findById: vi.fn().mockResolvedValue(mockUser),
      save: vi.fn().mockResolvedValue(mockUser),
    };

    const useCase = new UpdateUserProfileUseCase(mockRepository);

    // Act
    const result = await useCase.execute({
      userId: "user-123",
      name: "John Updated",
    });

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockRepository.findById).toHaveBeenCalledWith("user-123");
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it("should fail when user not found", async () => {
    const mockRepository: IUserRepository = {
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };

    const useCase = new UpdateUserProfileUseCase(mockRepository);

    const result = await useCase.execute({
      userId: "invalid-id",
      name: "John",
    });

    expect(result.isFailure).toBe(true);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
```
