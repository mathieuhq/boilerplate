import { describe, expect, it } from "vitest";

import { meetsSearchRequirement } from "../search-requirement";
import type { SearchContext } from "../search.types";

const context: SearchContext = {
  userId: "user-1",
  locale: "en",
  access: { users: "read" },
  membership: { organizationId: "org-1", role: "member" },
};

describe("meetsSearchRequirement", () => {
  it("allows any authenticated user", () => {
    expect(meetsSearchRequirement({ kind: "authenticated" }, context)).toBe(
      true,
    );
  });

  it("checks feature access levels", () => {
    expect(
      meetsSearchRequirement(
        { kind: "access", feature: "users", level: "read" },
        context,
      ),
    ).toBe(true);
    expect(
      meetsSearchRequirement(
        { kind: "access", feature: "users", level: "write" },
        context,
      ),
    ).toBe(false);
    expect(
      meetsSearchRequirement(
        { kind: "access", feature: "organizations", level: "read" },
        context,
      ),
    ).toBe(false);
  });

  it("requires an active organization membership", () => {
    expect(
      meetsSearchRequirement(
        { kind: "organization" },
        { ...context, membership: null },
      ),
    ).toBe(false);
    expect(meetsSearchRequirement({ kind: "organization" }, context)).toBe(
      true,
    );
  });

  it("checks organization roles when listed", () => {
    expect(
      meetsSearchRequirement(
        { kind: "organization", roles: ["owner", "admin"] },
        context,
      ),
    ).toBe(false);
    expect(
      meetsSearchRequirement(
        { kind: "organization", roles: ["owner", "admin"] },
        { ...context, membership: { organizationId: "org-1", role: "admin" } },
      ),
    ).toBe(true);
  });
});
