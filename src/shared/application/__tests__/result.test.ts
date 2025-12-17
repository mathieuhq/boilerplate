import { describe, expect, it } from "vitest";

import { Result } from "../result";

describe("Result", () => {
  describe("ok", () => {
    it("should create a successful result with value", () => {
      const result = Result.ok("success");
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe("success");
    });

    it("should create a successful result with complex value", () => {
      const data = { id: 1, name: "test" };
      const result = Result.ok(data);
      expect(result.value).toEqual(data);
    });
  });

  describe("fail", () => {
    it("should create a failed result with error", () => {
      const error = new Error("Something went wrong");
      const result = Result.fail<string>(error);
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe("value getter", () => {
    it("should throw when accessing value on failed result", () => {
      const result = Result.fail<string>(new Error("error"));
      expect(() => result.value).toThrow("Cannot get value from failed result");
    });
  });

  describe("error getter", () => {
    it("should throw when accessing error on successful result", () => {
      const result = Result.ok("success");
      expect(() => result.error).toThrow(
        "Cannot get error from successful result",
      );
    });
  });
});
