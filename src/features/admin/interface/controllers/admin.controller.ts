import type { BanAdminUserUseCase } from "../../application/use-cases/ban-admin-user.use-case";
import type { GetAdminOrganizationDetailsUseCase } from "../../application/use-cases/get-admin-organization-details.use-case";
import type { GetAdminOverviewMetricsUseCase } from "../../application/use-cases/get-admin-overview-metrics.use-case";
import type { GetRegistrationStatsUseCase } from "../../application/use-cases/get-registration-stats.use-case";
import type { ListAdminAuditLogsUseCase } from "../../application/use-cases/list-admin-audit-logs.use-case";
import type { ListAdminOrganizationsUseCase } from "../../application/use-cases/list-admin-organizations.use-case";
import type { ListAdminUsersUseCase } from "../../application/use-cases/list-admin-users.use-case";
import type { PromoteToAdminUseCase } from "../../application/use-cases/promote-to-admin.use-case";
import type { SetAdminUserRoleUseCase } from "../../application/use-cases/set-admin-user-role.use-case";
import type { UnbanAdminUserUseCase } from "../../application/use-cases/unban-admin-user.use-case";
import type {
  AdminListAuditLogsInput,
  AdminListOrganizationsInput,
  AdminListUsersInput,
  AdminUserRole,
} from "../../domain/repositories/admin.repository.interface";

export class AdminController {
  constructor(
    private readonly promoteToAdminUseCase: PromoteToAdminUseCase,
    private readonly getRegistrationStatsUseCase: GetRegistrationStatsUseCase,
    private readonly getAdminOverviewMetricsUseCase: GetAdminOverviewMetricsUseCase,
    private readonly listAdminUsersUseCase: ListAdminUsersUseCase,
    private readonly setAdminUserRoleUseCase: SetAdminUserRoleUseCase,
    private readonly banAdminUserUseCase: BanAdminUserUseCase,
    private readonly unbanAdminUserUseCase: UnbanAdminUserUseCase,
    private readonly listAdminOrganizationsUseCase: ListAdminOrganizationsUseCase,
    private readonly getAdminOrganizationDetailsUseCase: GetAdminOrganizationDetailsUseCase,
    private readonly listAdminAuditLogsUseCase: ListAdminAuditLogsUseCase,
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

  async getOverviewMetrics() {
    const result = await this.getAdminOverviewMetricsUseCase.execute();

    if (result.isFailure) throw result.error;

    return result.value.metrics;
  }

  async listUsers(input: AdminListUsersInput) {
    const result = await this.listAdminUsersUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.users;
  }

  async setUserRole(input: {
    actorUserId: string;
    userId: string;
    role: AdminUserRole;
  }) {
    const result = await this.setAdminUserRoleUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.user;
  }

  async banUser(input: {
    actorUserId: string;
    userId: string;
    reason?: string;
    expiresAt?: Date | null;
  }) {
    const result = await this.banAdminUserUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.user;
  }

  async unbanUser(input: { actorUserId: string; userId: string }) {
    const result = await this.unbanAdminUserUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.user;
  }

  async listOrganizations(input: AdminListOrganizationsInput) {
    const result = await this.listAdminOrganizationsUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.organizations;
  }

  async getOrganizationDetails(organizationId: string) {
    const result = await this.getAdminOrganizationDetailsUseCase.execute({
      organizationId,
    });

    if (result.isFailure) throw result.error;

    return result.value.organization;
  }

  async listAuditLogs(input: AdminListAuditLogsInput) {
    const result = await this.listAdminAuditLogsUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.auditLogs;
  }
}
