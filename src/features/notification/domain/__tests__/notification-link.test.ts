import { describe, expect, it } from "vitest";

import { InvalidNotificationLinkError } from "../errors/invalid-notification-link.error";
import { isSafeNotificationLink } from "../notification-link";

describe("isSafeNotificationLink", () => {
  it.each(["/settings", "/admin/users?page=2", "/"])(
    "accepts the app path %s",
    (link) => {
      expect(isSafeNotificationLink(link)).toBe(true);
    },
  );

  it.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com",
    "mailto:someone@example.com",
    "settings",
  ])("rejects %s", (link) => {
    expect(isSafeNotificationLink(link)).toBe(false);
  });
});

describe("InvalidNotificationLinkError", () => {
  it("names the rejected link", () => {
    const error = new InvalidNotificationLinkError("https://evil.example.com");

    expect(error.name).toBe("InvalidNotificationLinkError");
    expect(error.message).toContain("https://evil.example.com");
  });
});
