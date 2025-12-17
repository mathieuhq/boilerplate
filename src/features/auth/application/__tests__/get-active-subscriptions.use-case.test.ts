import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { GetActiveSubscriptionsUseCase } from "../use-cases/get-active-subscriptions.use-case";

describe("GetActiveSubscriptionsUseCase", () => {
  let useCase: GetActiveSubscriptionsUseCase;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    useCase = new GetActiveSubscriptionsUseCase(mockAuthProvider);
  });

  it("should return active subscriptions", async () => {
    const mockSubscriptions = [
      {
        plan: "pro",
        id: "sub-123",
        status: "active",
        periodStart: new Date("2024-01-01"),
        periodEnd: new Date("2024-02-01"),
      },
    ];
    vi.mocked(mockAuthProvider.getActiveSubscriptions).mockResolvedValue(
      mockSubscriptions,
    );

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(mockSubscriptions);
    expect(result.value).toHaveLength(1);
  });

  it("should return empty array when no subscriptions", async () => {
    vi.mocked(mockAuthProvider.getActiveSubscriptions).mockResolvedValue([]);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([]);
  });

  it("should call auth provider getActiveSubscriptions", async () => {
    vi.mocked(mockAuthProvider.getActiveSubscriptions).mockResolvedValue([]);

    await useCase.execute({});

    expect(mockAuthProvider.getActiveSubscriptions).toHaveBeenCalledTimes(1);
  });

  it("should return multiple subscriptions", async () => {
    const mockSubscriptions = [
      { id: "sub-1", plan: "pro", status: "active" },
      { id: "sub-2", plan: "enterprise", status: "active" },
    ];
    vi.mocked(mockAuthProvider.getActiveSubscriptions).mockResolvedValue(
      mockSubscriptions,
    );

    const result = await useCase.execute({});

    expect(result.value).toHaveLength(2);
  });
});
