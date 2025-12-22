# Testing Examples

Comprehensive test examples for different scenarios.

## Entity Testing Examples

### Complex Entity with Multiple Methods

```typescript
// src/features/payment/domain/__tests__/subscription.entity.test.ts
import { describe, expect, it } from "vitest";
import { Subscription } from "../entities/subscription.entity";

describe("Subscription Entity", () => {
  describe("create", () => {
    it("should create subscription with trial period", () => {
      const subscription = Subscription.create({
        userId: "user-123",
        plan: "PRO",
        status: "TRIALING",
      });

      expect(subscription.status).toBe("TRIALING");
      expect(subscription.plan).toBe("PRO");
    });
  });

  describe("activate", () => {
    it("should activate subscription from trial", () => {
      const subscription = Subscription.create({
        userId: "user-123",
        plan: "PRO",
        status: "TRIALING",
      });

      subscription.activate();

      expect(subscription.status).toBe("ACTIVE");
      expect(subscription.activatedAt).toBeDefined();
    });

    it("should throw error when activating cancelled subscription", () => {
      const subscription = Subscription.create({
        userId: "user-123",
        plan: "PRO",
        status: "CANCELLED",
      });

      expect(() => subscription.activate()).toThrow(
        "Cannot activate cancelled subscription",
      );
    });
  });

  describe("cancel", () => {
    it("should cancel active subscription", () => {
      const subscription = Subscription.create({
        userId: "user-123",
        plan: "PRO",
        status: "ACTIVE",
      });

      subscription.cancel();

      expect(subscription.status).toBe("CANCELLED");
      expect(subscription.cancelledAt).toBeDefined();
    });

    it("should be idempotent when already cancelled", () => {
      const subscription = Subscription.create({
        userId: "user-123",
        plan: "PRO",
        status: "CANCELLED",
      });

      expect(() => subscription.cancel()).not.toThrow();
    });
  });

  describe("isActive", () => {
    it("should return true for active status", () => {
      const subscription = Subscription.create({
        userId: "user-123",
        plan: "PRO",
        status: "ACTIVE",
      });

      expect(subscription.isActive()).toBe(true);
    });

    it("should return false for cancelled status", () => {
      const subscription = Subscription.create({
        userId: "user-123",
        plan: "PRO",
        status: "CANCELLED",
      });

      expect(subscription.isActive()).toBe(false);
    });
  });
});
```

## Value Object Testing Examples

### Complex Validation

```typescript
// src/features/user/domain/__tests__/password.value-object.test.ts
import { describe, expect, it } from "vitest";
import { Password } from "../value-objects/password.value-object";

describe("Password Value Object", () => {
  describe("create", () => {
    it("should create password with valid format", () => {
      const password = Password.create("SecurePass123!");

      expect(password.value).toBe("SecurePass123!");
    });

    it("should reject password shorter than 8 characters", () => {
      expect(() => Password.create("Short1!")).toThrow(
        "Password must be at least 8 characters",
      );
    });

    it("should reject password without uppercase letter", () => {
      expect(() => Password.create("lowercase123!")).toThrow(
        "Password must contain at least one uppercase letter",
      );
    });

    it("should reject password without lowercase letter", () => {
      expect(() => Password.create("UPPERCASE123!")).toThrow(
        "Password must contain at least one lowercase letter",
      );
    });

    it("should reject password without number", () => {
      expect(() => Password.create("NoNumbers!")).toThrow(
        "Password must contain at least one number",
      );
    });

    it("should reject password without special character", () => {
      expect(() => Password.create("NoSpecial123")).toThrow(
        "Password must contain at least one special character",
      );
    });
  });

  describe("hash", () => {
    it("should hash password", async () => {
      const password = Password.create("SecurePass123!");
      const hashed = await password.hash();

      expect(hashed).not.toBe("SecurePass123!");
      expect(hashed.length).toBeGreaterThan(20);
    });
  });

  describe("compare", () => {
    it("should return true for matching password", async () => {
      const password = Password.create("SecurePass123!");
      const hashed = await password.hash();

      const matches = await password.compare(hashed);

      expect(matches).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const password = Password.create("SecurePass123!");
      const wrongHash = await Password.create("DifferentPass123!").hash();

      const matches = await password.compare(wrongHash);

      expect(matches).toBe(false);
    });
  });
});
```

## Use Case Testing Examples

### Use Case with Multiple Dependencies

