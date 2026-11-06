import { describe, expect, it } from "vitest";

import { buildDataExportFiles } from "../services/build-data-export-files";

import { buildSnapshot } from "./data-export.mocks";

describe("buildDataExportFiles", () => {
  it("writes one readable JSON file per data category", () => {
    const snapshot = buildSnapshot();

    const files = buildDataExportFiles(snapshot, []);

    expect(files.map((file) => file.path)).toEqual([
      "profile.json",
      "accounts.json",
      "sessions.json",
      "passkeys.json",
      "memberships.json",
      "invitations.json",
      "notifications.json",
      "audit-logs.json",
      "connected-apps.json",
      "stored-files.json",
    ]);
    expect(files[0].content).toBe(
      `${JSON.stringify(snapshot.profile, null, 2)}\n`,
    );
  });

  it("adds stored files that could be downloaded and lists the others", () => {
    const files = buildDataExportFiles(buildSnapshot(), [
      {
        key: "user-avatars/a.webp",
        purpose: "avatar",
        content: Buffer.from("image"),
      },
      { key: "uploads/missing.png", purpose: "avatar", content: null },
    ]);

    const storedFiles = files.find((file) => file.path === "stored-files.json");
    const attachment = files.find(
      (file) => file.path === "files/avatar-a.webp",
    );

    expect(JSON.parse(storedFiles?.content as string)).toEqual([
      {
        key: "user-avatars/a.webp",
        purpose: "avatar",
        path: "files/avatar-a.webp",
        size: 5,
      },
      { key: "uploads/missing.png", purpose: "avatar", path: null, size: null },
    ]);
    expect(attachment?.content).toEqual(new Uint8Array(Buffer.from("image")));
    expect(files).toHaveLength(11);
  });
});
