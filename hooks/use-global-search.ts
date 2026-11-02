import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { SEARCH_TERM_MIN_LENGTH } from "@/features/search/domain/value-objects/search-term.value-object";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { globalSearchAction } from "@/server-functions/search.functions";

const SEARCH_STALE_TIME_MS = 30_000;

export function useGlobalSearch(query: string, enabled: boolean) {
  const term = query.trim().replace(/\s+/g, " ");

  return useQuery({
    queryKey: ["global-search", term],
    queryFn: async () =>
      unwrapActionData(await globalSearchAction({ query: term })),
    enabled: enabled && term.length >= SEARCH_TERM_MIN_LENGTH,
    staleTime: SEARCH_STALE_TIME_MS,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
