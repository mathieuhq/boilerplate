import { describe, expect, it } from "vitest";

import type { Organization as PrismaOrganization } from "@/lib/generated/prisma/client";

import { Organization } from "../../domain/entities/organization.entity";
import { toDomain } from "../mappers/prisma-organization.mapper";

describe("prisma-organization.mapper", () => {
  describe("toDomain", () => {
    it("should convert PrismaOrganization to Organization entity", () => {
      const prismaOrganization: PrismaOrganization = {
        id: "org-123",
        name: "Test Organization",
        slug: "test-organization",
        logo: "https://example.com/logo.png",
        createdAt: new Date("2024-01-01"),
        metadata: null,
      };

      const organization = toDomain(prismaOrganization);

      expect(organization).toBeInstanceOf(Organization);
      expect(organization.id).toBe("org-123");
      expect(organization.name).toBe("Test Organization");
      expect(organization.slug).toBe("test-organization");
      expect(organization.logo).toBe("https://example.com/logo.png");
    });

    it("should convert null logo to undefined", () => {
      const prismaOrganization: PrismaOrganization = {
        id: "org-123",
        name: "Test Organization",
        slug: "test-organization",
        logo: null,
        createdAt: new Date("2024-01-01"),
        metadata: null,
      };

      const organization = toDomain(prismaOrganization);

      expect(organization.logo).toBeUndefined();
    });

    it("should preserve logo when present", () => {
      const prismaOrganization: PrismaOrganization = {
        id: "org-456",
        name: "Another Org",
        slug: "another-org",
        logo: "https://example.com/another-logo.png",
        createdAt: new Date("2024-01-01"),
        metadata: null,
      };

      const organization = toDomain(prismaOrganization);

      expect(organization.logo).toBe("https://example.com/another-logo.png");
    });
  });
});
