import type { Organization } from "../entities/organization.entity";

export type IOrganizationRepository = {
  findByUserIdWithAdminRole: (userId: string) => Promise<Organization | null>;
};
