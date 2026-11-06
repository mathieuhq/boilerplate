import { describe, expect, it } from "vitest";

import {
  hasOrganizationRole,
  hasReachedOwnedOrganizationLimit,
} from "../organization-limits.policy";

describe("organization limits policy", () => {
  it("allows a single owned organization without Team", () => {
    expect(
      hasReachedOwnedOrganizationLimit({
        ownedCount: 0,
        ownsTeamOrganization: false,
      }),
    ).toBe(false);
    expect(
      hasReachedOwnedOrganizationLimit({
        ownedCount: 1,
        ownsTeamOrganization: false,
      }),
    ).toBe(true);
  });

  it("allows five owned organizations with a Team organization", () => {
    expect(
      hasReachedOwnedOrganizationLimit({
        ownedCount: 4,
        ownsTeamOrganization: true,
      }),
    ).toBe(false);
    expect(
      hasReachedOwnedOrganizationLimit({
        ownedCount: 5,
        ownsTeamOrganization: true,
      }),
    ).toBe(true);
  });

  it("matches a role inside a comma separated member role list", () => {
    expect(hasOrganizationRole("owner", "owner")).toBe(true);
    expect(hasOrganizationRole("member, owner", "owner")).toBe(true);
    expect(hasOrganizationRole("co-owner,member", "owner")).toBe(false);
  });
});
