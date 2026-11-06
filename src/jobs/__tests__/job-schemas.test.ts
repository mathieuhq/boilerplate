import { describe, expect, it } from "vitest";

import { jobSchemas } from "../job-schemas";

describe("jobSchemas", () => {
  it("accepts a queued email and strips unknown fields", () => {
    const result = jobSchemas["email.send"].safeParse({
      to: "user@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
      attachments: [{ content: "aGk=", filename: "hi.txt", path: "/etc" }],
      injected: true,
    });

    expect(result).toEqual({
      success: true,
      data: {
        to: "user@example.com",
        subject: "Hello",
        html: "<p>Hello</p>",
        attachments: [{ content: "aGk=", filename: "hi.txt" }],
      },
    });
  });

  it("rejects an email without html", () => {
    expect(
      jobSchemas["email.send"].safeParse({ to: ["a@b.c"], subject: "Hi" })
        .success,
    ).toBe(false);
  });

  it("accepts a notification for a known type and audience", () => {
    expect(
      jobSchemas["notification.dispatch"].safeParse({
        audience: { kind: "access", feature: "jobs", level: "write" },
        type: "system.message",
        data: { title: "Maintenance" },
        link: "/settings",
      }).success,
    ).toBe(true);
  });

  it.each([
    {
      audience: { kind: "users", userIds: ["u1"] },
      type: "system.message",
      data: { title: "Hi" },
      link: "https://evil.example",
    },
    {
      audience: { kind: "access", feature: "billing", level: "read" },
      type: "system.message",
      data: { title: "Hi" },
    },
    {
      audience: { kind: "organization", organizationId: "o1" },
      type: "user.data-export-ready",
      data: { title: "Hi" },
    },
    {
      audience: { kind: "everyone" },
      type: "system.message",
      data: { title: "Hi" },
    },
  ])("rejects a forged notification %#", (payload) => {
    expect(jobSchemas["notification.dispatch"].safeParse(payload).success).toBe(
      false,
    );
  });

  it("rejects data on scheduled jobs without a payload", () => {
    expect(jobSchemas["auth.purge-expired-records"].safeParse({}).success).toBe(
      true,
    );
    expect(
      jobSchemas["notification.purge-read"].safeParse({ userId: "u1" }).success,
    ).toBe(false);
  });

  it("requires an export id to export user data", () => {
    expect(
      jobSchemas["user.export-data"].safeParse({ exportId: "e1" }).success,
    ).toBe(true);
    expect(jobSchemas["user.export-data"].safeParse({}).success).toBe(false);
  });
});
