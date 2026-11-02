import type {
  SearchContext,
  SearchProviderQuery,
  SearchRequirement,
  SearchResult,
} from "./search.types";

export type ISearchProvider = {
  readonly type: string;
  readonly requirement: SearchRequirement;
  search: (
    query: SearchProviderQuery,
    context: SearchContext,
  ) => Promise<SearchResult[]>;
};
