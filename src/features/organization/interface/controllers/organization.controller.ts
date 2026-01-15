import type { GetCurrentUserOrganizationUseCase } from "../../application/use-cases/get-current-user-organization.use-case";

export class OrganizationController {
  constructor(
    private readonly getCurrentUserOrganizationUseCase: GetCurrentUserOrganizationUseCase,
  ) {}

  async getCurrentUserOrganization() {
    const result = await this.getCurrentUserOrganizationUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
