import type { Organization as PrismaOrganization } from "@/lib/generated/prisma/client";

import {
  Organization,
  type OrganizationProps,
} from "../../domain/entities/organization.entity";

export function toDomain(raw: PrismaOrganization): Organization {
  const props: OrganizationProps = {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    logo: raw.logo ?? undefined,
  };

  return Organization.create(props);
}
