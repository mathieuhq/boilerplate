import type { AccessGrants } from "@/shared/domain/access-control";

import type { BanAdminUserUseCase } from "../../application/use-cases/ban-admin-user.use-case";
import type { CreateAdminRoleUseCase } from "../../application/use-cases/create-admin-role.use-case";
import type { DeleteAdminRoleUseCase } from "../../application/use-cases/delete-admin-role.use-case";
import type { ExportAdminAuditLogsUseCase } from "../../application/use-cases/export-admin-audit-logs.use-case";
import type { ExportAdminOrganizationsUseCase } from "../../application/use-cases/export-admin-organizations.use-case";
import type { ExportAdminUsersUseCase } from "../../application/use-cases/export-admin-users.use-case";
import type { GetAdminAuditLogFacetsUseCase } from "../../application/use-cases/get-admin-audit-log-facets.use-case";
import type { GetAdminOrganizationDetailsUseCase } from "../../application/use-cases/get-admin-organization-details.use-case";
import type { GetAdminOverviewMetricsUseCase } from "../../application/use-cases/get-admin-overview-metrics.use-case";
import type { GetRegistrationStatsUseCase } from "../../application/use-cases/get-registration-stats.use-case";
import type { ListAdminAuditLogsUseCase } from "../../application/use-cases/list-admin-audit-logs.use-case";
import type { ListAdminOrganizationsUseCase } from "../../application/use-cases/list-admin-organizations.use-case";
import type { ListAdminRolesUseCase } from "../../application/use-cases/list-admin-roles.use-case";
import type { ListAdminUsersUseCase } from "../../application/use-cases/list-admin-users.use-case";
import type { PromoteToAdminUseCase } from "../../application/use-cases/promote-to-admin.use-case";
import type { ResolveAccessUseCase } from "../../application/use-cases/resolve-access.use-case";
import type { SetAdminUserRoleUseCase } from "../../application/use-cases/set-admin-user-role.use-case";
import type { UnbanAdminUserUseCase } from "../../application/use-cases/unban-admin-user.use-case";
import type { UpdateAdminRoleUseCase } from "../../application/use-cases/update-admin-role.use-case";
import type {
  AdminListAuditLogsInput,
  AdminListOrganizationsInput,
  AdminListUsersInput,
} from "../../domain/repositories/admin.repository.interface";

type AdminActor = {
  actorUserId: string;
  actorAccess: AccessGrants;
};

type AdminExport<TQuery> = {
  actorUserId: string;
  query: TQuery;
};

type AdminSaveRoleInput = AdminActor & {
  key: string;
  name: string;
  description?: string;
  access: Partial<Record<string, string>>;
};

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
    private readonly resolveAccessUseCase: ResolveAccessUseCase,
    private readonly listAdminRolesUseCase: ListAdminRolesUseCase,
    private readonly createAdminRoleUseCase: CreateAdminRoleUseCase,
    private readonly updateAdminRoleUseCase: UpdateAdminRoleUseCase,
    private readonly deleteAdminRoleUseCase: DeleteAdminRoleUseCase,
    private readonly getAdminAuditLogFacetsUseCase: GetAdminAuditLogFacetsUseCase,
    private readonly exportAdminUsersUseCase: ExportAdminUsersUseCase,
    private readonly exportAdminOrganizationsUseCase: ExportAdminOrganizationsUseCase,
    private readonly exportAdminAuditLogsUseCase: ExportAdminAuditLogsUseCase,
  ) {}

  async promoteToAdminIfConfigured(user: {
    id: string;
    email: string;
    emailVerified: boolean;
    role?: string | null;
  }) {
    const result = await this.promoteToAdminUseCase.execute({
      userId: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
    });

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

  async setUserRole(input: AdminActor & { userId: string; role: string }) {
    const result = await this.setAdminUserRoleUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.user;
  }

  async banUser(
    input: AdminActor & {
      userId: string;
      reason?: string;
      expiresAt?: Date | null;
    },
  ) {
    const result = await this.banAdminUserUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.user;
  }

  async unbanUser(input: AdminActor & { userId: string }) {
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

  async getAuditLogFacets() {
    const result = await this.getAdminAuditLogFacetsUseCase.execute();

    if (result.isFailure) throw result.error;

    return result.value.facets;
  }

  async exportUsers(input: AdminExport<AdminListUsersInput>) {
    const result = await this.exportAdminUsersUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.batches;
  }

  async exportOrganizations(input: AdminExport<AdminListOrganizationsInput>) {
    const result = await this.exportAdminOrganizationsUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.batches;
  }

  async exportAuditLogs(input: AdminExport<AdminListAuditLogsInput>) {
    const result = await this.exportAdminAuditLogsUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.batches;
  }

  async resolveAccess(role?: string | null) {
    const result = await this.resolveAccessUseCase.execute({ role });

    if (result.isFailure) throw result.error;

    return result.value.access;
  }

  async listRoles() {
    const result = await this.listAdminRolesUseCase.execute();

    if (result.isFailure) throw result.error;

    return result.value.roles;
  }

  async createRole(input: AdminSaveRoleInput) {
    const result = await this.createAdminRoleUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.role;
  }

  async updateRole(input: AdminSaveRoleInput) {
    const result = await this.updateAdminRoleUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value.role;
  }

  async deleteRole(input: AdminActor & { key: string }) {
    const result = await this.deleteAdminRoleUseCase.execute(input);

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
