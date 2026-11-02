import { describe, expect, it, vi } from "vitest";

import {
  type AccessGrants,
  getFeatureLevels,
  getFullAccess,
} from "@/shared/domain/access-control";

import { mcpTools } from "../server";
import { getAvailableMcpTools, type McpUser } from "../tool";

vi.mock("@/shared/infrastructure/di/container", () => ({ container: {} }));

function toUser(access: AccessGrants): McpUser {
  return { id: "user-1", email: "user@example.com", name: "User", access };
}

describe("mcpTools", () => {
  it("uses unique snake_case tool names", () => {
    const names = mcpTools.map((tool) => tool.name);

    expect(new Set(names).size).toBe(names.length);

    for (const name of names) expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });

  it("restricts every admin tool with an access requirement", () => {
    for (const tool of mcpTools)
      expect(Boolean(tool.access)).toBe(tool.name.startsWith("admin_"));
  });

  it("requires a level each restricted tool feature supports", () => {
    for (const tool of mcpTools) {
      if (!tool.access) continue;

      expect(getFeatureLevels(tool.access.feature)).toContain(
        tool.access.level,
      );
      expect(tool.access.level).toBe(
        tool.annotations?.readOnlyHint ? "read" : "write",
      );
    }
  });

  it("exposes no admin tool to a role without access", () => {
    const names = getAvailableMcpTools(mcpTools, toUser({})).map(
      (tool) => tool.name,
    );

    expect(names.some((name) => name.startsWith("admin_"))).toBe(false);
  });

  it("exposes only the admin tools a custom role grants", () => {
    const names = getAvailableMcpTools(
      mcpTools,
      toUser({ users: "read", roles: "write" }),
    )
      .map((tool) => tool.name)
      .filter((name) => name.startsWith("admin_"));

    expect(names).toEqual([
      "admin_list_users",
      "admin_list_roles",
      "admin_create_role",
      "admin_update_role",
      "admin_delete_role",
    ]);
  });

  it("exposes every tool to full access", () => {
    expect(getAvailableMcpTools(mcpTools, toUser(getFullAccess()))).toEqual(
      mcpTools,
    );
  });

  it("describes every tool input as a JSON schema object", () => {
    for (const tool of mcpTools) {
      const schema = tool.inputSchema["~standard"].jsonSchema.input({
        target: "draft-2020-12",
      });

      expect(schema).toMatchObject({ type: "object" });
    }
  });
});
