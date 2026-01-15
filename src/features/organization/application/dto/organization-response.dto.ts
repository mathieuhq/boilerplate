import type { Organization } from "../../domain/entities/organization.entity";

export type OrganizationResponseDTO = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

export function toOrganizationResponseDTO(
  organization: Organization,
): OrganizationResponseDTO {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logo: organization.logo ?? null,
  };
}
