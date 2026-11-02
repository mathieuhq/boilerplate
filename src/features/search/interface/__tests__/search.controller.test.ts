import { describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/application/result";

import type { GlobalSearchUseCase } from "../../application/use-cases/global-search.use-case";
import { InvalidSearchTermError } from "../../domain/errors/invalid-search-term.error";
import { SearchController } from "../controllers/search.controller";
import { globalSearchSchema } from "../schemas/search.schema";

const input = {
  query: "jane",
  userId: "user-1",
  locale: "en",
  access: {},
  activeOrganizationId: null,
};

describe("SearchController", () => {
  it("returns the search response", async () => {
    const response = { query: "jane", groups: [], failedTypes: [] };
    const execute = vi.fn().mockResolvedValue(Result.ok(response));
    const controller = new SearchController({
      execute,
    } as unknown as GlobalSearchUseCase);

    await expect(controller.search(input)).resolves.toEqual(response);
    expect(execute).toHaveBeenCalledWith(input);
  });

  it("throws failures", async () => {
    const error = new InvalidSearchTermError(2, 100);
    const controller = new SearchController({
      execute: vi.fn().mockResolvedValue(Result.fail(error)),
    } as unknown as GlobalSearchUseCase);

    await expect(controller.search(input)).rejects.toBe(error);
  });
});

describe("globalSearchSchema", () => {
  it("trims queries and enforces the minimum length", () => {
    expect(globalSearchSchema.parse({ query: "  ja " })).toEqual({
      query: "ja",
    });
    expect(globalSearchSchema.safeParse({ query: " j " }).success).toBe(false);
  });
});
