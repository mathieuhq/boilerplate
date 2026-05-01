import type { AcceptOrganizationInvitationUseCase } from "../../application/use-cases/accept-organization-invitation.use-case";
import type { GetCurrentUserOrganizationUseCase } from "../../application/use-cases/get-current-user-organization.use-case";
import type { UpdateOrganizationUseCase } from "../../application/use-cases/update-organization.use-case";

export class OrganizationController {
  constructor(
    private readonly getCurrentUserOrganizationUseCase: GetCurrentUserOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly acceptOrganizationInvitationUseCase: AcceptOrganizationInvitationUseCase,
  ) {}

  async getCurrentUserOrganization() {
    const result = await this.getCurrentUserOrganizationUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async canManageCurrentUserOrganization() {
    const result = await this.getCurrentUserOrganizationUseCase.execute({});

    return result.isSuccess;
  }

  async updateOrganization(input: {
    organizationId: string;
    name?: string;
    slug?: string;
    logo?: string | null;
  }) {
    const result = await this.updateOrganizationUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async acceptInvitation(invitationId: string) {
    const result = await this.acceptOrganizationInvitationUseCase.execute({
      invitationId,
    });

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
