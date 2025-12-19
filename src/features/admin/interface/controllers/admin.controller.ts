import type { PromoteToAdminUseCase } from "../../application/use-cases/promote-to-admin.use-case";

export class AdminController {
  constructor(private readonly promoteToAdminUseCase: PromoteToAdminUseCase) {}

  async promoteToAdminIfOriginal(userId: string, email: string) {
    const result = await this.promoteToAdminUseCase.execute({ userId, email });

    if (result.isFailure) throw result.error;

    return result.value.promoted;
  }
}
