import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";
import type { IOrganizationAuditLogRepository } from "../../domain/repositories/organization-audit-log.repository.interface";
import type { IOrganizationRepository } from "../../domain/repositories/organization.repository.interface";
import type { OrganizationAuditLogListDTO } from "../dto/organization-audit-log.dto";

type ListOrganizationAuditLogsInput = {
  page: number;
  limit: number;
};

const MAX_LIMIT = 100;

export class ListOrganizationAuditLogsUseCase implements IUseCase<
  ListOrganizationAuditLogsInput,
  OrganizationAuditLogListDTO
> {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly auditLogRepository: IOrganizationAuditLogRepository,
    private readonly authProvider: IAuthProviderPort,
  ) {}

  async execute(
    input: ListOrganizationAuditLogsInput,
  ): Promise<Result<OrganizationAuditLogListDTO>> {
    const session = await this.authProvider.getSession();

    if (!session) return Result.fail(new OrganizationAccessDeniedError());

    const organization = await this.organizationRepository.findManageableByUser(
      session.user.id,
      session.session.activeOrganizationId,
    );

    if (!organization) return Result.fail(new OrganizationAccessDeniedError());

    const auditLogs = await this.auditLogRepository.listByOrganization({
      organizationId: organization.id,
      page: Math.max(1, Math.floor(input.page)),
      limit: Math.min(MAX_LIMIT, Math.max(1, Math.floor(input.limit))),
    });

    return Result.ok({
      organization: { id: organization.id, name: organization.name },
      auditLogs,
    });
  }
}
