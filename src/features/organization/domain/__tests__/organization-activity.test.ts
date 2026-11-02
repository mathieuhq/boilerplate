import { describe, expect, it } from "vitest";

import {
  isOrganizationActivityAction,
  ORGANIZATION_ACTIVITY_ACTIONS,
} from "../organization-activity";

describe("organization activity", () => {
  it("should recognize every registered action", () => {
    for (const action of ORGANIZATION_ACTIVITY_ACTIONS)
      expect(isOrganizationActivityAction(action)).toBe(true);
  });

  it("should reject actions outside organizations", () => {
    expect(isOrganizationActivityAction("admin.user.banned")).toBe(false);
    expect(isOrganizationActivityAction("")).toBe(false);
  });
});
