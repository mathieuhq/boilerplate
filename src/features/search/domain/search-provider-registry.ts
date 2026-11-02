import { DuplicateSearchProviderError } from "./errors/duplicate-search-provider.error";
import type { ISearchProvider } from "./search-provider.interface";
import { meetsSearchRequirement } from "./search-requirement";
import type { SearchContext } from "./search.types";

export class SearchProviderRegistry {
  private readonly providers = new Map<string, ISearchProvider>();

  constructor(providers: readonly ISearchProvider[] = []) {
    providers.forEach((provider) => this.register(provider));
  }

  register(provider: ISearchProvider) {
    if (this.providers.has(provider.type))
      throw new DuplicateSearchProviderError(provider.type);

    this.providers.set(provider.type, provider);

    return this;
  }

  list(): ISearchProvider[] {
    return [...this.providers.values()];
  }

  listAvailable(context: SearchContext): ISearchProvider[] {
    return this.list().filter((provider) =>
      meetsSearchRequirement(provider.requirement, context),
    );
  }
}
