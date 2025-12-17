import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IPaymentProviderPort } from "@/features/payment/application/ports/payment-provider.port";
import { createMockPaymentProvider } from "@/test/utils/mock-factories";

import { RestoreSubscriptionUseCase } from "../use-cases/restore-subscription.use-case";

describe("RestoreSubscriptionUseCase", () => {
  let useCase: RestoreSubscriptionUseCase;
  let mockPaymentProvider: IPaymentProviderPort;

  beforeEach(() => {
    mockPaymentProvider = createMockPaymentProvider();
    useCase = new RestoreSubscriptionUseCase(mockPaymentProvider);
  });

  it("should restore subscription successfully", async () => {
    vi.mocked(mockPaymentProvider.restoreSubscription).mockResolvedValue(
      undefined,
    );

    const result = await useCase.execute({
      subscriptionId: "sub-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
  });

  it("should pass params to provider", async () => {
    vi.mocked(mockPaymentProvider.restoreSubscription).mockResolvedValue(
      undefined,
    );

    await useCase.execute({
      subscriptionId: "sub-123",
      referenceId: "ref-123",
    });

    expect(mockPaymentProvider.restoreSubscription).toHaveBeenCalledWith({
      subscriptionId: "sub-123",
      referenceId: "ref-123",
    });
  });

  it("should call provider restoreSubscription once", async () => {
    vi.mocked(mockPaymentProvider.restoreSubscription).mockResolvedValue(
      undefined,
    );

    await useCase.execute({
      subscriptionId: "sub-123",
    });

    expect(mockPaymentProvider.restoreSubscription).toHaveBeenCalledTimes(1);
  });
});
