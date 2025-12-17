import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IPaymentProviderPort } from "@/features/payment/application/ports/payment-provider.port";
import { createMockPaymentProvider } from "@/test/utils/mock-factories";

import { UpgradeSubscriptionUseCase } from "../use-cases/upgrade-subscription.use-case";

describe("UpgradeSubscriptionUseCase", () => {
  let useCase: UpgradeSubscriptionUseCase;
  let mockPaymentProvider: IPaymentProviderPort;

  beforeEach(() => {
    mockPaymentProvider = createMockPaymentProvider();
    useCase = new UpgradeSubscriptionUseCase(mockPaymentProvider);
  });

  it("should upgrade subscription and return checkout url", async () => {
    vi.mocked(mockPaymentProvider.upgradeSubscription).mockResolvedValue({
      url: "https://checkout.stripe.com/session-123",
    });

    const result = await useCase.execute({
      plan: "pro",
      cancelUrl: "https://example.com/cancel",
      successUrl: "https://example.com/success",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.url).toBe("https://checkout.stripe.com/session-123");
  });

  it("should pass all params to provider", async () => {
    vi.mocked(mockPaymentProvider.upgradeSubscription).mockResolvedValue({
      url: "https://checkout.stripe.com/session-123",
    });

    await useCase.execute({
      plan: "enterprise",
      seats: 5,
      annual: true,
      cancelUrl: "https://example.com/cancel",
      successUrl: "https://example.com/success",
      returnUrl: "https://example.com/return",
      referenceId: "ref-123",
      subscriptionId: "sub-123",
      disableRedirect: false,
      metadata: { key: "value" },
    });

    expect(mockPaymentProvider.upgradeSubscription).toHaveBeenCalledWith({
      plan: "enterprise",
      seats: 5,
      annual: true,
      cancelUrl: "https://example.com/cancel",
      successUrl: "https://example.com/success",
      returnUrl: "https://example.com/return",
      referenceId: "ref-123",
      subscriptionId: "sub-123",
      disableRedirect: false,
      metadata: { key: "value" },
    });
  });

  it("should handle upgrade without url when disableRedirect is true", async () => {
    vi.mocked(mockPaymentProvider.upgradeSubscription).mockResolvedValue({
      url: undefined,
    });

    const result = await useCase.execute({
      plan: "pro",
      cancelUrl: "https://example.com/cancel",
      successUrl: "https://example.com/success",
      disableRedirect: true,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.url).toBeUndefined();
  });
});
