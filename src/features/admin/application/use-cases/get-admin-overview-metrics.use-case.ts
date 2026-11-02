import { CacheKeys, CacheTtl } from "@/shared/application/cache-keys";
import type { ICachePort } from "@/shared/application/ports/cache.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminOverviewMetricsDTO } from "../dto/admin-overview-metrics.dto";

type GetAdminOverviewMetricsOutput = {
  metrics: AdminOverviewMetricsDTO;
};

export class GetAdminOverviewMetricsUseCase implements IUseCase<
  void,
  GetAdminOverviewMetricsOutput
> {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly cache: ICachePort,
  ) {}

  async execute(): Promise<Result<GetAdminOverviewMetricsOutput>> {
    const metrics = await this.cache.getOrSet(
      CacheKeys.adminOverviewMetrics(),
      CacheTtl.adminOverviewMetrics,
      async () => this.adminRepository.getOverviewMetrics(),
    );

    return Result.ok({ metrics });
  }
}
