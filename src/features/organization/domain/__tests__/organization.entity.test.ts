import { describe, expect, it } from "vitest";

import {
  Organization,
  type OrganizationProps,
} from "../entities/organization.entity";

describe("Organization Entity", () => {
  const baseProps: OrganizationProps = {
    id: "org-123",
    name: "Test Organization",
    slug: "test-organization",
  };

  describe("create", () => {
    it("should create an organization with required properties", () => {
      const organization = Organization.create(baseProps);

      expect(organization.id).toBe("org-123");
      expect(organization.name).toBe("Test Organization");
      expect(organization.slug).toBe("test-organization");
    });

    it("should create an organization with optional logo", () => {
      const props: OrganizationProps = {
        ...baseProps,
        logo: "https://example.com/logo.png",
      };
      const organization = Organization.create(props);

      expect(organization.logo).toBe("https://example.com/logo.png");
    });
  });

  describe("getters", () => {
    it("should return id", () => {
      const organization = Organization.create(baseProps);
      expect(organization.id).toBe("org-123");
    });

    it("should return name", () => {
      const organization = Organization.create(baseProps);
      expect(organization.name).toBe("Test Organization");
    });

    it("should return slug", () => {
      const organization = Organization.create(baseProps);
      expect(organization.slug).toBe("test-organization");
    });

    it("should return undefined for logo when not set", () => {
      const organization = Organization.create(baseProps);
      expect(organization.logo).toBeUndefined();
    });

    it("should return logo when set", () => {
      const organization = Organization.create({
        ...baseProps,
        logo: "https://example.com/logo.png",
      });
      expect(organization.logo).toBe("https://example.com/logo.png");
    });
  });
});
