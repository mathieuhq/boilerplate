import { describe, expect, it } from "vitest";

import { FileTooLargeError } from "../errors/file-too-large.error";
import { InvalidFileTypeError } from "../errors/invalid-file-type.error";

describe("InvalidFileTypeError", () => {
  it("should create error with correct message", () => {
    const error = new InvalidFileTypeError("application/pdf", [
      "image/jpeg",
      "image/png",
    ]);

    expect(error.name).toBe("InvalidFileTypeError");
    expect(error.message).toBe(
      "Invalid file type: application/pdf. Allowed types: image/jpeg, image/png",
    );
    expect(error).toBeInstanceOf(Error);
  });

  it("should handle single allowed type", () => {
    const error = new InvalidFileTypeError("text/plain", ["image/png"]);

    expect(error.message).toBe(
      "Invalid file type: text/plain. Allowed types: image/png",
    );
  });

  it("should handle empty allowed types", () => {
    const error = new InvalidFileTypeError("video/mp4", []);

    expect(error.message).toBe("Invalid file type: video/mp4. Allowed types: ");
  });
});

describe("FileTooLargeError", () => {
  it("should create error with correct message in MB", () => {
    const fileSize = 15 * 1024 * 1024;
    const maxSize = 10 * 1024 * 1024;

    const error = new FileTooLargeError(fileSize, maxSize);

    expect(error.name).toBe("FileTooLargeError");
    expect(error.message).toBe(
      "File size (15.00 MB) exceeds maximum allowed size (10.00 MB)",
    );
    expect(error).toBeInstanceOf(Error);
  });

  it("should format decimal values correctly", () => {
    const fileSize = 5.5 * 1024 * 1024;
    const maxSize = 5 * 1024 * 1024;

    const error = new FileTooLargeError(fileSize, maxSize);

    expect(error.message).toBe(
      "File size (5.50 MB) exceeds maximum allowed size (5.00 MB)",
    );
  });
});
