import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { GetAdminOverviewMetricsUseCase } from "../use-cases/get-admin-overview-metrics.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("GetAdminOverviewMetricsUseCase", () => {
  let useCase: GetAdminOverviewMetricsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new GetAdminOverviewMetricsUseCase(mockAdminRepository);
  });

  it("should return overview metrics", async () => {
    const metrics = {
      totalUsers: 100,
      newUsersLast7Days: 12,
      newUsersLast30Days: 42,
      totalOrganizations: 20,
      pendingInvitations: 5,
      bannedUsers: 2,
      activeSessions: 18,
    };
    vi.mocked(mockAdminRepository.getOverviewMetrics).mockResolvedValue(
      metrics,
    );

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.value.metrics).toEqual(metrics);
  });
});
