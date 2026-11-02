import { describe, expect, it, vi } from "vitest";

import { mcpTools } from "../server";

vi.mock("@/shared/infrastructure/di/container", () => ({ container: {} }));

describe("mcpTools", () => {
  it("uses unique snake_case tool names", () => {
    const names = mcpTools.map((tool) => tool.name);

    expect(new Set(names).size).toBe(names.length);

    for (const name of names) expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/);
  });

  it("restricts every admin tool to admins", () => {
    for (const tool of mcpTools)
      expect(Boolean(tool.adminOnly)).toBe(tool.name.startsWith("admin_"));
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
