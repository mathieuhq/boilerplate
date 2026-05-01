import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/lib/generated/prisma/client";

import { Organization } from "../../domain/entities/organization.entity";
import { PrismaOrganizationRepository } from "../repositories/prisma-organization.repository";

describe("PrismaOrganizationRepository", () => {
  let repository: PrismaOrganizationRepository;
  let mockPrisma: {
    member: {
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      member: {
        findFirst: vi.fn(),
      },
    };
    repository = new PrismaOrganizationRepository(
      mockPrisma as unknown as PrismaClient,
    );
  });

  describe("findManageableByUser", () => {
    it("should return organization when user has admin/owner role", async () => {
      const mockMember = {
        id: "member-123",
        userId: "user-123",
        organizationId: "org-123",
        role: "admin",
        organization: {
          id: "org-123",
          name: "Test Organization",
          slug: "test-organization",
          logo: "https://example.com/logo.png",
          createdAt: new Date("2024-01-01"),
          metadata: null,
        },
      };
      mockPrisma.member.findFirst.mockResolvedValue(mockMember);

      const result = await repository.findManageableByUser("user-123");

      expect(result).toBeInstanceOf(Organization);
      expect(result?.id).toBe("org-123");
      expect(result?.name).toBe("Test Organization");
      expect(result?.slug).toBe("test-organization");
      expect(result?.logo).toBe("https://example.com/logo.png");
    });

    it("should call prisma with correct parameters", async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await repository.findManageableByUser("user-456");

      expect(mockPrisma.member.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "user-456",
          role: { in: ["owner", "admin"] },
        },
        include: {
          organization: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
    });

    it("should use active organization id when provided", async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await repository.findManageableByUser("user-456", "org-active");

      expect(mockPrisma.member.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-active",
          userId: "user-456",
          role: { in: ["owner", "admin"] },
        },
        include: {
          organization: true,
        },
      });
    });

    it("should return null when user does not have admin/owner role", async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      const result = await repository.findManageableByUser("user-123");

      expect(result).toBeNull();
    });

    it("should handle organization without logo", async () => {
      const mockMember = {
        id: "member-123",
        userId: "user-123",
        organizationId: "org-123",
        role: "owner",
        organization: {
          id: "org-123",
          name: "Test Organization",
          slug: "test-organization",
          logo: null,
          createdAt: new Date("2024-01-01"),
          metadata: null,
        },
      };
      mockPrisma.member.findFirst.mockResolvedValue(mockMember);

      const result = await repository.findManageableByUser("user-123");

      expect(result).toBeInstanceOf(Organization);
      expect(result?.logo).toBeUndefined();
    });
  });
});