```typescript
// src/features/auth/application/__tests__/sign-up.use-case.test.ts
import { describe, expect, it, vi } from "vitest";
import { SignUpUseCase } from "../use-cases/sign-up.use-case";
import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import type { IEmailProvider } from "@/features/email/application/ports/email-provider.port";
import { Email } from "@/features/user/domain/value-objects/email.value-object";

describe("SignUpUseCase", () => {
  const mockUserRepository: IUserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  };

  const mockEmailProvider: IEmailProvider = {
    sendWelcomeEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  };

  describe("execute", () => {
    it("should create user and send welcome email", async () => {
      // Arrange
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockUserRepository.save = vi.fn().mockResolvedValue({
        id: "user-123",
        email: Email.create("john@example.com"),
        name: "John Doe",
      });
      mockEmailProvider.sendWelcomeEmail = vi.fn().mockResolvedValue(undefined);

      const useCase = new SignUpUseCase(mockUserRepository, mockEmailProvider);

      // Act
      const result = await useCase.execute({
        email: "john@example.com",
        password: "SecurePass123!",
        name: "John Doe",
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("john@example.com");
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEmailProvider.sendWelcomeEmail).toHaveBeenCalledWith(
        "john@example.com",
        "John Doe",
      );
    });

    it("should fail when email already exists", async () => {
      // Arrange
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue({
        id: "existing-user",
        email: Email.create("john@example.com"),
      });

      const useCase = new SignUpUseCase(mockUserRepository, mockEmailProvider);

      // Act
      const result = await useCase.execute({
        email: "john@example.com",
        password: "SecurePass123!",
        name: "John Doe",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain("Email already registered");
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEmailProvider.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("should rollback when email sending fails", async () => {
      // Arrange
      mockUserRepository.findByEmail = vi.fn().mockResolvedValue(null);
      mockUserRepository.save = vi.fn().mockResolvedValue({
        id: "user-123",
        email: Email.create("john@example.com"),
      });
      mockUserRepository.delete = vi.fn().mockResolvedValue(undefined);
      mockEmailProvider.sendWelcomeEmail = vi
        .fn()
        .mockRejectedValue(new Error("Email service unavailable"));

      const useCase = new SignUpUseCase(mockUserRepository, mockEmailProvider);

      // Act
      const result = await useCase.execute({
        email: "john@example.com",
        password: "SecurePass123!",
        name: "John Doe",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(mockUserRepository.delete).toHaveBeenCalledWith("user-123");
    });
  });
});
```

### Use Case with Conditional Logic

```typescript
// src/features/admin/application/__tests__/delete-user.use-case.test.ts
import { describe, expect, it, vi } from "vitest";
import { DeleteUserUseCase } from "../use-cases/delete-user.use-case";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { User } from "@/features/user/domain/entities/user.entity";
import { Email } from "@/features/user/domain/value-objects/email.value-object";

describe("DeleteUserUseCase", () => {
  const createMockUser = (role: "USER" | "ADMIN") =>
    new User(
      {
        name: "Test User",
        email: Email.create("test@example.com"),
        role,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      "user-123",
    );

  describe("execute", () => {
    it("should delete regular user successfully", async () => {
      // Arrange
      const mockUser = createMockUser("USER");
      const mockRepository: IAdminRepository = {
        findUserById: vi.fn().mockResolvedValue(mockUser),
        deleteUser: vi.fn().mockResolvedValue(undefined),
      };

      const useCase = new DeleteUserUseCase(mockRepository);

      // Act
      const result = await useCase.execute({
        userId: "user-123",
        requesterId: "admin-123",
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.deleteUser).toHaveBeenCalledWith("user-123");
    });

    it("should prevent deleting admin users", async () => {
      // Arrange
      const mockAdmin = createMockUser("ADMIN");
      const mockRepository: IAdminRepository = {
        findUserById: vi.fn().mockResolvedValue(mockAdmin),
        deleteUser: vi.fn(),
      };

      const useCase = new DeleteUserUseCase(mockRepository);

      // Act
      const result = await useCase.execute({
        userId: "admin-123",
        requesterId: "admin-456",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain("Cannot delete admin users");
      expect(mockRepository.deleteUser).not.toHaveBeenCalled();
    });

    it("should prevent self-deletion", async () => {
      // Arrange
      const mockUser = createMockUser("USER");
      const mockRepository: IAdminRepository = {
        findUserById: vi.fn().mockResolvedValue(mockUser),
        deleteUser: vi.fn(),
      };

      const useCase = new DeleteUserUseCase(mockRepository);

      // Act
      const result = await useCase.execute({
        userId: "user-123",
        requesterId: "user-123", // Same as userId
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain("Cannot delete your own account");
      expect(mockRepository.deleteUser).not.toHaveBeenCalled();
    });

    it("should fail when user not found", async () => {
      // Arrange
      const mockRepository: IAdminRepository = {
        findUserById: vi.fn().mockResolvedValue(null),
        deleteUser: vi.fn(),
      };

      const useCase = new DeleteUserUseCase(mockRepository);

      // Act
      const result = await useCase.execute({
        userId: "invalid-id",
        requesterId: "admin-123",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(mockRepository.deleteUser).not.toHaveBeenCalled();
    });
  });
});
```

