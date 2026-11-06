# Clean Architecture Examples

## Entity Example

From `src/features/user/domain/entities/user.entity.ts` (trimmed):

```typescript
import { Entity } from "@/shared/domain/entity.base";

import type { Email } from "../value-objects/email.value-object";
import type { UserId } from "../value-objects/user-id.value-object";

import type { Language, NotificationPreferences } from "./user.types";

export type UserProps = {
  id: UserId;
  email: Email;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  birthDate?: Date;
  language: Language;
  emailVerified: boolean;
  emailContactId?: string;
  notificationPreferences: NotificationPreferences;
};

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

  static create(props: UserProps): User {
    return new User(props);
  }

  updateProfile(data: {
    name?: string;
    image?: string;
    birthDate?: Date;
    language?: Language;
  }): void {
    if (data.name) this.props.name = data.name;
    if (data.image) this.props.image = data.image;
    if (data.birthDate) this.props.birthDate = data.birthDate;
    if (data.language) this.props.language = data.language;
    this.props.updatedAt = new Date();
  }
}
```

## Value Object Example

From `src/features/user/domain/value-objects/email.value-object.ts`:

```typescript
import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/value-object.base";

type EmailProps = {
  value: string;
};

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    if (!email || !this.EMAIL_REGEX.test(email))
      throw new DomainError("Invalid email format");

    return new Email({ value: email.toLowerCase() });
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

## Use Case Example

From `src/features/user/application/use-cases/update-user-profile.use-case.ts`:

```typescript
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import type { UpdateUserProfileDTO } from "../dto/update-user-profile.dto";
import {
  toUserResponseDTO,
  type UserResponseDTO,
} from "../dto/user-response.dto";

export class UpdateUserProfileUseCase implements IUseCase<
  UpdateUserProfileDTO,
  UserResponseDTO
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserProfileDTO): Promise<Result<UserResponseDTO>> {
    const userId = UserId.create(input.userId);

    const user = await this.userRepository.findById(userId);

    if (!user) return Result.fail(new UserNotFoundError(input.userId));

    user.updateProfile({
      name: input.name,
      image: input.image,
      language: input.language,
      birthDate: input.birthDate,
    });

    const savedUser = await this.userRepository.save(user);

    return Result.ok(toUserResponseDTO(savedUser));
  }
}
```

## Audit Log and Job Queue Ports

Use cases record audit entries through the shared `IAuditLogPort` and enqueue work through `IJobQueuePort`, from `src/features/auth/application/use-cases/revoke-user-session.use-case.ts` and `src/features/user/application/use-cases/request-data-export.use-case.ts` (trimmed):

```typescript
import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import type { IJobQueuePort } from "@/shared/application/ports/job-queue.port";

import type { UserJobs } from "../jobs/user.jobs";

await this.auditLog.record({
  actorType: "user",
  actorUserId: current.user.id,
  action: "auth.session.revoked",
  resourceType: "session",
  resourceId: record.id,
  metadata: describeSession(toSessionEntity(record)),
});

await this.jobQueue.enqueue(
  { name: "user.export-data", payload: { exportId: dataExport.id } },
  { jobId: `user.export-data-${dataExport.id}` },
);
```

The job payload is declared in `src/features/user/application/jobs/user.jobs.ts`:

```typescript
export type UserJobs = {
  "user.export-data": { exportId: string };
  "user.purge-expired-data-exports": Record<string, never>;
};
```

## Repository Implementation

From `src/features/user/infrastructure/repositories/drizzle-user.repository.ts` (trimmed):

```typescript
import { eq } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { user as userTable } from "@/lib/schema";

