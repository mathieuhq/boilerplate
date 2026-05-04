import type { GetRegistrationStatsUseCase } from "../../application/use-cases/get-registration-stats.use-case";
import type { PromoteToAdminUseCase } from "../../application/use-cases/promote-to-admin.use-case";

export class AdminController {
  constructor(
    private readonly promoteToAdminUseCase: PromoteToAdminUseCase,
    private readonly getRegistrationStatsUseCase: GetRegistrationStatsUseCase,
  ) {}

  async promoteToAdminIfConfigured(userId: string, email: string) {
    const result = await this.promoteToAdminUseCase.execute({ userId, email });

    if (result.isFailure) throw result.error;

    return result.value.promoted;
  }

  async getRegistrationStats(days: number) {
    const result = await this.getRegistrationStatsUseCase.execute({ days });

    if (result.isFailure) throw result.error;

    return result.value.stats;
  }
}
