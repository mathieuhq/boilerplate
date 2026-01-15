import { describe, expect, it } from "vitest";

import { DomainError } from "@/shared/domain/errors/domain.error";

import { OrganizationAccessDeniedError } from "../errors/organization-access-denied.error";

describe("OrganizationAccessDeniedError", () => {
  it("should create an error with the correct message", () => {
    const error = new OrganizationAccessDeniedError();

    expect(error.message).toBe(
      "You must be an owner or admin to access organization settings",
    );
  });

  it("should have the correct name", () => {
    const error = new OrganizationAccessDeniedError();

    expect(error.name).toBe("OrganizationAccessDeniedError");
  });

  it("should extend DomainError", () => {
    const error = new OrganizationAccessDeniedError();

    expect(error).toBeInstanceOf(DomainError);
  });

  it("should extend Error", () => {
    const error = new OrganizationAccessDeniedError();

    expect(error).toBeInstanceOf(Error);
  });
});
