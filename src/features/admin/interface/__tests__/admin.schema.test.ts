import { describe, expect, it } from "vitest";

import {
  adminOrganizationsPageSchema,
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

  it("keeps the selected organization next to the list query", () => {
    expect(
      adminOrganizationsPageSchema.parse({
        sort: "members.desc",
        organizationId: "org-1",
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      sort: "members.desc",
      organizationId: "org-1",
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
