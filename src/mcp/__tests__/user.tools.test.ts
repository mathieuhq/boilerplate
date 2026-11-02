import { describe, expect, it, vi } from "vitest";

import { userTools } from "../tools/user.tools";

vi.mock("@/shared/infrastructure/di/container", () => ({ container: {} }));

const updateProfile = userTools.find((tool) => tool.name === "update_profile");

describe("update_profile", () => {
  it("accepts a birth date in the past", () => {
    const result = updateProfile?.inputSchema.safeParse({
      birthDate: "1990-05-12",
    });

    expect(result?.success).toBe(true);
  });

  it("rejects a birth date in the future", () => {
    const nextYear = new Date().getFullYear() + 1;
    const result = updateProfile?.inputSchema.safeParse({
      birthDate: `${nextYear}-01-01`,
    });

    expect(result?.success).toBe(false);
    expect(result?.error?.issues[0]?.message).toBe(
      "Birth date must be in the past",
    );
  });
});
