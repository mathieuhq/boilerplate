# Testing Examples

## Value Object Test

From `src/features/user/domain/__tests__/email.value-object.test.ts` (trimmed):

```typescript
import { describe, expect, it } from "vitest";

import { DomainError } from "@/shared/domain/errors/domain.error";

import { Email } from "../value-objects/email.value-object";

describe("Email Value Object", () => {
  describe("create", () => {
    it("should create a valid email", () => {
      const email = Email.create("test@example.com");
      expect(email.value).toBe("test@example.com");
    });

    it("should lowercase the email", () => {
      const email = Email.create("TEST@EXAMPLE.COM");
      expect(email.value).toBe("test@example.com");
    });
  });

  describe("validation errors", () => {
    it("should throw DomainError for invalid email format", () => {
      expect(() => Email.create("invalid-email")).toThrow(DomainError);
      expect(() => Email.create("invalid-email")).toThrow(
        "Invalid email format",
      );
    });

    it("should throw DomainError for empty email", () => {
      expect(() => Email.create("")).toThrow(DomainError);
    });
  });

  describe("equals", () => {
    it("should return true for same email", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");

      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for different emails", () => {
      const email1 = Email.create("test1@example.com");
      const email2 = Email.create("test2@example.com");

      expect(email1.equals(email2)).toBe(false);
    });
  });
});
```

## Entity Test

From `src/features/user/domain/__tests__/user.entity.test.ts` (trimmed):

```typescript
import { beforeEach, describe, expect, it } from "vitest";

import type { UserProps } from "../entities/user.entity";
import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.value-object";
import { UserId } from "../value-objects/user-id.value-object";

describe("User Entity", () => {
  let defaultProps: UserProps;

  beforeEach(() => {
    defaultProps = {
      id: UserId.create("user-123"),
      email: Email.create("test@example.com"),
      name: "Test User",
      language: "EN",
      emailVerified: true,
      notificationPreferences: {
        type: "ALL",
        social: true,
        security: true,
        marketing: false,
        communication: true,
      },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };
  });

  describe("create", () => {
    it("should create a user with all properties", () => {
      const user = User.create(defaultProps);
      expect(user.id.value).toBe("user-123");
      expect(user.email.value).toBe("test@example.com");
      expect(user.name).toBe("Test User");
      expect(user.isEmailVerified).toBe(true);
    });
  });

  describe("updateProfile", () => {
    it("should update name when provided", () => {
      const user = User.create(defaultProps);
      user.updateProfile({ name: "New Name" });
      expect(user.name).toBe("New Name");
    });

    it("should update multiple fields at once", () => {
      const user = User.create(defaultProps);
      user.updateProfile({ name: "Updated Name", language: "FR" });
      expect(user.name).toBe("Updated Name");
      expect(user.language).toBe("FR");
    });
  });

  describe("shouldSubscribeToMarketing", () => {
    it("should return true when enabling marketing and currently disabled", () => {
      const user = User.create(defaultProps);
      expect(user.shouldSubscribeToMarketing(true)).toBe(true);
    });

    it("should return false when marketing already enabled", () => {
      const user = User.create({
        ...defaultProps,
        notificationPreferences: {
          ...defaultProps.notificationPreferences,
          marketing: true,
        },
      });
      expect(user.shouldSubscribeToMarketing(true)).toBe(false);
    });
  });
});
```

## Use Case Test

From `src/features/user/application/__tests__/update-user-profile.use-case.test.ts` (trimmed):

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import { createMockUserRepository } from "@/test/utils/mock-factories";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import { UpdateUserProfileUseCase } from "../use-cases/update-user-profile.use-case";

describe("UpdateUserProfileUseCase", () => {
  let useCase: UpdateUserProfileUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new UpdateUserProfileUseCase(mockUserRepository);
  });

  describe("when user exists", () => {
    it("should update user profile with name", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      const result = await useCase.execute({
        userId: "user-123",
        name: "Updated Name",
      });

      expect(result.isSuccess).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe("when user does not exist", () => {
    it("should return UserNotFoundError", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute({
        userId: "non-existent",
        name: "New Name",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserNotFoundError);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });
});
```

## Audit Log Test

From `src/features/auth/application/__tests__/revoke-user-session.use-case.test.ts` (trimmed):

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { SessionOperationError } from "../errors/session-operation.error";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import type { ISessionManagementPort } from "../ports/session-management.port";
import { RevokeUserSessionUseCase } from "../use-cases/revoke-user-session.use-case";

import {
  createAuthSession,
  createMockAuditLog,
  createMockSessionManagement,
  createSessionRecord,
} from "./session-management.mock";

describe("RevokeUserSessionUseCase", () => {
  let authProvider: IAuthProviderPort;
  let sessionManagement: ISessionManagementPort;
  let auditLog: IAuditLogPort;
  let useCase: RevokeUserSessionUseCase;

  beforeEach(() => {
    authProvider = createMockAuthProvider();
    sessionManagement = createMockSessionManagement();
    auditLog = createMockAuditLog();
    useCase = new RevokeUserSessionUseCase(
      authProvider,
      sessionManagement,
      auditLog,
    );
  });

  it("should revoke another session and write an audit log", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord(),
      createSessionRecord({ id: "session-phone", token: "token-phone" }),
    ]);

    const result = await useCase.execute({ sessionId: "session-phone" });

    expect(result.isSuccess).toBe(true);
    expect(sessionManagement.revokeSession).toHaveBeenCalledWith("token-phone");
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: "user",
        actorUserId: "user-1",
        action: "auth.session.revoked",
        resourceType: "session",
        resourceId: "session-phone",
      }),
    );
  });

  it("should fail while impersonating", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ impersonatedBy: "admin-1" }),
    );

    const result = await useCase.execute({ sessionId: "session-phone" });

    expect(result.isFailure).toBe(true);
    expect((result.error as SessionOperationError).code).toBe(
      "SESSION_IMPERSONATION_FORBIDDEN",
    );
    expect(auditLog.record).not.toHaveBeenCalled();
  });
});
```

## Error Handling Test

From `src/features/storage/application/__tests__/generate-upload-url.use-case.test.ts` (trimmed):

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FileTooLargeError } from "../../domain/errors/file-too-large.error";
import type { IObjectStoragePort } from "../ports/object-storage.port";
import { GenerateUploadUrlUseCase } from "../use-cases/generate-upload-url.use-case";

describe("GenerateUploadUrlUseCase", () => {
  let useCase: GenerateUploadUrlUseCase;
  let mockObjectStorage: IObjectStoragePort;

  beforeEach(() => {
    mockObjectStorage = {
      generateUploadUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.com/presigned-url"),
      generateDownloadUrl: vi.fn(),
      deleteObject: vi.fn(),
      getObjectMetadata: vi.fn(),
      uploadObject: vi.fn(),
      downloadObject: vi.fn(),
    };

    useCase = new GenerateUploadUrlUseCase(mockObjectStorage);
  });

  it("should fail when file size exceeds 10MB", async () => {
    const result = await useCase.execute({
      fileName: "large.png",
      contentType: "image/png",
      fileSize: 11 * 1024 * 1024,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(FileTooLargeError);
    expect(mockObjectStorage.generateUploadUrl).not.toHaveBeenCalled();
  });

  it("should fail when object storage throws error", async () => {
    vi.mocked(mockObjectStorage.generateUploadUrl).mockRejectedValue(
      new Error("Storage error"),
    );

    const result = await useCase.execute({
      fileName: "test.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("Storage error");
  });
});
```
