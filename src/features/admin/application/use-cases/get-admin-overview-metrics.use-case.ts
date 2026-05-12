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
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(): Promise<Result<GetAdminOverviewMetricsOutput>> {
    const metrics = await this.adminRepository.getOverviewMetrics();

    return Result.ok({ metrics });
  }
}
