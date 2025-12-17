import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IPaymentProviderPort } from "@/features/payment/application/ports/payment-provider.port";
import { createMockPaymentProvider } from "@/test/utils/mock-factories";

import { GetBillingPortalUseCase } from "../use-cases/get-billing-portal.use-case";

describe("GetBillingPortalUseCase", () => {
  let useCase: GetBillingPortalUseCase;
  let mockPaymentProvider: IPaymentProviderPort;

  beforeEach(() => {
    mockPaymentProvider = createMockPaymentProvider();
    useCase = new GetBillingPortalUseCase(mockPaymentProvider);
  });

  it("should return billing portal url", async () => {
    vi.mocked(mockPaymentProvider.getBillingPortalUrl).mockResolvedValue({
      url: "https://billing.stripe.com/session-123",
    });

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.url).toBe("https://billing.stripe.com/session-123");
  });

  it("should pass params to provider", async () => {
    vi.mocked(mockPaymentProvider.getBillingPortalUrl).mockResolvedValue({
      url: "https://billing.stripe.com/session-123",
    });

    await useCase.execute({
      returnUrl: "https://example.com/return",
      referenceId: "ref-123",
    });

    expect(mockPaymentProvider.getBillingPortalUrl).toHaveBeenCalledWith({
      returnUrl: "https://example.com/return",
      referenceId: "ref-123",
    });
  });

  it("should work without params", async () => {
    vi.mocked(mockPaymentProvider.getBillingPortalUrl).mockResolvedValue({
      url: "https://billing.stripe.com/session-123",
    });

    const result = await useCase.execute(undefined);

    expect(result.isSuccess).toBe(true);
    expect(mockPaymentProvider.getBillingPortalUrl).toHaveBeenCalledWith(
      undefined,
    );
  });

  it("should call provider getBillingPortalUrl once", async () => {
    vi.mocked(mockPaymentProvider.getBillingPortalUrl).mockResolvedValue({
      url: "https://billing.stripe.com/session-123",
    });

    await useCase.execute({});

    expect(mockPaymentProvider.getBillingPortalUrl).toHaveBeenCalledTimes(1);
  });
});