import type { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { UserId } from "../../domain/value-objects/user-id.value-object";
import { toDomain, toPersistence } from "../mappers/drizzle-user.mapper";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: UserId): Promise<User | null> {
    const userData = await this.db.query.user.findFirst({
      where: eq(userTable.id, id.value),
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async save(user: User): Promise<User> {
    const data = toPersistence(user);
    const {
      id: _id,
      email: _email,
      emailVerified: _emailVerified,
      createdAt: _createdAt,
      ...profileData
    } = data;

    const [savedData] = await this.db
      .insert(userTable)
      .values(data)
      .onConflictDoUpdate({ target: userTable.id, set: profileData })
      .returning();

    return toDomain(savedData);
  }
}
```

`CachedUserRepository` (`infrastructure/repositories/cached-user.repository.ts`) wraps it with `ICachePort`, reading through `CacheKeys.user(id)` and invalidating on `save` and `delete`.

## List Repository

From `src/features/admin/infrastructure/repositories/drizzle-admin.repository.ts` (trimmed):

```typescript
const USER_LIST_CONFIG: DrizzleListConfig<AdminListUsersInput> = {
  id: user.id,
  where: isNull(user.deletedAt),
  tieBreaker: desc(user.id),
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    lastLoginAt: sortNullsLast(user.lastLoginAt),
  },
  search: (term) =>
    or(
      containsInsensitive(user.name, term),
      containsInsensitive(user.email, term),
    ),
  filters: {
    emailVerified: (emailVerified) => eq(user.emailVerified, emailVerified),
    createdAt: (value) => toDateRangeWhere(user.createdAt, value),
  },
};

async listUsers(input: AdminListUsersInput) {
  const { where, orderBy, offset, limit, page, pageSize } = toDrizzleListArgs(
    input,
    USER_LIST_CONFIG,
  );

  const [users, total] = await Promise.all([
    this.db
      .select()
      .from(user)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    this.db.$count(user, where),
  ]);

  return toPaginatedResult({ page, pageSize, total, items: users });
}
```

## Mapper Example

From `src/features/user/infrastructure/mappers/drizzle-user.mapper.ts`:

```typescript
import type { user } from "@/lib/schema";

import { User, type UserProps } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";

export type UserRecord = Pick<
  typeof user.$inferSelect,
  | "id"
  | "name"
  | "email"
  | "image"
  | "language"
  | "birthDate"
  | "createdAt"
  | "updatedAt"
  | "socialEmails"
  | "emailVerified"
  | "emailContactId"
  | "securityEmails"
  | "marketingEmails"
  | "notificationType"
  | "communicationEmails"
>;

export function toDomain(raw: UserRecord): User {
  const props: UserProps = {
    name: raw.name,
    language: raw.language,
    id: UserId.create(raw.id),
    image: raw.image ?? undefined,
    email: Email.create(raw.email),
    emailVerified: raw.emailVerified,
    birthDate: raw.birthDate ?? undefined,
    emailContactId: raw.emailContactId ?? undefined,
    notificationPreferences: {
      social: raw.socialEmails,
      type: raw.notificationType,
      security: raw.securityEmails,
      marketing: raw.marketingEmails,
      communication: raw.communicationEmails,
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  return User.create(props);
}

export function toPersistence(user: User): UserRecord {
  return {
    name: user.name,
    id: user.id.value,
    email: user.email.value,
    language: user.language,
    image: user.image ?? null,
    birthDate: user.birthDate ?? null,
    emailVerified: user.isEmailVerified,
    emailContactId: user.emailContactId ?? null,
    socialEmails: user.notificationPreferences.social,
    notificationType: user.notificationPreferences.type,
    securityEmails: user.notificationPreferences.security,
    marketingEmails: user.notificationPreferences.marketing,
    communicationEmails: user.notificationPreferences.communication,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
```

## Controller Example

From `src/features/user/interface/controllers/user.controller.ts` (trimmed):

```typescript
import type { UpdateUserProfileUseCase } from "../../application/use-cases/update-user-profile.use-case";
import type { Language } from "../../domain/entities/user.types";

export class UserController {
  constructor(
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
  ) {}

  async updateUserProfile(
    userId: string,
    input: { name?: string; image?: string; language?: Language },
  ) {
    const result = await this.updateUserProfileUseCase.execute({
      userId,
      ...input,
    });

    return result.unwrap();
  }
}
```

## DI Container Assembly

From `src/shared/infrastructure/di/container.ts` (trimmed):

```typescript
import { db } from "@/lib/db";

class Container {
  private _cache?: ICachePort;
  private _auditLog?: IAuditLogPort;
  private _userRepository?: CachedUserRepository;

  getUserController(): UserController {
    const userRepository = this.getUserRepository();

    return new UserController(
      new GetUserByIdUseCase(userRepository),
      new UpdateUserProfileUseCase(userRepository),
    );
  }

  getSessionController(): SessionController {
    const authProvider = this.getBetterAuthAdapter();
    const auditLog = this.getAuditLog();

    return new SessionController(
      new ListUserSessionsUseCase(authProvider, authProvider),
      new RevokeUserSessionUseCase(authProvider, authProvider, auditLog),
      new RevokeOtherUserSessionsUseCase(authProvider, authProvider, auditLog),
    );
  }

  getJobHandlers(): JobHandlers<AppJobs> {
    return {
      "user.export-data": async (payload) =>
        this.getDataExportController().exportData(payload),
      "user.purge-expired-data-exports": async () =>
        this.getDataExportController().purgeExpired(),
    };
  }

  private getAuditLog(): IAuditLogPort {
    this._auditLog ??= new DrizzleAuditLogAdapter(db);
    return this._auditLog;
  }

  private getUserRepository(): CachedUserRepository {
    this._userRepository ??= new CachedUserRepository(
      new DrizzleUserRepository(db),
      this.getCache(),
    );
    return this._userRepository;
  }
}

export const container = new Container();
```
