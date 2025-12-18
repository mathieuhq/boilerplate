import { describe, expect, it } from "vitest";

import {
  ActionResponse,
  ApiResponse,
  isActionError,
  isActionSuccess,
} from "../api-response";
import { HttpStatus } from "../http-status";

describe("ApiResponse", () => {
  describe("success", () => {
    it("should return 200 OK with data by default", async () => {
      const data = { id: 1, name: "Test" };
      const response = ApiResponse.success(data);

      expect(response.status).toBe(HttpStatus.OK);

      const json = await response.json();
      expect(json).toEqual({ data });
    });

    it("should allow custom status code", async () => {
      const data = { id: 1 };
      const response = ApiResponse.success(data, HttpStatus.CREATED);

      expect(response.status).toBe(HttpStatus.CREATED);
    });
  });

  describe("created", () => {
    it("should return 201 Created with data", async () => {
      const data = { id: 1, name: "New Item" };
      const response = ApiResponse.created(data);

      expect(response.status).toBe(HttpStatus.CREATED);

      const json = await response.json();
      expect(json).toEqual({ data });
    });
  });

  describe("noContent", () => {
    it("should return 204 No Content with null body", () => {
      const response = ApiResponse.noContent();

      expect(response.status).toBe(HttpStatus.NO_CONTENT);
      expect(response.body).toBeNull();
    });
  });

  describe("paginated", () => {
    it("should return 200 OK with data and meta", async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = ApiResponse.paginated(data, { total: 100 });

      expect(response.status).toBe(HttpStatus.OK);

      const json = await response.json();
      expect(json).toEqual({
        data,
        meta: { total: 100 },
      });
    });

    it("should include optional page and limit in meta", async () => {
      const data = [{ id: 1 }];
      const response = ApiResponse.paginated(data, {
        total: 50,
        page: 2,
        limit: 10,
      });

      const json = await response.json();
      expect(json.meta).toEqual({
        total: 50,
        page: 2,
        limit: 10,
      });
    });
  });

  describe("error", () => {
    it("should return error with default 400 status", async () => {
      const response = ApiResponse.error("TEST_ERROR", "Test error message");

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      const json = await response.json();
      expect(json).toEqual({
        error: {
          code: "TEST_ERROR",
          message: "Test error message",
          details: undefined,
        },
      });
    });

    it("should include details when provided", async () => {
      const details = { field: "email", reason: "invalid" };
      const response = ApiResponse.error(
        "VALIDATION_ERROR",
        "Validation failed",
        HttpStatus.UNPROCESSABLE_ENTITY,
        details,
      );

      const json = await response.json();
      expect(json.error.details).toEqual(details);
    });
  });

  describe("badRequest", () => {
    it("should return 400 Bad Request", async () => {
      const response = ApiResponse.badRequest(
        "INVALID_INPUT",
        "Invalid input provided",
      );

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      const json = await response.json();
      expect(json.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("unauthorized", () => {
    it("should return 401 Unauthorized with default message", async () => {
      const response = ApiResponse.unauthorized();

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

      const json = await response.json();
      expect(json.error).toEqual({
        code: "UNAUTHORIZED",
        message: "Authentication required",
        details: undefined,
      });
    });

    it("should allow custom message", async () => {
      const response = ApiResponse.unauthorized("Token expired");

      const json = await response.json();
      expect(json.error.message).toBe("Token expired");
    });
  });

  describe("forbidden", () => {
    it("should return 403 Forbidden with default message", async () => {
      const response = ApiResponse.forbidden();

      expect(response.status).toBe(HttpStatus.FORBIDDEN);

      const json = await response.json();
      expect(json.error).toEqual({
        code: "FORBIDDEN",
        message: "Access denied",
        details: undefined,
      });
    });
  });

  describe("notFound", () => {
    it("should return 404 Not Found with generated code", async () => {
      const response = ApiResponse.notFound("User");

      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      const json = await response.json();
      expect(json.error).toEqual({
        code: "USER_NOT_FOUND",
        message: "User not found",
        details: undefined,
      });
    });

    it("should handle multi-word resources", async () => {
      const response = ApiResponse.notFound("Order Item");

      const json = await response.json();
      expect(json.error.code).toBe("ORDER_ITEM_NOT_FOUND");
    });

    it("should allow custom message", async () => {
      const response = ApiResponse.notFound(
        "User",
        "No user found with this ID",
      );

      const json = await response.json();
      expect(json.error.message).toBe("No user found with this ID");
    });
  });

  describe("conflict", () => {
    it("should return 409 Conflict", async () => {
      const response = ApiResponse.conflict(
        "EMAIL_EXISTS",
        "Email already in use",
      );

      expect(response.status).toBe(HttpStatus.CONFLICT);

      const json = await response.json();
      expect(json.error.code).toBe("EMAIL_EXISTS");
    });
  });

  describe("validationError", () => {
    it("should return 422 Unprocessable Entity", async () => {
      const response = ApiResponse.validationError("Invalid data");

      expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("internalError", () => {
    it("should return 500 Internal Server Error with default message", async () => {
      const response = ApiResponse.internalError();

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

      const json = await response.json();
      expect(json.error).toEqual({
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        details: undefined,
      });
    });
  });

  describe("tooManyRequests", () => {
    it("should return 429 Too Many Requests with default message", async () => {
      const response = ApiResponse.tooManyRequests();

      expect(response.status).toBe(HttpStatus.TOO_MANY_REQUESTS);

      const json = await response.json();
      expect(json.error).toEqual({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    });

    it("should allow custom message", async () => {
      const response = ApiResponse.tooManyRequests("Too many API calls");

      const json = await response.json();
      expect(json.error.message).toBe("Too many API calls");
    });

    it("should include custom headers when provided", async () => {
      const response = ApiResponse.tooManyRequests("Rate limit exceeded", {
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
      });

      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    });
  });
});

describe("ActionResponse", () => {
  describe("success", () => {
    it("should return data wrapped in success response", () => {
      const data = { id: 1, name: "Test" };
      const response = ActionResponse.success(data);

      expect(response).toEqual({ data });
    });
  });

  describe("error", () => {
    it("should return error object", () => {
      const response = ActionResponse.error(
        "TEST_ERROR",
        "Something went wrong",
      );

      expect(response).toEqual({
        error: {
          code: "TEST_ERROR",
          message: "Something went wrong",
          details: undefined,
        },
      });
    });

    it("should include details when provided", () => {
      const details = { field: "name" };
      const response = ActionResponse.error(
        "VALIDATION_ERROR",
        "Invalid name",
        details,
      );

      expect(response.error.details).toEqual(details);
    });
  });
});

describe("Type Guards", () => {
  describe("isActionError", () => {
    it("should return true for error responses", () => {
      const response = ActionResponse.error("ERROR", "Message");
      expect(isActionError(response)).toBe(true);
    });

    it("should return false for success responses", () => {
      const response = ActionResponse.success({ id: 1 });
      expect(isActionError(response)).toBe(false);
    });
  });

  describe("isActionSuccess", () => {
    it("should return true for success responses", () => {
      const response = ActionResponse.success({ id: 1 });
      expect(isActionSuccess(response)).toBe(true);
    });

    it("should return false for error responses", () => {
      const response = ActionResponse.error("ERROR", "Message");
      expect(isActionSuccess(response)).toBe(false);
    });
  });
});