## Testing Async Operations

```typescript
// src/features/storage/application/__tests__/generate-upload-url.use-case.test.ts
import { describe, expect, it, vi } from "vitest";
import { GenerateUploadUrlUseCase } from "../use-cases/generate-upload-url.use-case";
import type { IObjectStoragePort } from "../ports/object-storage.port";

describe("GenerateUploadUrlUseCase", () => {
  describe("execute", () => {
    it("should generate presigned upload URL", async () => {
      // Arrange
      const mockStoragePort: IObjectStoragePort = {
        generatePresignedUploadUrl: vi.fn().mockResolvedValue({
          uploadUrl: "https://storage.example.com/upload?signature=abc123",
          key: "avatars/uuid-image.png",
        }),
        generatePresignedDownloadUrl: vi.fn(),
        deleteObject: vi.fn(),
      };

      const useCase = new GenerateUploadUrlUseCase(mockStoragePort);

      // Act
      const result = await useCase.execute({
        fileName: "image.png",
        contentType: "image/png",
        fileSize: 1024 * 500, // 500KB
        prefix: "avatars",
      });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveProperty("uploadUrl");
      expect(result.value).toHaveProperty("key");
      expect(mockStoragePort.generatePresignedUploadUrl).toHaveBeenCalledWith({
        key: expect.stringContaining("avatars/"),
        contentType: "image/png",
        fileSize: 1024 * 500,
      });
    });

    it("should reject file size exceeding limit", async () => {
      // Arrange
      const mockStoragePort: IObjectStoragePort = {
        generatePresignedUploadUrl: vi.fn(),
        generatePresignedDownloadUrl: vi.fn(),
        deleteObject: vi.fn(),
      };

      const useCase = new GenerateUploadUrlUseCase(mockStoragePort);

      // Act
      const result = await useCase.execute({
        fileName: "large-file.png",
        contentType: "image/png",
        fileSize: 1024 * 1024 * 15, // 15MB (exceeds 10MB limit)
        prefix: "avatars",
      });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain("File size exceeds maximum");
      expect(mockStoragePort.generatePresignedUploadUrl).not.toHaveBeenCalled();
    });

    it("should reject invalid content type", async () => {
      const mockStoragePort: IObjectStoragePort = {
        generatePresignedUploadUrl: vi.fn(),
        generatePresignedDownloadUrl: vi.fn(),
        deleteObject: vi.fn(),
      };

      const useCase = new GenerateUploadUrlUseCase(mockStoragePort);

      const result = await useCase.execute({
        fileName: "document.pdf",
        contentType: "application/pdf", // Not allowed
        fileSize: 1024 * 100,
        prefix: "avatars",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain("Invalid file type");
    });
  });
});
```

## Testing Error Scenarios

```typescript
describe("UpdateUserProfileUseCase - Error Scenarios", () => {
  it("should handle database connection errors", async () => {
    const mockRepository: IUserRepository = {
      findById: vi.fn().mockRejectedValue(new Error("Connection timeout")),
      save: vi.fn(),
    };

    const useCase = new UpdateUserProfileUseCase(mockRepository);

    const result = await useCase.execute({
      userId: "user-123",
      name: "Jane Doe",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("Connection timeout");
  });

  it("should handle concurrent modification errors", async () => {
    const mockRepository: IUserRepository = {
      findById: vi.fn().mockResolvedValue(mockUser),
      save: vi.fn().mockRejectedValue(new Error("Optimistic lock failed")),
    };

    const useCase = new UpdateUserProfileUseCase(mockRepository);

    const result = await useCase.execute({
      userId: "user-123",
      name: "Jane Doe",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toContain("Optimistic lock");
  });
});
```

## Parameterized Tests

```typescript
describe("Email Value Object - Parameterized", () => {
  describe("create with invalid formats", () => {
    const invalidEmails = [
      ["missing-at", "No @ symbol"],
      ["@example.com", "Missing local part"],
      ["user@", "Missing domain"],
      ["user @example.com", "Space in email"],
      ["user@.com", "Invalid domain"],
      ["", "Empty string"],
    ];

    it.each(invalidEmails)("should reject '%s' - %s", (email, _reason) => {
      expect(() => Email.create(email)).toThrow("Invalid email format");
    });
  });

  describe("create with valid formats", () => {
    const validEmails = [
      "simple@example.com",
      "user+tag@example.com",
      "user.name@example.com",
      "user123@example.co.uk",
    ];

    it.each(validEmails)("should accept '%s'", (email) => {
      const result = Email.create(email);
      expect(result.value).toBe(email.toLowerCase());
    });
  });
});
```
