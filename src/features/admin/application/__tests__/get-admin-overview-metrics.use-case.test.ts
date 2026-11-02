import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ICachePort } from "@/shared/application/ports/cache.port";
import { createMockCache } from "@/test/utils/mock-factories";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { GetAdminOverviewMetricsUseCase } from "../use-cases/get-admin-overview-metrics.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("GetAdminOverviewMetricsUseCase", () => {
  let useCase: GetAdminOverviewMetricsUseCase;
  let mockAdminRepository: IAdminRepository;
  let mockCache: ICachePort;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    mockCache = createMockCache();
    useCase = new GetAdminOverviewMetricsUseCase(
      mockAdminRepository,
      mockCache,
    );
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
    expect(mockCache.getOrSet).toHaveBeenCalledWith(
      "admin:overview-metrics",
      60,
      expect.any(Function),
    );
  });
});
