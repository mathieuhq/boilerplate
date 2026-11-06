import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { auditLog, organization, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { DrizzleOrganizationAuditLogRepository } from "../repositories/drizzle-organization-audit-log.repository";

const baseQuery = { page: 1, pageSize: 10, organizationId: "org-1" };

describe("DrizzleOrganizationAuditLogRepository", () => {
  let repository: DrizzleOrganizationAuditLogRepository;

  beforeAll(async () => {
    const db: Database = await createTestDatabase();

    await db
      .insert(user)
      .values([
        { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
      ]);
    await db.insert(organization).values([
      { id: "org-1", name: "Acme", slug: "acme" },
      { id: "org-2", name: "Other", slug: "other" },
    ]);
    await db.insert(auditLog).values([
      {
        id: "log-1",
        actorUserId: "user-1",
        actorType: "user",
        organizationId: "org-1",
        action: "organization.member.invited",
        resourceType: "member",
        metadata: { email: "bob@example.com" },
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
      },
      {
        id: "log-2",
        actorUserId: null,
        actorType: "system",
        organizationId: "org-1",
        action: "organization.updated",
        resourceType: "organization",
        resourceId: "org-1",
        metadata: ["not", "an", "object"],
        createdAt: new Date("2026-01-02T10:00:00.000Z"),
      },
      {
        id: "log-3",
        actorUserId: "user-1",
        actorType: "user",
        organizationId: "org-2",
        action: "organization.updated",
        resourceType: "organization",
        createdAt: new Date("2026-01-03T10:00:00.000Z"),
      },
    ]);

    repository = new DrizzleOrganizationAuditLogRepository(db);
  });

  it("lists the organization entries newest first with their actor", async () => {
    const result = await repository.listByOrganization(baseQuery);

    expect(result.total).toBe(2);
    expect(result.items).toEqual([
      {
        id: "log-2",
        action: "organization.updated",
        actorType: "system",
        resourceType: "organization",
        resourceId: "org-1",
        actorUser: null,
        createdAt: "2026-01-02T10:00:00.000Z",
        metadata: null,
      },
      {
        id: "log-1",
        action: "organization.member.invited",
        actorType: "user",
        resourceType: "member",
        resourceId: null,
        actorUser: {
          id: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
        createdAt: "2026-01-01T10:00:00.000Z",
        metadata: { email: "bob@example.com" },
      },
    ]);
  });

  it("searches by actor name or email and counts the matches", async () => {
    const result = await repository.listByOrganization({
      ...baseQuery,
      search: "LOVELACE",
    });

    expect(result.total).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual(["log-1"]);
  });

  it("filters by action and date range and sorts by action", async () => {
    const byAction = await repository.listByOrganization({
      ...baseQuery,
      action: ["organization.updated"],
    });
    const byDate = await repository.listByOrganization({
      ...baseQuery,
      createdAt: "2026-01-01..2026-01-01",
    });
    const sorted = await repository.listByOrganization({
      ...baseQuery,
      sort: "action.asc",
    });

    expect(byAction.items.map((item) => item.id)).toEqual(["log-2"]);
    expect(byDate.items.map((item) => item.id)).toEqual(["log-1"]);
    expect(sorted.items.map((item) => item.id)).toEqual(["log-1", "log-2"]);
  });
});
