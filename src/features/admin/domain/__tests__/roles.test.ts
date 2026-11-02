import { describe, expect, it } from "vitest";

import {
  isEditableRoleKey,
  isSystemRoleKey,
  isValidRoleKey,
  normalizeRoleKey,
} from "../roles";

describe("roles", () => {
  it("should treat admin and user as system roles", () => {
    expect(isSystemRoleKey("admin")).toBe(true);
    expect(isSystemRoleKey("user")).toBe(true);
    expect(isSystemRoleKey("support")).toBe(false);
  });

  it("should validate custom role keys", () => {
    expect(isValidRoleKey("support-team")).toBe(true);
    expect(isValidRoleKey("admin")).toBe(false);
    expect(isValidRoleKey("Support")).toBe(false);
    expect(isValidRoleKey("a")).toBe(false);
    expect(isValidRoleKey("1-support")).toBe(false);
  });

  it("should default missing roles to user", () => {
    expect(normalizeRoleKey(null)).toBe("user");
    expect(normalizeRoleKey(undefined)).toBe("user");
    expect(normalizeRoleKey("  ")).toBe("user");
    expect(normalizeRoleKey(" support ")).toBe("support");
  });

  it("should lock the admin role only", () => {
    expect(isEditableRoleKey("admin")).toBe(false);
    expect(isEditableRoleKey("user")).toBe(true);
    expect(isEditableRoleKey("support")).toBe(true);
  });
});
