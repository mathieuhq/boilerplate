import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getOpenApiDocument } from "../openapi";

const PUBLIC_ROUTES_DIR = join(process.cwd(), "src/app/api/v1/public");

const UNDOCUMENTED_ROUTES = new Set(["docs.ts", "openapi[.]json.ts"]);

describe("getOpenApiDocument", () => {
  it("documents every public API route", () => {
    const routes = readdirSync(PUBLIC_ROUTES_DIR)
      .filter((file) => file.endsWith(".ts"))
      .filter((file) => !UNDOCUMENTED_ROUTES.has(file))
      .map((file) => `/${file.replace(/\.ts$/, "")}`);

    expect(routes.length).toBeGreaterThan(0);
    expect(Object.keys(getOpenApiDocument().paths).sort()).toEqual(
      routes.sort(),
    );
  });

  it("requires an API key on /me and nothing on /health", () => {
    const { paths } = getOpenApiDocument();

    expect(paths["/me"].get.security).toEqual([{ apiKey: [] }]);
    expect(paths["/health"].get.security).toEqual([]);
  });
});
