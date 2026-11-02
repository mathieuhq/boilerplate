import type { AcceptOrganizationInvitationUseCase } from "../../application/use-cases/accept-organization-invitation.use-case";
import type { CancelOrganizationInvitationUseCase } from "../../application/use-cases/cancel-organization-invitation.use-case";
import type { CreateOrganizationUseCase } from "../../application/use-cases/create-organization.use-case";
import type { GetCurrentUserOrganizationUseCase } from "../../application/use-cases/get-current-user-organization.use-case";
import type { InviteOrganizationMemberUseCase } from "../../application/use-cases/invite-organization-member.use-case";
import type { ListCurrentUserOrganizationsUseCase } from "../../application/use-cases/list-current-user-organizations.use-case";
import type { ListOrganizationInvitationsUseCase } from "../../application/use-cases/list-organization-invitations.use-case";
import type { ListOrganizationMembersUseCase } from "../../application/use-cases/list-organization-members.use-case";
import type { RemoveOrganizationMemberUseCase } from "../../application/use-cases/remove-organization-member.use-case";
import type { ResolveActiveOrganizationUseCase } from "../../application/use-cases/resolve-active-organization.use-case";
import type { SetActiveOrganizationUseCase } from "../../application/use-cases/set-active-organization.use-case";
import type { UpdateOrganizationUseCase } from "../../application/use-cases/update-organization.use-case";

export class OrganizationController {
  constructor(
    private readonly getCurrentUserOrganizationUseCase: GetCurrentUserOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly acceptOrganizationInvitationUseCase: AcceptOrganizationInvitationUseCase,
    private readonly inviteOrganizationMemberUseCase: InviteOrganizationMemberUseCase,
    private readonly listCurrentUserOrganizationsUseCase: ListCurrentUserOrganizationsUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly setActiveOrganizationUseCase: SetActiveOrganizationUseCase,
    private readonly resolveActiveOrganizationUseCase: ResolveActiveOrganizationUseCase,
    private readonly listOrganizationMembersUseCase: ListOrganizationMembersUseCase,
    private readonly removeOrganizationMemberUseCase: RemoveOrganizationMemberUseCase,
    private readonly listOrganizationInvitationsUseCase: ListOrganizationInvitationsUseCase,
    private readonly cancelOrganizationInvitationUseCase: CancelOrganizationInvitationUseCase,
  ) {}

  async getCurrentUserOrganization() {
    const result = await this.getCurrentUserOrganizationUseCase.execute({});

    return result.unwrap();
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

    return result.unwrap();
  }

  async listCurrentUserOrganizations() {
    const result = await this.listCurrentUserOrganizationsUseCase.execute({});

    return result.unwrap();
  }

  async createOrganization(input: { name: string; slug: string }) {
    const result = await this.createOrganizationUseCase.execute(input);

    return result.unwrap();
  }

  async setActiveOrganization(input: { organizationId: string }) {
    const result = await this.setActiveOrganizationUseCase.execute(input);

    return result.unwrap();
  }

  async resolveActiveOrganization() {
    const result = await this.resolveActiveOrganizationUseCase.execute({});

    return result.unwrap();
  }

  async listMembers(input: { organizationId: string }) {
    const result = await this.listOrganizationMembersUseCase.execute(input);

    return result.unwrap();
  }

  async removeMember(input: { organizationId: string; memberId: string }) {
    const result = await this.removeOrganizationMemberUseCase.execute(input);

    return result.unwrap();
  }

  async listInvitations(input: { organizationId: string }) {
    const result = await this.listOrganizationInvitationsUseCase.execute(input);

    return result.unwrap();
  }

  async cancelInvitation(input: { invitationId: string }) {
    const result =
      await this.cancelOrganizationInvitationUseCase.execute(input);

    return result.unwrap();
  }

  async acceptInvitation(invitationId: string) {
    const result = await this.acceptOrganizationInvitationUseCase.execute({
      invitationId,
    });

    return result.unwrap();
  }

  async inviteMember(input: {
    organizationId: string;
    email: string;
    role: "admin" | "member";
  }) {
    const result = await this.inviteOrganizationMemberUseCase.execute(input);

    return result.unwrap();
  }
}
