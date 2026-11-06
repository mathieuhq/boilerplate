import type { organization } from "@/lib/schema";

import {
  Organization,
  type OrganizationProps,
} from "../../domain/entities/organization.entity";

export function toDomain(raw: typeof organization.$inferSelect): Organization {
  const props: OrganizationProps = {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    logo: raw.logo ?? undefined,
  };

  return Organization.create(props);
}
