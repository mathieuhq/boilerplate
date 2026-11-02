import { describe, expect, it } from "vitest";

import {
  listAdminAuditLogsSchema,
  listAdminUsersSchema,
} from "../schemas/admin.schema";

describe("admin list schemas", () => {
  it("accepts only the user sort fields", () => {
    expect(listAdminUsersSchema.parse({ sort: "email.asc" }).sort).toBe(
      "email.asc",
    );
    expect(
      listAdminUsersSchema.parse({ sort: "banReason.asc" }).sort,
    ).toBeUndefined();
  });

  it("parses the user filters", () => {
    expect(
      listAdminUsersSchema.parse({
        role: "admin",
        banned: "false",
        emailVerified: true,
        createdAt: "2026-01-01..",
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      role: ["admin"],
      banned: false,
      emailVerified: true,
      createdAt: "2026-01-01..",
    });
  });

  it("parses the audit log filters", () => {
    expect(
      listAdminAuditLogsSchema.parse({
        action: ["admin.user.banned"],
        resourceType: "user",
        actor: " jane ",
        sort: "createdAt.asc",
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      sort: "createdAt.asc",
      action: ["admin.user.banned"],
      resourceType: ["user"],
      actor: "jane",
    });
  });
});
