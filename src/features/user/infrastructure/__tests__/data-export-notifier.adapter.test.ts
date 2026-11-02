import { render } from "react-email";
import { describe, expect, it, vi } from "vitest";

import { DataExportNotifierAdapter } from "../adapters/data-export-notifier.adapter";

describe("DataExportNotifierAdapter", () => {
  it("sends an in-app notification linking to the download and an email", async () => {
    const sendNotification = vi.fn().mockResolvedValue(undefined);
    const queueEmail = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();
    const adapter = new DataExportNotifierAdapter({
      serverUrl: "https://app.example.com",
      siteName: "Boilerplate",
      sendNotification,
      queueEmail,
      onError,
    });

    await adapter.notifyReady({
      exportId: "export-1",
      userId: "user-1",
      email: "ada@example.com",
      name: "Ada",
      language: "FR",
      expiresAt: new Date("2026-11-09T12:00:00.000Z"),
    });

    expect(sendNotification).toHaveBeenCalledWith({
      audience: { kind: "users", userIds: ["user-1"] },
      type: "user.data-export-ready",
      data: { expiresOn: "9 novembre 2026" },
      link: "/api/user/data-exports/export-1",
    });

    const email = queueEmail.mock.calls[0][0];
    const html = await render(email.html);

    expect(email.to).toBe("ada@example.com");
    expect(email.subject).toBe("Votre export de données est prêt");
    expect(html).toContain("https://app.example.com/settings/profile");
    expect(html).toContain("9 novembre 2026");
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports each delivery failure without blocking the other one", async () => {
    const onError = vi.fn();
    const queueEmail = vi.fn().mockRejectedValue(new Error("SMTP down"));
    const sendNotification = vi.fn().mockRejectedValue(new Error("Redis down"));
    const adapter = new DataExportNotifierAdapter({
      serverUrl: "https://app.example.com",
      siteName: "Boilerplate",
      sendNotification,
      queueEmail,
      onError,
    });

    await adapter.notifyReady({
      exportId: "export-1",
      userId: "user-1",
      email: "ada@example.com",
      name: "Ada",
      language: "EN",
      expiresAt: new Date("2026-11-09T12:00:00.000Z"),
    });

    expect(sendNotification).toHaveBeenCalled();
    expect(queueEmail).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      "Failed to send data export notification",
      expect.objectContaining({ exportId: "export-1" }),
    );
    expect(onError).toHaveBeenCalledWith(
      "Failed to send data export email",
      expect.objectContaining({ exportId: "export-1" }),
    );
  });
});
