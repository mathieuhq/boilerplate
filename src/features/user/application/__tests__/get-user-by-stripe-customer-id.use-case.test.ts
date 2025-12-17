import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import { createMockUserRepository } from "@/test/utils/mock-factories";

import { GetUserByStripeCustomerIdUseCase } from "../use-cases/get-user-by-stripe-customer-id.use-case";

describe("GetUserByStripeCustomerIdUseCase", () => {
  let useCase: GetUserByStripeCustomerIdUseCase;
  let mockUserRepository: IUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    useCase = new GetUserByStripeCustomerIdUseCase(mockUserRepository);
  });

  it("should return user email and name when found", async () => {
    const user = buildUser({ stripeCustomerId: "cus_123" });
    vi.mocked(mockUserRepository.findByStripeCustomerId).mockResolvedValue(
      user,
    );

    const result = await useCase.execute({ stripeCustomerId: "cus_123" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      email: "test@example.com",
      name: "Test User",
    });
  });

  it("should return null when user not found", async () => {
    vi.mocked(mockUserRepository.findByStripeCustomerId).mockResolvedValue(
      null,
    );

    const result = await useCase.execute({
      stripeCustomerId: "cus_non_existent",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeNull();
  });

  it("should call repository with correct stripe customer id", async () => {
    vi.mocked(mockUserRepository.findByStripeCustomerId).mockResolvedValue(
      null,
    );

    await useCase.execute({ stripeCustomerId: "cus_123" });

    expect(mockUserRepository.findByStripeCustomerId).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.findByStripeCustomerId).toHaveBeenCalledWith(
      "cus_123",
    );
  });
});
