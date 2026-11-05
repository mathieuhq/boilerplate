const TEAM_OWNED_ORGANIZATION_LIMIT = 5;

export function hasReachedOwnedOrganizationLimit(input: {
  ownedCount: number;
  ownsTeamOrganization: boolean;
}) {
  const limit = input.ownsTeamOrganization ? TEAM_OWNED_ORGANIZATION_LIMIT : 1;

  return input.ownedCount >= limit;
}
