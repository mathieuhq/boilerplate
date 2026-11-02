import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/lib/generated/prisma/client";

import { PrismaSearchMembershipAdapter } from "../adapters/prisma-search-membership.adapter";

describe("PrismaSearchMembershipAdapter", () => {
  it("finds the membership of a user in an organization", async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValue({ organizationId: "org-1", role: "admin" });
    const adapter = new PrismaSearchMembershipAdapter({
      member: { findUnique },
    } as unknown as PrismaClient);

    const membership = await adapter.findMembership({
      userId: "user-1",
      organizationId: "org-1",
    });

    expect(membership).toEqual({ organizationId: "org-1", role: "admin" });
    expect(findUnique).toHaveBeenCalledWith({
      where: {
        organizationId_userId: { organizationId: "org-1", userId: "user-1" },
      },
      select: { organizationId: true, role: true },
    });
  });
});
