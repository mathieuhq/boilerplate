import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { ApiKeyOwner, IApiKeyPort } from "../ports/api-key.port";
import { AuthenticateApiKeyUseCase } from "../use-cases/authenticate-api-key.use-case";

import { createMockApiKeys } from "./api-key.mock";

function createOwner(overrides: Partial<ApiKeyOwner> = {}): ApiKeyOwner {
  return {
    id: "user-1",
    name: "Ada",
    email: "ada@example.com",
    role: "user",
    banned: false,
    banExpires: null,
    ...overrides,
  };
}

describe("AuthenticateApiKeyUseCase", () => {
  let apiKeys: IApiKeyPort;
  let useCase: AuthenticateApiKeyUseCase;

  beforeEach(() => {
    apiKeys = createMockApiKeys();
    useCase = new AuthenticateApiKeyUseCase(apiKeys);
  });

  async function expectFailure(key: string | null, code: string) {
    const result = await useCase.execute({ key });

    expect((result.error as ApiKeyOperationError).code).toBe(code);
  }

  it("should return the key owner", async () => {
    vi.mocked(apiKeys.verifyApiKey).mockResolvedValue({
      status: "valid",
      keyId: "key-1",
      owner: createOwner(),
    });

    const result = await useCase.execute({ key: "secret" });

    expect(apiKeys.verifyApiKey).toHaveBeenCalledWith("secret");
    expect(result.value).toEqual({
      keyId: "key-1",
      user: {
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
        role: "user",
      },
    });
  });

  it("should accept the owner once the ban has expired", async () => {
    vi.mocked(apiKeys.verifyApiKey).mockResolvedValue({
      status: "valid",
      keyId: "key-1",
      owner: createOwner({
        banned: true,
        banExpires: new Date("2000-01-01T00:00:00.000Z"),
      }),
    });

    const result = await useCase.execute({ key: "secret" });

    expect(result.isSuccess).toBe(true);
  });

  it("should fail without a key", async () => {
    await expectFailure(null, "API_KEY_INVALID");
    expect(apiKeys.verifyApiKey).not.toHaveBeenCalled();
  });

  it("should fail for an invalid key", async () => {
    vi.mocked(apiKeys.verifyApiKey).mockResolvedValue({ status: "invalid" });

    await expectFailure("secret", "API_KEY_INVALID");
  });

  it("should fail when the key is rate limited", async () => {
    vi.mocked(apiKeys.verifyApiKey).mockResolvedValue({
      status: "rate_limited",
    });

    await expectFailure("secret", "API_KEY_RATE_LIMITED");
  });

  it.each([null, new Date("2999-01-01T00:00:00.000Z")])(
    "should fail when the owner is banned until %s",
    async (banExpires) => {
      vi.mocked(apiKeys.verifyApiKey).mockResolvedValue({
        status: "valid",
        keyId: "key-1",
        owner: createOwner({ banned: true, banExpires }),
      });

      await expectFailure("secret", "API_KEY_INVALID");
    },
  );
});
