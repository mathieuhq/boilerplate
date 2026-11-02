import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { SearchProviderRegistry } from "../../domain/search-provider-registry";
import type { ISearchProvider } from "../../domain/search-provider.interface";
import type { SearchContext, SearchResult } from "../../domain/search.types";
import { SearchTerm } from "../../domain/value-objects/search-term.value-object";
import type {
  GlobalSearchInputDTO,
  SearchGroupDTO,
  SearchResponseDTO,
} from "../dto/search.dto";
import { SearchProviderTimeoutError } from "../errors/search-provider-timeout.error";
import type { ISearchMembershipPort } from "../ports/search-membership.port";

export type GlobalSearchOptions = {
  limitPerType: number;
  timeoutMs: number;
  onError?: (source: string, error: unknown) => void;
};

type ProviderOutcome =
  | { type: string; status: "fulfilled"; results: SearchResult[] }
  | { type: string; status: "failed" };

export class GlobalSearchUseCase implements IUseCase<
  GlobalSearchInputDTO,
  SearchResponseDTO
> {
  constructor(
    private readonly registry: SearchProviderRegistry,
    private readonly membershipPort: ISearchMembershipPort,
    private readonly options: GlobalSearchOptions,
  ) {}

  async execute(
    input: GlobalSearchInputDTO,
  ): Promise<Result<SearchResponseDTO>> {
    let term: SearchTerm;

    try {
      term = SearchTerm.create(input.query);
    } catch (error) {
      return Result.fail(error as Error);
    }

    const context: SearchContext = {
      userId: input.userId,
      locale: input.locale,
      access: input.access,
      membership: await this.resolveMembership(input),
    };

    const outcomes = await Promise.all(
      this.registry
        .listAvailable(context)
        .map(async (provider) => this.runProvider(provider, term, context)),
    );

    const groups: SearchGroupDTO[] = outcomes.flatMap((outcome) =>
      outcome.status === "fulfilled" && outcome.results.length > 0
        ? [{ type: outcome.type, results: outcome.results }]
        : [],
    );

    return Result.ok({
      query: term.value,
      groups,
      failedTypes: outcomes
        .filter((outcome) => outcome.status === "failed")
        .map((outcome) => outcome.type),
    });
  }

  private async resolveMembership(input: GlobalSearchInputDTO) {
    if (!input.activeOrganizationId) return null;

    try {
      return await this.membershipPort.findMembership({
        userId: input.userId,
        organizationId: input.activeOrganizationId,
      });
    } catch (error) {
      this.options.onError?.("membership", error);
      return null;
    }
  }

  private async runProvider(
    provider: ISearchProvider,
    term: SearchTerm,
    context: SearchContext,
  ): Promise<ProviderOutcome> {
    const { limitPerType, timeoutMs } = this.options;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new SearchProviderTimeoutError(provider.type, timeoutMs)),
        timeoutMs,
      );
    });

    try {
      const results = await Promise.race([
        provider.search({ term: term.value, limit: limitPerType }, context),
        timeout,
      ]);

      return {
        type: provider.type,
        status: "fulfilled",
        results: results
          .slice(0, limitPerType)
          .map((result) => ({ ...result, type: provider.type })),
      };
    } catch (error) {
      this.options.onError?.(provider.type, error);
      return { type: provider.type, status: "failed" };
    } finally {
      clearTimeout(timer);
    }
  }
}
