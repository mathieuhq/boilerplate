# Testing Examples

## Value Object Test

```typescript
// src/features/user/domain/__tests__/email.value-object.test.ts
import { describe, expect, it } from "vitest";
import { Email } from "../value-objects/email.value-object";

describe("Email", () => {
  describe("create", () => {
    it("should create email with valid format", () => {
      const email = Email.create("test@example.com");

      expect(email.value).toBe("test@example.com");
    });

    it("should lowercase the email", () => {
      const email = Email.create("Test@EXAMPLE.com");

      expect(email.value).toBe("test@example.com");
    });

    it("should throw error for invalid email format", () => {
      expect(() => Email.create("invalid-email")).toThrow(
        "Invalid email format",
      );
    });

    it("should throw error for empty email", () => {
      expect(() => Email.create("")).toThrow("Invalid email format");
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

```typescript
// src/features/user/domain/__tests__/user.entity.test.ts
import { describe, expect, it } from "vitest";
import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.value-object";
import { UserId } from "../value-objects/user-id.value-object";

describe("User", () => {
  const createUser = (overrides = {}) => {
    return User.create({
      id: UserId.create("user-123"),
      email: Email.create("test@example.com"),
      name: "Test User",
      image: null,
      notificationPreferences: {
        email: true,
        marketing: false,
      },
      ...overrides,
    });
  };

  describe("create", () => {
    it("should create user with valid props", () => {
      const user = createUser();

      expect(user.id.value).toBe("user-123");
      expect(user.email.value).toBe("test@example.com");
      expect(user.name).toBe("Test User");
    });
  });

  describe("updateProfile", () => {
    it("should update name", () => {
      const user = createUser();

      user.updateProfile({ name: "New Name" });

      expect(user.name).toBe("New Name");
    });

    it("should update email", () => {
      const user = createUser();
      const newEmail = Email.create("new@example.com");

      user.updateProfile({ email: newEmail });

      expect(user.email.value).toBe("new@example.com");
    });

    it("should not change name when not provided", () => {
      const user = createUser();

      user.updateProfile({ email: Email.create("new@example.com") });

      expect(user.name).toBe("Test User");
    });
  });

  describe("shouldSubscribeToMarketing", () => {
    it("should return true when marketing is enabled", () => {
      const user = createUser({
        notificationPreferences: { email: true, marketing: true },
      });

      expect(user.shouldSubscribeToMarketing()).toBe(true);
    });

    it("should return false when marketing is disabled", () => {
      const user = createUser({
        notificationPreferences: { email: true, marketing: false },
      });

      expect(user.shouldSubscribeToMarketing()).toBe(false);
    });
  });
});
```

## Use Case Test

```typescript
// src/features/user/application/__tests__/update-user-profile.use-case.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { UpdateUserProfileUseCase } from "../use-cases/update-user-profile.use-case";
import { User } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import { UserNotFoundError } from "../../domain/errors/user-not-found.error";

describe("UpdateUserProfileUseCase", () => {
  const mockUserRepository = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    isEmailTaken: vi.fn(),
  };

  let useCase: UpdateUserProfileUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UpdateUserProfileUseCase(mockUserRepository);
  });

  const createMockUser = () => {
    return User.create({
      id: UserId.create("user-123"),
      email: Email.create("test@example.com"),
      name: "Test User",
      image: null,
      notificationPreferences: { email: true, marketing: false },
    });
  };

  describe("execute", () => {
    it("should update user profile successfully", async () => {
      const user = createMockUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId: "user-123",
        name: "New Name",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.name).toBe("New Name");
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it("should fail when user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        userId: "non-existent",
        name: "New Name",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserNotFoundError);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("should fail when email is already taken", async () => {
      const user = createMockUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.isEmailTaken.mockResolvedValue(true);

      const result = await useCase.execute({
        userId: "user-123",
        email: "taken@example.com",
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe("EMAIL_TAKEN");
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("should update email when not taken", async () => {
      const user = createMockUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.isEmailTaken.mockResolvedValue(false);
      mockUserRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId: "user-123",
        email: "new@example.com",
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value.email).toBe("new@example.com");
      expect(mockUserRepository.isEmailTaken).toHaveBeenCalled();
    });
  });
});
```

## Error Handling Test

```typescript
// src/features/storage/application/__tests__/generate-upload-url.use-case.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GenerateUploadUrlUseCase } from "../use-cases/generate-upload-url.use-case";
import { FileTooLargeError } from "../../domain/errors/file-too-large.error";

describe("GenerateUploadUrlUseCase", () => {
  const mockObjectStorage = {
    generatePresignedUploadUrl: vi.fn(),
    generatePresignedDownloadUrl: vi.fn(),
    deleteObject: vi.fn(),
  };

  let useCase: GenerateUploadUrlUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GenerateUploadUrlUseCase(mockObjectStorage);
  });

  it("should fail when file size exceeds limit", async () => {
    const result = await useCase.execute({
      fileName: "large-file.png",
      contentType: "image/png",
      fileSize: 15 * 1024 * 1024, // 15MB
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(FileTooLargeError);
    expect(mockObjectStorage.generatePresignedUploadUrl).not.toHaveBeenCalled();
  });

  it("should generate upload URL for valid file", async () => {
    mockObjectStorage.generatePresignedUploadUrl.mockResolvedValue(
      "https://r2.example.com/upload-url",
    );

    const result = await useCase.execute({
      fileName: "avatar.png",
      contentType: "image/png",
      fileSize: 1024 * 100, // 100KB
      prefix: "avatars",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.uploadUrl).toBe("https://r2.example.com/upload-url");
    expect(result.value.key).toContain("avatars/");
  });
});
```
