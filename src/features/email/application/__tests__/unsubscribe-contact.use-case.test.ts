import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import { createMockEmailProvider } from "@/test/utils/mock-factories";

import { UnsubscribeContactUseCase } from "../use-cases/unsubscribe-contact.use-case";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

type MockEmailProvider = Required<IEmailProviderPort>;

describe("UnsubscribeContactUseCase", () => {
  let useCase: UnsubscribeContactUseCase;
  let mockEmailProvider: MockEmailProvider;

  beforeEach(() => {
    mockEmailProvider = createMockEmailProvider() as MockEmailProvider;
    useCase = new UnsubscribeContactUseCase(mockEmailProvider);
  });

  it("should unsubscribe contact successfully", async () => {
    vi.mocked(mockEmailProvider.unsubscribeContact).mockResolvedValue(
      "contact-123",
    );

    const result = await useCase.execute({
      contactId: "contact-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
  });

  it("should call provider with correct contactId", async () => {
    vi.mocked(mockEmailProvider.unsubscribeContact).mockResolvedValue(
      "contact-123",
    );

    await useCase.execute({
      contactId: "contact-123",
    });

    expect(mockEmailProvider.unsubscribeContact).toHaveBeenCalledWith(
      "contact-123",
    );
  });

  it("should return failure when unsubscription fails", async () => {
    vi.mocked(mockEmailProvider.unsubscribeContact).mockResolvedValue(
      undefined,
    );

    const result = await useCase.execute({
      contactId: "contact-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(false);
  });

  it("should return failure when provider does not support unsubscribeContact", async () => {
    const providerWithoutUnsubscribe: IEmailProviderPort = {
      send: vi.fn(),
    };
    const useCaseWithoutUnsubscribe = new UnsubscribeContactUseCase(
      providerWithoutUnsubscribe,
    );

    const result = await useCaseWithoutUnsubscribe.execute({
      contactId: "contact-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(false);
  });
});
