import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { FflateArchiveAdapter } from "../adapters/fflate-archive.adapter";

describe("FflateArchiveAdapter", () => {
  it("creates a ZIP archive containing text and binary files", async () => {
    const archive = await new FflateArchiveAdapter().create([
      { path: "README.md", content: "# Export" },
      { path: "files/avatar.webp", content: new Uint8Array([1, 2, 3]) },
    ]);

    const entries = unzipSync(archive);

    expect(strFromU8(entries["README.md"])).toBe("# Export");
    expect(Array.from(entries["files/avatar.webp"])).toEqual([1, 2, 3]);
  });
});
