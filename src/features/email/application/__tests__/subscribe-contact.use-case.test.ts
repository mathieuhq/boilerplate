import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import { createMockEmailProvider } from "@/test/utils/mock-factories";

import { SubscribeContactUseCase } from "../use-cases/subscribe-contact.use-case";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

type MockEmailProvider = Required<IEmailProviderPort>;

describe("SubscribeContactUseCase", () => {
  let useCase: SubscribeContactUseCase;
  let mockEmailProvider: MockEmailProvider;

  beforeEach(() => {
    mockEmailProvider = createMockEmailProvider() as MockEmailProvider;
    useCase = new SubscribeContactUseCase(mockEmailProvider);
  });

  it("should subscribe contact successfully", async () => {
    vi.mocked(mockEmailProvider.subscribeContact).mockResolvedValue(
      "contact-123",
    );

    const result = await useCase.execute({
      name: "John Doe",
      email: "user@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
    expect(result.value.contactId).toBe("contact-123");
  });

  it("should call provider with correct params", async () => {
    vi.mocked(mockEmailProvider.subscribeContact).mockResolvedValue(
      "contact-123",
    );

    await useCase.execute({
      name: "John Doe",
      email: "user@example.com",
    });

    expect(mockEmailProvider.subscribeContact).toHaveBeenCalledWith({
      name: "John Doe",
      email: "user@example.com",
    });
  });

  it("should return failure when subscription fails", async () => {
    vi.mocked(mockEmailProvider.subscribeContact).mockResolvedValue(undefined);

    const result = await useCase.execute({
      email: "user@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(false);
    expect(result.value.contactId).toBeUndefined();
  });

  it("should return failure when provider does not support subscribeContact", async () => {
    const providerWithoutSubscribe: IEmailProviderPort = {
      send: vi.fn(),
    };
    const useCaseWithoutSubscribe = new SubscribeContactUseCase(
      providerWithoutSubscribe,
    );

    const result = await useCaseWithoutSubscribe.execute({
      email: "user@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(false);
  });

  it("should work without name parameter", async () => {
    vi.mocked(mockEmailProvider.subscribeContact).mockResolvedValue(
      "contact-456",
    );

    const result = await useCase.execute({
      email: "user@example.com",
    });

    expect(result.value.success).toBe(true);
    expect(mockEmailProvider.subscribeContact).toHaveBeenCalledWith({
      email: "user@example.com",
      name: undefined,
    });
  });
});
