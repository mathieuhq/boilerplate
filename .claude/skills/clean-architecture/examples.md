# Clean Architecture Examples

## Entity Example

From `src/features/user/domain/entities/user.entity.ts`:

```typescript
import { Entity } from "@/shared/domain/entity";
import { Email } from "../value-objects/email.value-object";
import { UserId } from "../value-objects/user-id.value-object";

interface UserProps {
  id: UserId;
  email: Email;
  name: string;
  image: string | null;
  notificationPreferences: NotificationPreferences;
}

export class User extends Entity<UserProps> {
  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  updateProfile(data: { name?: string; email?: Email }): void {
    if (data.name) this.props.name = data.name;
    if (data.email) this.props.email = data.email;
  }

  static create(props: UserProps): User {
    return new User(props);
  }
}
```

## Value Object Example

From `src/features/user/domain/value-objects/email.value-object.ts`:

```typescript
import { ValueObject } from "@/shared/domain/value-object";

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): Email {
    if (!this.EMAIL_REGEX.test(email)) {
      throw new Error("Invalid email format");
    }
    return new Email({ value: email.toLowerCase() });
  }

  equals(other: Email): boolean {
    return this.props.value === other.props.value;
  }
}
```

## Use Case Example

From `src/features/user/application/use-cases/update-user-profile.use-case.ts`:

```typescript
import { IUseCase } from "@/shared/application/use-case.interface";
import { Result } from "@/shared/domain/result";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import { toUserResponseDTO, UserResponseDTO } from "../dto/user-response.dto";

interface Input {
  userId: string;
  name?: string;
  email?: string;
}

type Output = Result<UserResponseDTO>;

export class UpdateUserProfileUseCase implements IUseCase<Input, Output> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: Input): Promise<Output> {
    const userId = UserId.create(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail(new UserNotFoundError(input.userId));
    }

    if (input.email) {
      const email = Email.create(input.email);
      const emailTaken = await this.userRepository.isEmailTaken(email, userId);
      if (emailTaken) {
        return Result.fail(
          new ApplicationError("EMAIL_TAKEN", "Email already in use"),
        );
      }
      user.updateProfile({ email });
    }

    if (input.name) {
      user.updateProfile({ name: input.name });
    }

    await this.userRepository.save(user);

    return Result.ok(toUserResponseDTO(user));
  }
}
```

## Repository Implementation

From `src/features/user/infrastructure/repositories/drizzle-user.repository.ts`:

```typescript
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "@/db/schema";
import { users } from "@/db/schema";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { User } from "../../domain/entities/user.entity";
import * as DrizzleUserMapper from "../mappers/drizzle-user.mapper";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async findById(id: UserId): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id.value),
    });
    return user ? DrizzleUserMapper.toDomain(user) : null;
  }

  async save(user: User): Promise<void> {
    const data = DrizzleUserMapper.toPersistence(user);
    await this.db.insert(users).values(data).onConflictDoUpdate({
      target: users.id,
      set: data,
    });
  }
}
```

## Mapper Example

From `src/features/user/infrastructure/mappers/drizzle-user.mapper.ts`:

```typescript
import type { users } from "@/db/schema";
import { User, type UserProps } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";

export function toDomain(raw: typeof users.$inferSelect): User {
  const props: UserProps = {
    id: UserId.create(raw.id),
    email: Email.create(raw.email),
    name: raw.name,
    image: raw.image ?? undefined,
    notificationPreferences: {
      social: raw.socialEmails ?? true,
      type: raw.notificationType ?? "ALL",
      security: raw.securityEmails ?? true,
      marketing: raw.marketingEmails ?? true,
      communication: raw.communicationEmails ?? true,
    },
  };
  return User.create(props);
}

export function toPersistence(user: User) {
  return {
    id: user.id.value,
    email: user.email.value,
    name: user.name,
    image: user.image ?? null,
    socialEmails: user.notificationPreferences.social,
    notificationType: user.notificationPreferences.type,
    securityEmails: user.notificationPreferences.security,
    marketingEmails: user.notificationPreferences.marketing,
    communicationEmails: user.notificationPreferences.communication,
  };
}
```

## Controller Example

From `src/features/user/interface/controllers/user.controller.ts`:

```typescript
import { UpdateUserProfileUseCase } from "../../application/use-cases/update-user-profile.use-case";

export class UserController {
  constructor(
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
  ) {}

  async updateUserProfile(userId: string, input: UpdateProfileInput) {
    const result = await this.updateUserProfileUseCase.execute({
      userId,
      ...input,
    });

    if (result.isFailure) {
      throw result.error;
    }

    return result.value;
  }
}
```

## DI Container Assembly

From `src/shared/infrastructure/di/container.ts`:

```typescript
import { DrizzleUserRepository } from "@/features/user/infrastructure/repositories/drizzle-user.repository";
import { UpdateUserProfileUseCase } from "@/features/user/application/use-cases/update-user-profile.use-case";
import { UserController } from "@/features/user/interface/controllers/user.controller";
import { db } from "@/lib/db";

class Container {
  private _drizzleUserRepository?: DrizzleUserRepository;

  getUserController(): UserController {
    const userRepository = this.getDrizzleUserRepository();
    return new UserController(new UpdateUserProfileUseCase(userRepository));
  }

  private getDrizzleUserRepository(): DrizzleUserRepository {
    this._drizzleUserRepository ??= new DrizzleUserRepository(db);
    return this._drizzleUserRepository;
  }
}

export const container = new Container();
```
