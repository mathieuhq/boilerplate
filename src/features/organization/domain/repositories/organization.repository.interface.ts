import type { Organization } from "../entities/organization.entity";

export type IOrganizationRepository = {
  findManageableByUser: (
    userId: string,
    activeOrganizationId?: string | null,
  ) => Promise<Organization | null>;
};
