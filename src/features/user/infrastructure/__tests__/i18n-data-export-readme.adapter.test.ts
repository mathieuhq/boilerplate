import { describe, expect, it } from "vitest";

import { I18nDataExportReadmeAdapter } from "../adapters/i18n-data-export-readme.adapter";

const input = {
  generatedAt: new Date("2026-11-02T12:00:00.000Z"),
  expiresAt: new Date("2026-11-09T12:00:00.000Z"),
  files: ["profile.json", "files/avatar-a.webp"],
};

describe("I18nDataExportReadmeAdapter", () => {
  const adapter = new I18nDataExportReadmeAdapter("Boilerplate");

  it("renders the README in English", () => {
    const readme = adapter.render({ ...input, language: "EN" });

    expect(readme).toContain("# Your personal data export");
    expect(readme).toContain("Boilerplate");
    expect(readme).toContain("2026-11-09T12:00:00.000Z");
    expect(readme).toContain("- `profile.json`: Your profile");
    expect(readme).toContain("- `files/avatar-a.webp`: Copy of a stored file.");
  });

  it("renders the README in French and falls back to English otherwise", () => {
    expect(adapter.render({ ...input, language: "FR" })).toContain(
      "# Export de vos données personnelles",
    );
    expect(adapter.render({ ...input, language: "DE" })).toContain(
      "# Your personal data export",
    );
  });
});
