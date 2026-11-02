import { useMatch } from "@tanstack/react-router";

import {
  type AccessFeature,
  type AccessGrants,
  type AccessLevel,
  hasAccess,
} from "@/shared/domain/access-control";

const NO_ACCESS: AccessGrants = {};

export function useAccess() {
  const dashboardMatch = useMatch({ from: "/_dashboard", shouldThrow: false });
  const access = dashboardMatch?.context.access ?? NO_ACCESS;

  return {
    access,
    can: (feature: AccessFeature, level: AccessLevel) =>
      hasAccess(access, feature, level),
  };
}
