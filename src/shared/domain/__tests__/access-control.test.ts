import { describe, expect, it } from "vitest";

import {
  ACCESS_FEATURE_KEYS,
  coversAccess,
  fromAccessEntries,
  getFeatureLevels,
  getFullAccess,
  hasAccess,
  hasAnyAccess,
  isAccessFeature,
  normalizeAccessGrants,
  toAccessEntries,
} from "../access-control";

describe("access control", () => {
  it("should recognize registered features only", () => {
    expect(isAccessFeature("users")).toBe(true);
    expect(isAccessFeature("billing")).toBe(false);
    expect(isAccessFeature("toString")).toBe(false);
  });

  it("should expose the levels each feature supports", () => {
    expect(getFeatureLevels("users")).toEqual(["read", "write"]);
    expect(getFeatureLevels("overview")).toEqual(["read"]);
  });

  it("should treat write as including read", () => {
    expect(hasAccess({ users: "write" }, "users", "read")).toBe(true);
    expect(hasAccess({ users: "write" }, "users", "write")).toBe(true);
    expect(hasAccess({ users: "read" }, "users", "write")).toBe(false);
    expect(hasAccess({}, "users", "read")).toBe(false);
  });

  it("should check that granted access covers the required access", () => {
    expect(coversAccess({ users: "write" }, { users: "read" })).toBe(true);
    expect(
      coversAccess({ users: "read" }, { users: "read", roles: "read" }),
    ).toBe(false);
    expect(coversAccess({}, {})).toBe(true);
  });

  it("should grant the highest level of every feature as full access", () => {
    const fullAccess = getFullAccess();

    expect(Object.keys(fullAccess)).toEqual(ACCESS_FEATURE_KEYS);
    expect(fullAccess.users).toBe("write");
    expect(fullAccess.overview).toBe("read");
  });

  it("should clamp levels and drop unknown values when normalizing", () => {
    expect(
      normalizeAccessGrants({
        overview: "write",
        users: "read",
        roles: "admin",
        billing: "write",
      }),
    ).toEqual({ overview: "read", users: "read" });
  });

  it("should convert grants to and from stored entries", () => {
    const entries = toAccessEntries({ roles: "write", users: "read" });

    expect(entries).toEqual(["users:read", "roles:write"]);
    expect(fromAccessEntries(entries)).toEqual({
      users: "read",
      roles: "write",
    });
    expect(fromAccessEntries(["unknown:read", "users"])).toEqual({});
  });

  it("should detect whether any access is granted", () => {
    expect(hasAnyAccess({})).toBe(false);
    expect(hasAnyAccess({ overview: "read" })).toBe(true);
  });
});
