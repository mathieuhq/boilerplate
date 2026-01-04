import { describe, expect, it } from "vitest";

import { HttpStatus } from "@/shared/infrastructure/http/http-status";

import { HttpError } from "../http.error";

describe("HttpError", () => {
  describe("constructor", () => {
    it("should create error with code, message, and default status", () => {
      const error = new HttpError("TEST_ERROR", "Test message");

      expect(error.code).toBe("TEST_ERROR");
      expect(error.message).toBe("Test message");
      expect(error.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error.details).toBeUndefined();
      expect(error.name).toBe("HttpError");
    });

    it("should create error with custom status and details", () => {
      const details = { field: "email" };
      const error = new HttpError(
        "CUSTOM_ERROR",
        "Custom message",
        HttpStatus.CONFLICT,
        details,
      );

      expect(error.status).toBe(HttpStatus.CONFLICT);
      expect(error.details).toEqual(details);
    });
  });

  describe("static factory methods", () => {
    it("badRequest should create 400 error", () => {
      const error = HttpError.badRequest("BAD_INPUT", "Invalid input");

      expect(error.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error.code).toBe("BAD_INPUT");
    });

    it("unauthorized should create 401 error with default message", () => {
      const error = HttpError.unauthorized();

      expect(error.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Authentication required");
    });

    it("unauthorized should allow custom message", () => {
      const error = HttpError.unauthorized("Session expired");

      expect(error.message).toBe("Session expired");
    });

    it("forbidden should create 403 error with default message", () => {
      const error = HttpError.forbidden();

      expect(error.status).toBe(HttpStatus.FORBIDDEN);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Access denied");
    });

    it("notFound should create 404 error with generated code", () => {
      const error = HttpError.notFound("User");

      expect(error.status).toBe(HttpStatus.NOT_FOUND);
      expect(error.code).toBe("USER_NOT_FOUND");
      expect(error.message).toBe("User not found");
    });

    it("notFound should handle multi-word resources", () => {
      const error = HttpError.notFound("Order Item");

      expect(error.code).toBe("ORDER_ITEM_NOT_FOUND");
    });

    it("conflict should create 409 error", () => {
      const error = HttpError.conflict("DUPLICATE", "Already exists");

      expect(error.status).toBe(HttpStatus.CONFLICT);
      expect(error.code).toBe("DUPLICATE");
    });

    it("validationError should create 422 error", () => {
      const details = { fields: ["email", "name"] };
      const error = HttpError.validationError("Validation failed", details);

      expect(error.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.details).toEqual(details);
    });

    it("internalError should create 500 error with default message", () => {
      const error = HttpError.internalError();

      expect(error.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.message).toBe("An unexpected error occurred");
    });
  });

  it("should be an instance of Error", () => {
    const error = HttpError.badRequest("CODE", "Message");

    expect(error).toBeInstanceOf(Error);
  });
});
