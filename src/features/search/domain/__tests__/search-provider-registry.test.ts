import { describe, expect, it, vi } from "vitest";

import { DuplicateSearchProviderError } from "../errors/duplicate-search-provider.error";
import { SearchProviderRegistry } from "../search-provider-registry";
import type { ISearchProvider } from "../search-provider.interface";
import type { SearchContext, SearchRequirement } from "../search.types";

function createProvider(
  type: string,
  requirement: SearchRequirement = { kind: "authenticated" },
): ISearchProvider {
  return { type, requirement, search: vi.fn().mockResolvedValue([]) };
}

const context: SearchContext = {
  userId: "user-1",
  locale: "en",
  access: {},
  membership: null,
};

describe("SearchProviderRegistry", () => {
  it("lists providers in registration order", () => {
    const pages = createProvider("pages");
    const users = createProvider("users");

    const registry = new SearchProviderRegistry([pages]).register(users);

    expect(registry.list()).toEqual([pages, users]);
  });

  it("starts empty", () => {
    expect(new SearchProviderRegistry().list()).toEqual([]);
  });

  it("rejects duplicate provider types", () => {
    const registry = new SearchProviderRegistry([createProvider("users")]);

    expect(() => registry.register(createProvider("users"))).toThrow(
      DuplicateSearchProviderError,
    );
  });

  it("filters providers by the requirement of each provider", () => {
    const pages = createProvider("pages");
    const users = createProvider("users", {
      kind: "access",
      feature: "users",
      level: "read",
    });
    const members = createProvider("members", { kind: "organization" });
    const registry = new SearchProviderRegistry([pages, users, members]);

    expect(registry.listAvailable(context)).toEqual([pages]);
    expect(
      registry.listAvailable({
        ...context,
        access: { users: "write" },
        membership: { organizationId: "org-1", role: "member" },
      }),
    ).toEqual([pages, users, members]);
  });
});
