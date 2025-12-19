import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { GetRegistrationStatsUseCase } from "../use-cases/get-registration-stats.use-case";

function createMockAdminRepository(): IAdminRepository {
  return {
    getRegistrationsByDay: vi.fn(),
  };
}

describe("GetRegistrationStatsUseCase", () => {
  let useCase: GetRegistrationStatsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new GetRegistrationStatsUseCase(mockAdminRepository);
  });

  it("should return registration stats for given days", async () => {
    const mockStats = [
      { date: "2025-01-15", count: 5 },
      { date: "2025-01-16", count: 10 },
      { date: "2025-01-17", count: 3 },
    ];
    vi.mocked(mockAdminRepository.getRegistrationsByDay).mockResolvedValue(
      mockStats,
    );

    const result = await useCase.execute({ days: 7 });

    expect(result.isSuccess).toBe(true);
    expect(result.value.stats).toEqual(mockStats);
  });

  it("should call repository with correct days parameter", async () => {
    vi.mocked(mockAdminRepository.getRegistrationsByDay).mockResolvedValue([]);

    await useCase.execute({ days: 30 });

    expect(mockAdminRepository.getRegistrationsByDay).toHaveBeenCalledWith(30);
  });

  it("should return empty stats array when no registrations", async () => {
    vi.mocked(mockAdminRepository.getRegistrationsByDay).mockResolvedValue([]);

    const result = await useCase.execute({ days: 7 });

    expect(result.isSuccess).toBe(true);
    expect(result.value.stats).toEqual([]);
  });

  it("should handle single day stats", async () => {
    const mockStats = [{ date: "2025-01-17", count: 42 }];
    vi.mocked(mockAdminRepository.getRegistrationsByDay).mockResolvedValue(
      mockStats,
    );

    const result = await useCase.execute({ days: 1 });

    expect(result.isSuccess).toBe(true);
    expect(result.value.stats).toHaveLength(1);
    expect(result.value.stats[0].count).toBe(42);
  });
});
