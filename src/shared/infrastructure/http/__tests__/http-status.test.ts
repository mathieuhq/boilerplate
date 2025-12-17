import { describe, expect, it } from "vitest";

import { HttpStatus } from "../http-status";

describe("HttpStatus", () => {
  it("should have correct success status codes", () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.CREATED).toBe(201);
    expect(HttpStatus.NO_CONTENT).toBe(204);
  });

  it("should have correct client error status codes", () => {
    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.FORBIDDEN).toBe(403);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.CONFLICT).toBe(409);
    expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
  });

  it("should have correct server error status codes", () => {
    expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
  });
});
