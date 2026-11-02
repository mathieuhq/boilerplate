import { hasAccess } from "@/shared/domain/access-control";

import type { SearchContext, SearchRequirement } from "./search.types";

export function meetsSearchRequirement(
  requirement: SearchRequirement,
  context: SearchContext,
) {
  if (requirement.kind === "access")
    return hasAccess(context.access, requirement.feature, requirement.level);

  if (requirement.kind === "organization") {
    if (!context.membership) return false;

    return (
      !requirement.roles || requirement.roles.includes(context.membership.role)
    );
  }

  return true;
}
