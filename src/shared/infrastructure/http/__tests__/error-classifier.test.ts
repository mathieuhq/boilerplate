import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminOperationError } from "@/features/admin/application/errors/admin-operation.error";
import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { HttpError } from "@/shared/domain/errors/http.error";

import { classifyError } from "../error-classifier";

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn() },
}));

describe("classifyError", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the code, message, status and details of an HttpError", () => {
    expect(
      classifyError(
        HttpError.validationError("Invalid input", { field: "email" }),
      ),
    ).toEqual({
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      status: 422,
      details: { field: "email" },
    });
  });

  it("keeps the code and message of an HttpError in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(classifyError(HttpError.forbidden("Not allowed"))).toEqual({
      code: "FORBIDDEN",
      message: "Not allowed",
      status: 403,
      details: undefined,
    });
  });

  it("classifies a domain error as a validation error", () => {
    expect(classifyError(new DomainError("Email is invalid"))).toEqual({
      code: "VALIDATION_ERROR",
      message: "Email is invalid",
      status: 422,
    });
  });

  it("exposes the message of an unmapped application error outside production", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(classifyError(new ApplicationError("Quota reached"))).toEqual({
      code: "APPLICATION_ERROR",
      message: "Quota reached",
      status: 400,
    });
  });

  it("hides the message of an unmapped feature error in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(
      classifyError(new AdminOperationError("ADMIN_SECRET", "Internal detail")),
    ).toEqual({
      code: "APPLICATION_ERROR",
      message: "Request failed",
      status: 400,
    });
  });

  it("keeps the code of a feature error once its mapper ran", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(
      classifyError(
        toAdminActionError(
          new AdminOperationError("ADMIN_ROLE_IN_USE", "Role is assigned"),
        ),
      ),
    ).toMatchObject({
      code: "ADMIN_ROLE_IN_USE",
      message: "Role is assigned",
      status: 409,
    });
  });

  it("exposes the message of an unknown error in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(classifyError(new Error("Connection refused"))).toEqual({
      code: "INTERNAL_ERROR",
      message: "Connection refused",
      status: 500,
    });
  });

  it("hides the message of an unknown error outside development", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(classifyError(new Error("database password leaked"))).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      status: 500,
    });
  });

  it("classifies a thrown non-error value as an internal error", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(classifyError("boom")).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      status: 500,
    });
  });
});
