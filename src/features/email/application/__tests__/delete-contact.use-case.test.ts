import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import { createMockEmailProvider } from "@/test/utils/mock-factories";

import { DeleteContactUseCase } from "../use-cases/delete-contact.use-case";

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

type MockEmailProvider = Required<IEmailProviderPort>;

describe("DeleteContactUseCase", () => {
  let useCase: DeleteContactUseCase;
  let mockEmailProvider: MockEmailProvider;

  beforeEach(() => {
    mockEmailProvider = createMockEmailProvider() as MockEmailProvider;
    useCase = new DeleteContactUseCase(mockEmailProvider);
  });

  it("should delete the contact", async () => {
    vi.mocked(mockEmailProvider.deleteContact).mockResolvedValue(true);

    const result = await useCase.execute({ contactId: "contact-123" });

    expect(result.value.success).toBe(true);
    expect(mockEmailProvider.deleteContact).toHaveBeenCalledWith("contact-123");
  });

  it("should return failure when deletion fails", async () => {
    vi.mocked(mockEmailProvider.deleteContact).mockResolvedValue(false);

    const result = await useCase.execute({ contactId: "contact-123" });

    expect(result.value.success).toBe(false);
  });

  it("should return failure when the provider does not support deletion", async () => {
    const useCaseWithoutDelete = new DeleteContactUseCase({ send: vi.fn() });

    const result = await useCaseWithoutDelete.execute({
      contactId: "contact-123",
    });

    expect(result.value.success).toBe(false);
  });
});
