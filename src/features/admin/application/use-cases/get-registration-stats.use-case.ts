import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  DailyRegistrationStat,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";

type GetRegistrationStatsInput = {
  days: number;
};

type GetRegistrationStatsOutput = {
  stats: DailyRegistrationStat[];
};

export class GetRegistrationStatsUseCase implements IUseCase<
  GetRegistrationStatsInput,
  GetRegistrationStatsOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: GetRegistrationStatsInput,
  ): Promise<Result<GetRegistrationStatsOutput>> {
    const stats = await this.adminRepository.getRegistrationsByDay(input.days);

    return Result.ok({ stats });
  }
}
