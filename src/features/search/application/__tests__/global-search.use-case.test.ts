import { afterEach, describe, expect, it, vi } from "vitest";

import { InvalidSearchTermError } from "../../domain/errors/invalid-search-term.error";
import { SearchProviderRegistry } from "../../domain/search-provider-registry";
import type { ISearchProvider } from "../../domain/search-provider.interface";
import type {
  SearchRequirement,
  SearchResult,
} from "../../domain/search.types";
import type { GlobalSearchInputDTO } from "../dto/search.dto";
import { SearchProviderTimeoutError } from "../errors/search-provider-timeout.error";
import type { ISearchMembershipPort } from "../ports/search-membership.port";
import {
  type GlobalSearchOptions,
  GlobalSearchUseCase,
} from "../use-cases/global-search.use-case";

function createResult(id: string, type = "pages"): SearchResult {
  return {
    id,
    type,
    title: `Result ${id}`,
    subtitle: null,
    icon: "page",
    href: `/${id}`,
  };
}

function createProvider(
  type: string,
  search: ISearchProvider["search"],
  requirement: SearchRequirement = { kind: "authenticated" },
): ISearchProvider {
  return { type, requirement, search: vi.fn(search) };
}

function createUseCase(
  providers: ISearchProvider[],
  options: Partial<GlobalSearchOptions> = {},
  membershipPort: ISearchMembershipPort = {
    findMembership: vi.fn().mockResolvedValue(null),
  },
) {
  const onError = vi.fn();
  const useCase = new GlobalSearchUseCase(
    new SearchProviderRegistry(providers),
    membershipPort,
    { limitPerType: 2, timeoutMs: 100, onError, ...options },
  );

  return { useCase, onError, membershipPort };
}

const input: GlobalSearchInputDTO = {
  query: "  ja  ne ",
  userId: "user-1",
  locale: "fr",
  access: { users: "read" },
  activeOrganizationId: null,
};

afterEach(() => {
  vi.useRealTimers();
});

describe("GlobalSearchUseCase", () => {
  it("rejects queries shorter than two characters", async () => {
    const provider = createProvider("pages", async () => []);
    const { useCase } = createUseCase([provider]);

    const result = await useCase.execute({ ...input, query: " j " });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidSearchTermError);
    expect(provider.search).not.toHaveBeenCalled();
  });

  it("queries available providers in parallel with the normalized term", async () => {
    const pages = createProvider("pages", async () => [createResult("a")]);
    const users = createProvider("users", async () => [
      createResult("u1", "users"),
    ]);
    const organizations = createProvider(
      "organizations",
      async () => [createResult("o1", "organizations")],
      { kind: "access", feature: "organizations", level: "read" },
    );
    const { useCase } = createUseCase([pages, users, organizations]);

    const result = await useCase.execute(input);

    expect(result.value).toEqual({
      query: "ja ne",
      groups: [
        { type: "pages", results: [createResult("a")] },
        { type: "users", results: [createResult("u1", "users")] },
      ],
      failedTypes: [],
    });
    expect(pages.search).toHaveBeenCalledWith(
      { term: "ja ne", limit: 2 },
      {
        userId: "user-1",
        locale: "fr",
        access: { users: "read" },
        membership: null,
      },
    );
    expect(organizations.search).not.toHaveBeenCalled();
  });

  it("caps results per type and stamps the provider type", async () => {
    const pages = createProvider("pages", async () => [
      createResult("a", "other"),
      createResult("b"),
      createResult("c"),
    ]);
    const { useCase } = createUseCase([pages]);

    const result = await useCase.execute(input);

    expect(result.value.groups).toEqual([
      { type: "pages", results: [createResult("a"), createResult("b")] },
    ]);
  });

  it("omits providers without results", async () => {
    const { useCase } = createUseCase([
      createProvider("pages", async () => []),
    ]);

    const result = await useCase.execute(input);

    expect(result.value.groups).toEqual([]);
    expect(result.value.failedTypes).toEqual([]);
  });

  it("keeps other providers when one fails", async () => {
    const error = new Error("database down");
    const { useCase, onError } = createUseCase([
      createProvider("users", async () => {
        throw error;
      }),
      createProvider("pages", async () => [createResult("a")]),
    ]);

    const result = await useCase.execute(input);

    expect(result.value.groups).toEqual([
      { type: "pages", results: [createResult("a")] },
    ]);
    expect(result.value.failedTypes).toEqual(["users"]);
    expect(onError).toHaveBeenCalledWith("users", error);
  });

  it("times out slow providers", async () => {
    vi.useFakeTimers();
    const { useCase, onError } = createUseCase([
      createProvider(
        "users",
        async () => new Promise<SearchResult[]>(() => undefined),
      ),
      createProvider("pages", async () => [createResult("a")]),
    ]);

    const pending = useCase.execute(input);
    await vi.advanceTimersByTimeAsync(100);
    const result = await pending;

    expect(result.value.failedTypes).toEqual(["users"]);
    expect(result.value.groups).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith(
      "users",
      expect.any(SearchProviderTimeoutError),
    );
  });

  it("works without an error callback", async () => {
    const { useCase } = createUseCase(
      [
        createProvider("users", async () => {
          throw new Error("down");
        }),
      ],
      { onError: undefined },
      { findMembership: vi.fn().mockRejectedValue(new Error("down")) },
    );

    const result = await useCase.execute({
      ...input,
      activeOrganizationId: "org-1",
    });

    expect(result.value.failedTypes).toEqual(["users"]);
  });

  it("resolves the membership of the active organization", async () => {
    const members = createProvider(
      "members",
      async () => [createResult("m1", "members")],
      { kind: "organization", roles: ["owner", "admin"] },
    );
    const membershipPort: ISearchMembershipPort = {
      findMembership: vi
        .fn()
        .mockResolvedValue({ organizationId: "org-1", role: "admin" }),
    };
    const { useCase } = createUseCase([members], {}, membershipPort);

    const result = await useCase.execute({
      ...input,
      activeOrganizationId: "org-1",
    });

    expect(membershipPort.findMembership).toHaveBeenCalledWith({
      userId: "user-1",
      organizationId: "org-1",
    });
    expect(members.search).toHaveBeenCalledWith(
      { term: "ja ne", limit: 2 },
      expect.objectContaining({
        membership: { organizationId: "org-1", role: "admin" },
      }),
    );
    expect(result.value.groups).toHaveLength(1);
  });

  it("skips membership lookups without an active organization", async () => {
    const { useCase, membershipPort } = createUseCase([]);

    await useCase.execute(input);

    expect(membershipPort.findMembership).not.toHaveBeenCalled();
  });

  it("drops organization providers when the membership lookup fails", async () => {
    const error = new Error("lookup failed");
    const members = createProvider("members", async () => [], {
      kind: "organization",
    });
    const { useCase, onError } = createUseCase(
      [members],
      {},
      {
        findMembership: vi.fn().mockRejectedValue(error),
      },
    );

    const result = await useCase.execute({
      ...input,
      activeOrganizationId: "org-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(members.search).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("membership", error);
  });
});
