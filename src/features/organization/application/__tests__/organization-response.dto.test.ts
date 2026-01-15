import { describe, expect, it } from "vitest";

import { Organization } from "../../domain/entities/organization.entity";
import { toOrganizationResponseDTO } from "../dto/organization-response.dto";

describe("toOrganizationResponseDTO", () => {
  it("should convert organization entity to DTO with logo", () => {
    const organization = Organization.create({
      id: "org-123",
      name: "Test Organization",
      slug: "test-organization",
      logo: "https://example.com/logo.png",
    });

    const dto = toOrganizationResponseDTO(organization);

    expect(dto).toEqual({
      id: "org-123",
      name: "Test Organization",
      slug: "test-organization",
      logo: "https://example.com/logo.png",
    });
  });

  it("should convert undefined logo to null", () => {
    const organization = Organization.create({
      id: "org-123",
      name: "Test Organization",
      slug: "test-organization",
    });

    const dto = toOrganizationResponseDTO(organization);

    expect(dto.logo).toBeNull();
  });

  it("should preserve all organization properties", () => {
    const organization = Organization.create({
      id: "org-456",
      name: "Another Org",
      slug: "another-org",
      logo: "https://example.com/another-logo.png",
    });

    const dto = toOrganizationResponseDTO(organization);

    expect(dto.id).toBe("org-456");
    expect(dto.name).toBe("Another Org");
    expect(dto.slug).toBe("another-org");
    expect(dto.logo).toBe("https://example.com/another-logo.png");
  });
});
